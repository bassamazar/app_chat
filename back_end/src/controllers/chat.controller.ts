import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import * as chatService from '../services/chat.service';
import * as messageService from '../services/message.service';

export const createConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user!.userId;
    const { isGroup, targetUserId, title, participantIds } = req.body;

    if (!isGroup) {
      if (!targetUserId) {
        res.status(400).json({ error: 'يجب تحديد المستخدم الآخر (targetUserId) للمحادثة الفردية' });
        return;
      }
      
      const conversation = await chatService.createOrGetDirectConversation(currentUserId, targetUserId);
      res.status(200).json(conversation);
    } else {
      if (!title || !participantIds || !Array.isArray(participantIds)) {
        res.status(400).json({ error: 'المحادثة الجماعية تتطلب عنواناً (title) وقائمة بالأعضاء (participantIds)' });
        return;
      }

      const conversation = await chatService.createGroupConversation(currentUserId, title, participantIds);
      res.status(201).json(conversation);
    }
  } catch (error: any) {
    res.status(500).json({ error: 'حدث خطأ أثناء إنشاء المحادثة', details: error.message });
  }
};

export const respondToRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user!.userId;
    const conversationId = String(req.params.conversationId); 
    const { status } = req.body;

    if (!['ACCEPTED', 'REJECTED'].includes(status)) {
      res.status(400).json({ error: 'الحالة المدخلة غير صحيحة، يجب أن تكون ACCEPTED أو REJECTED' });
      return;
    }

    const updatedParticipant = await chatService.respondToMessageRequest(
      currentUserId, 
      conversationId, 
      status as 'ACCEPTED' | 'REJECTED'
    );
    
    res.status(200).json({ 
      message: 'تم تحديث حالة طلب المراسلة بنجاح', 
      participant: updatedParticipant 
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// دالة جلب الرسائل الخاصة بمحادثة معينة
export const getConversationMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const conversationId = String(req.params.conversationId);
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

    const messages = await messageService.getMessagesByConversationId(conversationId, limit, offset);

    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'حدث خطأ أثناء جلب الرسائل', details: error.message });
  }
};