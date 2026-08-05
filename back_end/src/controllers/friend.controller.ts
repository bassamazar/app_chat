import { Response } from 'express';
import prisma from '../config/db';

export const sendFriendRequest = async (req: any, res: Response): Promise<void> => {
  try {
    const { username } = req.body;
    const currentUserId = req.user.userId;

    const targetUser = await prisma.user.findUnique({ where: { username } });
    if (!targetUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (targetUser.id === currentUserId) {
      res.status(400).json({ message: "You can't add yourself" });
      return;
    }

    const existingConversation = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        AND: [
          { participants: { some: { userId: currentUserId } } },
          { participants: { some: { userId: targetUser.id } } },
        ],
      },
    });

    if (existingConversation) {
      res.status(400).json({ message: 'Friend request already sent or you are already friends' });
      return;
    }

    const newConversation = await prisma.conversation.create({
      data: {
        isGroup: false,
        participants: {
          create: [
            { userId: currentUserId, status: 'ACCEPTED', role: 'ADMIN' },
            { userId: targetUser.id, status: 'PENDING', role: 'MEMBER' },
          ],
        },
      },
    });

    res.status(201).json({ message: 'Friend request sent successfully', conversationId: newConversation.id });
  } catch (error) {
    console.error('Send Request Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getFriendRequests = async (req: any, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user.userId;

    const requests = await prisma.participant.findMany({
      where: {
        userId: currentUserId,
        status: 'PENDING',
      },
      include: {
        conversation: {
          include: {
            participants: { include: { user: true } },
          },
        },
      },
    });

    const formattedRequests = requests.map((req) => {
      const senderParticipant = req.conversation.participants.find((p) => p.userId !== currentUserId);
      return {
        id: req.conversationId, 
        username: senderParticipant?.user.username,
        email: senderParticipant?.user.email,
      };
    });

    res.status(200).json(formattedRequests);
  } catch (error) {
    console.error('Get Requests Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 🆕 الدالة الجديدة: جلب الطلبات اللي إنت بعثتها وتتبع حالتها
export const getSentRequests = async (req: any, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user.userId;

    const conversations = await prisma.conversation.findMany({
      where: {
        isGroup: false,
        participants: {
          some: { userId: currentUserId, status: 'ACCEPTED' },
        },
      },
      include: {
        participants: { include: { user: true } },
      },
    });

    // بنفلتر المحادثات اللي الطرف الثاني لسا PENDING أو REJECTED
    const sentRequests = conversations
      .filter((conv) => {
        const otherUser = conv.participants.find((p) => p.userId !== currentUserId);
        return otherUser && (otherUser.status === 'PENDING' || otherUser.status === 'REJECTED');
      })
      .map((conv) => {
        const otherUser = conv.participants.find((p) => p.userId !== currentUserId);
        return {
          id: conv.id,
          username: otherUser?.user.username,
          status: otherUser?.status, // راح ترجع PENDING أو REJECTED
        };
      });

    res.status(200).json(sentRequests);
  } catch (error) {
    console.error('Get Sent Requests Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const acceptFriendRequest = async (req: any, res: Response): Promise<void> => {
  try {
    const { requestId } = req.body;
    const currentUserId = req.user.userId;

    await prisma.participant.update({
      where: {
        userId_conversationId: { userId: currentUserId, conversationId: requestId },
      },
      data: { status: 'ACCEPTED' },
    });

    res.status(200).json({ message: 'Friend request accepted' });
  } catch (error) {
    console.error('Accept Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const rejectFriendRequest = async (req: any, res: Response): Promise<void> => {
  try {
    const { requestId } = req.body;
    const currentUserId = req.user.userId;
    
    // 🔧 التعديل: تحديث الحالة لـ REJECTED بدل حذف المحادثة عشان المرسل يعرف إنه انرفض
    await prisma.participant.update({
      where: {
        userId_conversationId: { userId: currentUserId, conversationId: requestId },
      },
      data: { status: 'REJECTED' },
    });

    res.status(200).json({ message: 'Friend request rejected' });
  } catch (error) {
    console.error('Reject Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getFriends = async (req: any, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user.userId;

    const conversations = await prisma.conversation.findMany({
      where: {
        isGroup: false,
        participants: {
          some: { userId: currentUserId, status: 'ACCEPTED' },
        },
      },
      include: {
        participants: { include: { user: true } },
      },
    });

    // 🔧 التعديل (إغلاق الثغرة): لازم نتأكد إن الطرف الثاني كمان ACCEPTED
    const friends = conversations
      .filter((conv) => {
        const friendParticipant = conv.participants.find((p) => p.userId !== currentUserId);
        return friendParticipant && friendParticipant.status === 'ACCEPTED';
      })
      .map((conv) => {
        const friendParticipant = conv.participants.find((p) => p.userId !== currentUserId);
        return {
          id: friendParticipant?.user.id,
          username: friendParticipant?.user.username,
          email: friendParticipant?.user.email,
          conversationId: conv.id,
          isOnline: friendParticipant?.user.isOnline || false, 
        };
      });

    res.status(200).json(friends);
  } catch (error) {
    console.error('Get Friends Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};