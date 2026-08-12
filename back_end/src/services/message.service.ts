import prisma from '../config/db';

export const createMessage = async (
  senderId: string,
  conversationId: string,
  content?: string | null, // 👈 هون حلينا الإيرور
  type: 'TEXT' | 'IMAGE' | 'AUDIO' | 'FILE' = 'TEXT',
  fileUrl?: string | null,
  fileName?: string | null
) => {
  return await prisma.message.create({
    data: {
      senderId,
      conversationId,
      content: content || null, // عشان لو مافي نص يخزنه null بدل ما يعطي إيرور
      type,
      fileUrl: fileUrl || null,
      fileName: fileName || null,
    },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          avatarUrl: true, // 👈 رجعنالك إياها زي ما كانت بكودك
        },
      },
    },
  });
};

// إضافة دالة جلب الرسائل للمحادثة
export const getMessagesByConversationId = async (conversationId: string, limit = 50, offset = 0) => {
  return await prisma.message.findMany({
    where: { conversationId },
    take: limit,
    skip: offset,
    orderBy: { createdAt: 'asc' }, // الرسائل الأقدم للأحدث
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      },
    },
  });
};