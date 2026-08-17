import { Router } from 'express';
import { createConversation, getConversationMessages, summarizeConversation,getQuickReplies ,transcribeAudio} from '../controllers/chat.controller';
import { protectRoute } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @openapi
 * /api/chats:
 *   post:
 *     summary: Create a new direct conversation
 *     tags: [Chats]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               participantId: { type: string }
 *     responses:
 *       201: { description: "Conversation created successfully" }
 * 
 * /api/chats/{conversationId}/messages:
 *   get:
 *     summary: Get messages for a specific conversation
 *     tags: [Chats]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: "List of messages" }
 *       404: { description: "Conversation not found" }
 * 
 * /api/chats/{conversationId}/summary:
 *   get:
 *     summary: Get AI-generated summary of the conversation
 *     tags: [Chats]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         required: false
 *         schema: { type: integer }
 *         description: Number of messages to summarize (default is 40)
 *     responses:
 *       200: { description: "Conversation summary generated" }
 *       400: { description: "No messages to summarize" }
 *       404: { description: "Conversation not found" }
 *       500: { description: "Failed to generate summary" }
 */
router.post('/', protectRoute, createConversation);
router.get('/:conversationId/messages', protectRoute, getConversationMessages);
router.get('/:conversationId/summary', protectRoute, summarizeConversation); // 🆕 الراوت الجديد للتلخيص
router.post('/quick-replies', protectRoute, getQuickReplies);
router.post('/transcribe', protectRoute, transcribeAudio);
export default router;