import { Response } from 'express';
import prisma from '../config/db';

export const createGroup = async (req: any, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user.userId;
    const { title, participantIds } = req.body; 

    if (!title || !participantIds || participantIds.length < 2) {
      res.status(400).json({ message: 'Title and at least TWO participants are required' });
      return;
    }

    const newGroup = await prisma.conversation.create({
      data: {
        isGroup: true,
        title: title,
        participants: {
          create: [
            { userId: currentUserId, role: 'ADMIN', status: 'ACCEPTED' },
            ...participantIds.map((id: string) => ({
              userId: id,
              role: 'MEMBER',
              status: 'ACCEPTED' 
            }))
          ]
        }
      }
    });

    res.status(201).json({ message: 'Group created successfully', group: newGroup });
  } catch (error) {
    console.error('Create Group Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getGroups = async (req: any, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user.userId;

    const groups = await prisma.conversation.findMany({
      where: {
        isGroup: true,
        participants: {
          some: { userId: currentUserId, status: 'ACCEPTED' }
        }
      },
      include: {
        participants: {
          include: { user: true }
        }
      }
    });

    const formattedGroups = groups.map(group => ({
      id: group.id, 
      conversationId: group.id,
      username: group.title, 
      isGroup: true,
      participantsCount: group.participants.length,
      participants: group.participants.map(p => ({
        id: p.userId,
        username: p.user.username,
        role: p.role
      })),
      isOnline: true 
    }));

    res.status(200).json(formattedGroups);
  } catch (error) {
    console.error('Get Groups Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// دالة إضافة عضو للقروب مع إرسال رسالة نظام
export const addMemberToGroup = async (req: any, res: Response): Promise<void> => {
  try {
    const { groupId, userId } = req.body;
    const currentUserId = req.user.userId;

    const currentUserParticipant = await prisma.participant.findUnique({
      where: { userId_conversationId: { userId: currentUserId, conversationId: groupId } }
    });

    if (!currentUserParticipant || currentUserParticipant.role !== 'ADMIN') {
      res.status(403).json({ message: 'Only admins can add members' });
      return;
    }

    await prisma.participant.create({
      data: {
        userId: userId,
        conversationId: groupId,
        role: 'MEMBER',
        status: 'ACCEPTED'
      }
    });

    const addedUser = await prisma.user.findUnique({ where: { id: userId } });
    
    // إنشاء رسالة نظام وتخزينها بالداتابيس
    const systemMessage = await prisma.message.create({
      data: {
        content: `system: ${addedUser?.username || 'A new user'} was added to the group.`,
        conversationId: groupId,
        senderId: currentUserId
      }
    });

    // إرسال الرسالة فوري لكل الي بالقروب عبر السوكيت
    const io = req.app.get('io');
    if (io) {
      io.to(groupId).emit('receive_message', systemMessage);
    }

    res.status(200).json({ message: 'Member added successfully' });
  } catch (error) {
    console.error('Add Member Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// دالة حذف عضو مع إرسال رسالة نظام
export const removeMemberFromGroup = async (req: any, res: Response): Promise<void> => {
  try {
    const { groupId, userId } = req.body;
    const currentUserId = req.user.userId;

    const currentUserParticipant = await prisma.participant.findUnique({
      where: { userId_conversationId: { userId: currentUserId, conversationId: groupId } }
    });

    if (currentUserId !== userId && (!currentUserParticipant || currentUserParticipant.role !== 'ADMIN')) {
      res.status(403).json({ message: 'Only admins can remove other members' });
      return;
    }

    const removedUser = await prisma.user.findUnique({ where: { id: userId } });

    await prisma.participant.delete({
      where: { userId_conversationId: { userId: userId, conversationId: groupId } }
    });

    // إنشاء رسالة نظام وتخزينها بالداتابيس
    const systemMessage = await prisma.message.create({
      data: {
        content: `system: ${removedUser?.username || 'A user'} left or was removed from the group.`,
        conversationId: groupId,
        senderId: currentUserId
      }
    });

    // إرسال الرسالة فوري عبر السوكيت
    const io = req.app.get('io');
    if (io) {
      io.to(groupId).emit('receive_message', systemMessage);
    }

    res.status(200).json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove Member Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};