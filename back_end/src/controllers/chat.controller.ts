import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import * as chatService from '../services/chat.service';
import * as messageService from '../services/message.service';
import axios from 'axios'; 
import prisma from '../config/db'; 

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

// ==========================================
// 🤖 🆕 دالة تلخيص المحادثة عبر الذكاء الاصطناعي
// ==========================================
export const summarizeConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const conversationId = String(req.params.conversationId);
    // يمكنك تحديد العدد من الفرونت إند، أو اعتماد 40 رسالة كحد افتراضي
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 40;

    // 1. التأكد من وجود المحادثة
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) {
      res.status(404).json({ error: 'المحادثة غير موجودة' });
      return;
    }

    // 2. جلب آخر الرسائل من قاعدة البيانات مع بيانات المرسل (تم الاعتماد على username فقط)
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        sender: { select: { username: true } } // الإصلاح: إزالة name
      }
    });

    if (!messages || messages.length === 0) {
      res.status(400).json({ error: 'لا يوجد رسائل لتلخيصها' });
      return;
    }

    // 3. ترتيب الرسائل زمنياً (من الأقدم للأحدث) لتكون مفهومة للذكاء الاصطناعي
    messages.reverse();

    // 4. تجهيز الشكل المطلوب لمراسلة سيرفر بايثون
    const formattedMessages = messages.map(msg => ({
      // الإصلاح: الاعتماد فقط على username
      sender: msg.sender?.username || 'مستخدم غير معروف',
      content: msg.content || '[مرفق أو ملف]'
    }));

    // 5. إرسال الطلب إلى سيرفر بايثون (FastAPI) عبر Axios
    const aiResponse = await axios.post('http://127.0.0.1:8000/api/summarize', {
      messages: formattedMessages,
      limit_info: `آخر ${messages.length} رسالة`
    });

    // 6. إرجاع التلخيص للواجهة الأمامية
    res.status(200).json({
      success: true,
      summary: aiResponse.data.summary
    });

  } catch (error: any) {
    console.error('Error generating summary:', error.message);
    res.status(500).json({ error: 'حدث خطأ أثناء تلخيص المحادثة', details: error.message });
  }
};

// ==========================================
// 🤖 🆕 دالة جلب الردود السريعة المقترحة
// ==========================================
export const getQuickReplies = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { message } = req.body;
    if (!message) {
      res.status(400).json({ error: 'نص الرسالة مطلوب' });
      return;
    }
    
    // إرسال الطلب لسيرفر الذكاء الاصطناعي
    const aiResponse = await axios.post('http://127.0.0.1:8000/api/quick-replies', { message });
    
    res.status(200).json({ success: true, replies: aiResponse.data.replies });
  } catch (error: any) {
    console.error('Error generating quick replies:', error.message);
    res.status(500).json({ error: 'حدث خطأ أثناء توليد الردود السريعة' });
  }
};

// ==========================================
// 🤖 🆕 دالة تفريغ الصوت إلى نص
// ==========================================
export const transcribeAudio = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { audioBase64, mimeType } = req.body;
    if (!audioBase64) {
      res.status(400).json({ error: 'البيانات الصوتية مطلوبة' });
      return;
    }

    // تمرير البيانات المجهزة لسيرفر الذكاء الاصطناعي
    const aiResponse = await axios.post('http://127.0.0.1:8000/api/transcribe', {
      audio_base64: audioBase64,
      mime_type: mimeType || 'audio/webm'
    });

    res.status(200).json({ success: true, text: aiResponse.data.text });
  } catch (error: any) {
    console.error('Error transcribing audio:', error.message);
    res.status(500).json({ error: 'حدث خطأ أثناء تفريغ الصوت' });
  }
};