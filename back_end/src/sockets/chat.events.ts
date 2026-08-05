import { Server, Socket } from 'socket.io';
import * as messageService from '../services/message.service';

export const registerChatEvents = (io: Server, socket: Socket) => {
  // الانضمام إلى محادثة معينة (غرفة)
  socket.on('join_conversation', (conversationId: string) => {
    socket.join(conversationId);
    console.log(`User joined room: ${conversationId}`);
  });

  // استقبال الرسالة وحفظها وبثها
  socket.on('send_message', async (data: { senderId: string; conversationId: string; content: string }) => {
    try {
      // 1. حفظ الرسالة في قاعدة البيانات
      const savedMessage = await messageService.createMessage(
        data.senderId,
        data.conversationId,
        data.content
      );

      // 2. بث الرسالة لكل المتواجدين في نفس المحادثة
      io.to(data.conversationId).emit('receive_message', savedMessage);
      
    } catch (error: any) {
      console.error('Error saving message via socket:', error.message);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
};