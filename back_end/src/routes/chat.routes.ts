import { Router } from 'express';
import { createConversation , getConversationMessages } from '../controllers/chat.controller';
import { protectRoute } from '../middlewares/auth.middleware';


const router = Router();

// لاحظ كيف وضعنا protectRoute قبل الدالة الأساسية لحماية المسار
router.post('/', protectRoute, createConversation);
router.get('/:conversationId/messages',protectRoute, getConversationMessages);

export default router;