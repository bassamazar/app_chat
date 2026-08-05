import { Router } from 'express';
import { createConversation , getConversationMessages } from '../controllers/chat.controller';
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
 */
router.post('/', protectRoute, createConversation);
router.get('/:conversationId/messages',protectRoute, getConversationMessages);

export default router;