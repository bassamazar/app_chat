import { Response } from 'express';
import prisma from '../config/db';

// حظر أو إلغاء حظر مستخدم
export const toggleBlockUser = async (req: any, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user.userId;
    const { targetUserId } = req.body;

    if (currentUserId === targetUserId) {
      res.status(400).json({ message: "You can't block yourself" });
      return;
    }

    const existingBlock = await prisma.block.findUnique({
      where: {
        blockerId_blockedId: { blockerId: currentUserId, blockedId: targetUserId }
      }
    });

    if (existingBlock) {
      await prisma.block.delete({
        where: { id: existingBlock.id }
      });
      res.status(200).json({ message: 'User unblocked successfully', isBlocked: false });
    } else {
      await prisma.block.create({
        data: { blockerId: currentUserId, blockedId: targetUserId }
      });
      res.status(200).json({ message: 'User blocked successfully', isBlocked: true });
    }
  } catch (error) {
    console.error('Toggle Block Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// جلب قائمة الأشخاص المحظورين والأشخاص اللي حظوروني (أو المحظورين مني فقط)
export const getBlockedUsers = async (req: any, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user.userId;
    
    // جلب كل الحظر المرتبط فيك (سواء أنت حظرت أو هم حظروك)
    const blocks = await prisma.block.findMany({
      where: {
        OR: [
          { blockerId: currentUserId },
          { blockedId: currentUserId }
        ]
      }
    });

    // 1. قائمة لمن حظرتهم أنت (للأزرار ومنع الإرسال)
    const blockedByMe = blocks.filter(b => b.blockerId === currentUserId).map(b => b.blockedId);
    
    // 2. قائمة بكل من يوجد بينك وبينه حظر (لإخفاء الرسائل المتبادل في القروبات)
    const allHidden = blocks.map(b => b.blockerId === currentUserId ? b.blockedId : b.blockerId);

    res.status(200).json({ blockedByMe, allHidden });
  } catch (error) {
    console.error('Get Blocks Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};