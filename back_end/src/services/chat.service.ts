import prisma from '../config/db';

export const createOrGetDirectConversation = async (currentUserId: string, targetUserId: string) => {
  // 1. التحقق مما إذا كانت هناك محادثة سابقة (مهما كانت حالتها)
  const existingConversation = await prisma.conversation.findFirst({
    where: {
      isGroup: false,
      AND: [
        { participants: { some: { userId: currentUserId } } },
        { participants: { some: { userId: targetUserId } } }
      ]
    },
    include: {
      participants: {
        include: { user: { select: { id: true, username: true, email: true } } }
      }
    }
  });

  if (existingConversation) {
    return existingConversation;
  }

  // 2. إنشاء المحادثة بنظام الطلبات الجديد
  const newConversation = await prisma.conversation.create({
    data: {
      isGroup: false,
      participants: {
        create: [
          { 
            userId: currentUserId, 
            status: 'ACCEPTED' // المرسل موافق تلقائياً
          },
          { 
            userId: targetUserId, 
            status: 'PENDING'  // المستقبل قيد الانتظار
          }
        ]
      }
    },
    include: {
      participants: {
        include: { user: { select: { id: true, username: true, email: true } } }
      }
    }
  });

  return newConversation;
};

export const createGroupConversation = async (creatorId: string, title: string, participantIds: string[]) => {
  // إضافة منشئ المجموعة كـ ADMIN، وباقي الأعضاء كـ MEMBER
  const participantsData = [
    { userId: creatorId, role: 'ADMIN' as const, status: 'ACCEPTED' as const },
    ...participantIds.map(id => ({ userId: id, role: 'MEMBER' as const, status: 'ACCEPTED' as const }))
  ];

  const groupConversation = await prisma.conversation.create({
    data: {
      isGroup: true,
      title,
      participants: {
        create: participantsData
      }
    },
    include: {
      participants: {
        include: { user: { select: { id: true, username: true } } }
      }
    }
  });

  return groupConversation;
};

export const respondToMessageRequest = async (userId: string, conversationId: string, newStatus: 'ACCEPTED' | 'REJECTED') => {
  // 1. التأكد من أن المستخدم جزء من هذه المحادثة
  const participant = await prisma.participant.findUnique({
    where: {
      userId_conversationId: {
        userId: userId,
        conversationId: conversationId
      }
    }
  });

  if (!participant) {
    throw new Error('لم يتم العثور على طلب مراسلة لك في هذه المحادثة');
  }

  if (participant.status !== 'PENDING') {
    throw new Error('لقد قمت بالرد على هذا الطلب مسبقاً');
  }

  // 2. تحديث الحالة
  const updatedParticipant = await prisma.participant.update({
    where: { id: participant.id },
    data: { status: newStatus }
  });

  return updatedParticipant;
};

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

