import { Router } from 'express';
import { toggleBlockUser, getBlockedUsers } from '../controllers/block.controller';
import { protectRoute } from '../middlewares/auth.middleware';

const router = Router();
router.use(protectRoute);
/**
 * @openapi
 * /api/blocks:
 *   get:
 *     summary: Get blocked users lists
 *     tags: [Blocks]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "Returns blockedByMe and allHidden lists" }
 * 
 * /api/blocks/toggle:
 *   post:
 *     summary: Block or unblock a user
 *     tags: [Blocks]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               targetUserId: { type: string }
 *     responses:
 *       200: { description: "User block status toggled" }
 */
router.post('/toggle', toggleBlockUser);
router.get('/', getBlockedUsers);

export default router;