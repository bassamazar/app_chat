import { Server, Socket } from 'socket.io';
import { registerChatEvents } from './chat.events';
import prisma from '../config/db'; // تم التعديل هنا لاستخدام اتصال قاعدة البيانات الخاص بك

export const handleConnection = async (io: Server, socket: Socket) => {
  console.log(`⚡ A user connected, socket ID: ${socket.id}`);

  // استخراج الـ userId من الـ handshake (يتم إرساله من الفرونت إند عند الاتصال)
  const userId = socket.handshake.auth?.userId || socket.handshake.query?.userId;

  if (userId) {
    // تخزين الـ userId في السوكيت نفسه للرجوع إليه لاحقاً
    socket.data.userId = userId;

    try {
      // 1. تحديث حالة المستخدم في الداتابيس إلى "متصل"
      await prisma.user.update({
        where: { id: userId },
        data: { isOnline: true },
      });

      // 2. إعلام الجميع أن هذا المستخدم قد أصبح متصلاً (Online)
      io.emit('user_status_changed', { userId, isOnline: true });
    } catch (error) {
      console.error('Error updating user to online:', error);
    }
  }

  // تفعيل أحداث الشات لهذا المستخدم
  registerChatEvents(io, socket);

  socket.on('disconnect', async () => {
    console.log(`❌ User disconnected: ${socket.id}`);
    
    if (socket.data.userId) {
      try {
        // 1. تحديث حالة المستخدم في الداتابيس إلى "غير متصل"
        await prisma.user.update({
          where: { id: socket.data.userId },
          data: { isOnline: false },
        });

        // 2. إعلام الجميع أن هذا المستخدم قد فصل (Offline)
        io.emit('user_status_changed', { userId: socket.data.userId, isOnline: false });
      } catch (error) {
        console.error('Error updating user to offline:', error);
      }
    }
  });
};