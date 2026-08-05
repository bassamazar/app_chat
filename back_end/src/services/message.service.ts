import prisma from '../config/db';

export const createMessage = async (senderId: string, conversationId: string, content: string) => {
  return await prisma.message.create({
    data: {
      senderId,
      conversationId,
      content,
    },
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