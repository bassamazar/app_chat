import { Server, Socket } from 'socket.io';
import * as messageService from '../services/message.service';
import prisma from '../config/db';

export const registerChatEvents = (io: Server, socket: Socket) => {
  // الانضمام إلى محادثة معينة (غرفة)
  socket.on('join_conversation', (conversationId: string) => {
    socket.join(conversationId);
    console.log(`User joined room: ${conversationId}`);
  });

  // استقبال الرسالة وحفظها وبثها
  // 🆕 تم تعديل الـ data عشان تستقبل نوع الرسالة وروابط الملفات
  socket.on('send_message', async (data: { 
    senderId: string; 
    conversationId: string; 
    content?: string; 
    type?: 'TEXT' | 'IMAGE' | 'AUDIO' | 'FILE'; 
    fileUrl?: string; 
    fileName?: string;
  }) => {
    try {
      // 1. جلب المحادثة لمعرفة هل هي قروب أم محادثة فردية (Direct Chat)
      const conversation = await prisma.conversation.findUnique({
        where: { id: data.conversationId },
        include: { participants: true }
      });

      if (!conversation) {
        socket.emit('error', { message: 'Conversation not found' });
        return;
      }

      // 2. إذا كانت المحادثة فردية، نتحقق من وجود حظر بين الطرفين
      if (!conversation.isGroup) {
        const otherParticipant = conversation.participants.find(p => p.userId !== data.senderId);

        if (otherParticipant) {
          const isBlocked = await prisma.block.findFirst({
            where: {
              OR: [
                { blockerId: data.senderId, blockedId: otherParticipant.userId },
                { blockerId: otherParticipant.userId, blockedId: data.senderId }
              ]
            }
          });

          if (isBlocked) {
            // 🛑 إذا كان هناك حظر بالشات الفردي (زي جميل):
            // نبعث الرسالة الوهمية لجميل لحاله عشان ما يشك، وبدون ما نحفظها بالداتابيس ولا نبعثها للطرف الثاني!
            socket.emit('receive_message', {
              id: `fake-${Date.now()}`, // آي دي وهمي عشان الواجهة ما تضرب
              senderId: data.senderId,
              conversationId: data.conversationId,
              content: data.content || null,
              type: data.type || 'TEXT', // 🆕 إضافة نوع الرسالة الوهمية
              fileUrl: data.fileUrl || null, // 🆕 إضافة رابط الملف
              fileName: data.fileName || null, // 🆕 إضافة اسم الملف
              createdAt: new Date()
            });
            return; // نوقف الشغل هون وما نكمل حفظ
          }
        }
      }

      // 3. حفظ الرسالة في قاعدة البيانات (بما أنه لا يوجد حظر يمنع ذلك)
      // 🆕 تمرير البيانات الجديدة لدالة الحفظ
      const savedMessage = await messageService.createMessage(
        data.senderId,
        data.conversationId,
        data.content,
        data.type || 'TEXT',
        data.fileUrl,
        data.fileName
      );

      // 4. بث الرسالة لكل المتواجدين في نفس المحادثة
      io.to(data.conversationId).emit('receive_message', savedMessage);
      
    } catch (error: any) {
      console.error('Error saving message via socket:', error.message);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
};