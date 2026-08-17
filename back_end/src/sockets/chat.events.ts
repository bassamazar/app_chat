import { Server, Socket } from 'socket.io';
import * as messageService from '../services/message.service';
import prisma from '../config/db';
import axios from 'axios'; // 🆕 استدعاء أكسيوس للتواصل مع سيرفر بايثون

export const registerChatEvents = (io: Server, socket: Socket) => {
  // الانضمام إلى محادثة معينة (غرفة)
  socket.on('join_conversation', (conversationId: string) => {
    socket.join(conversationId);
    console.log(`User joined room: ${conversationId}`);
  });

  // استقبال الرسالة وحفظها وبثها
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
            // 🛑 إذا كان هناك حظر بالشات الفردي:
            // نبعث الرسالة الوهمية لحاله عشان ما يشك، وبدون ما نحفظها بالداتابيس ولا نبعثها للطرف الثاني!
            socket.emit('receive_message', {
              id: `fake-${Date.now()}`,
              senderId: data.senderId,
              conversationId: data.conversationId,
              content: data.content || null,
              type: data.type || 'TEXT',
              fileUrl: data.fileUrl || null,
              fileName: data.fileName || null,
              createdAt: new Date()
            });
            return;
          }
        }
      }

      // 3. حفظ الرسالة في قاعدة البيانات
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
      
      // ==========================================
      // 🤖 5. الربط مع سيرفر الذكاء الاصطناعي (Python)
      // ==========================================
      const messageText = data.content?.trim() || '';
      
      // فحص إذا كانت الرسالة نصية وتبدأ بكلمة @bot
      if ((data.type === 'TEXT' || !data.type) && messageText.startsWith('@bot ')) {
        const userQuery = messageText.replace('@bot ', ''); // تنظيف النص وإزالة كلمة @bot
        
        try {
          // إرسال النص لسيرفر البايثون اللي شغال على بورت 8000
          const aiResponse = await axios.post('http://127.0.0.1:8000/api/chat', {
            message: userQuery
          });
          
          const botReply = aiResponse.data.reply;

          // إنشاء رسالة البوت وبثها كرسالة نظام (System Message)
          const botMessage = {
            id: `bot-${Date.now()}`,
            senderId: 'system',
            conversationId: data.conversationId,
            content: `system:🤖 ${botReply}`, // الـ UI مبرمج يعرض أي شي ببلش بـ system: بالنص
            type: 'TEXT',
            createdAt: new Date()
          };

          // بث رسالة البوت للشات بدون حفظها بالداتابيس (كأنها رسالة عابرة)
          io.to(data.conversationId).emit('receive_message', botMessage);

        } catch (aiError) {
          console.error('Error connecting to AI Python Server:', aiError);
          // في حال كان سيرفر البايثون طافي أو فيه مشكلة
          const errorMsg = {
            id: `bot-err-${Date.now()}`,
            senderId: 'system',
            conversationId: data.conversationId,
            content: `system:❌ عذراً، خادم الذكاء الاصطناعي غير متصل حالياً.`,
            type: 'TEXT',
            createdAt: new Date()
          };
          io.to(data.conversationId).emit('receive_message', errorMsg);
        }
      }
      // ==========================================

    } catch (error: any) {
      console.error('Error saving message via socket:', error.message);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
};