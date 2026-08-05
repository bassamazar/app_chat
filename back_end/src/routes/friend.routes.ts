import { Router } from 'express';
import { 
  sendFriendRequest, 
  getFriendRequests, 
  acceptFriendRequest, 
  rejectFriendRequest, 
  getFriends,
  getSentRequests // استيراد الدالة الجديدة
} from '../controllers/friend.controller';
import { protectRoute } from '../middlewares/auth.middleware';

const router = Router();

router.use(protectRoute);
/**
 * @openapi
 * /api/friends/request:
 *   post:
 *     summary: Send a friend request
 *     tags: [Friends]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username: { type: string }
 *     responses:
 *       200: { description: "Request sent successfully" }
 *       404: { description: "User not found" }
 * 
 * /api/friends/requests:
 *   get:
 *     summary: Get received friend requests
 *     tags: [Friends]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "List of received pending requests" }
 * 
 * /api/friends/requests/sent:
 *   get:
 *     summary: Get sent friend requests
 *     tags: [Friends]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "List of sent pending requests" }
 * 
 * /api/friends/accept:
 *   post:
 *     summary: Accept a friend request
 *     tags: [Friends]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               requestId: { type: string }
 *     responses:
 *       200: { description: "Request accepted" }
 * 
 * /api/friends/reject:
 *   post:
 *     summary: Reject a friend request
 *     tags: [Friends]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               requestId: { type: string }
 *     responses:
 *       200: { description: "Request rejected" }
 */
router.post('/request', sendFriendRequest);
router.get('/requests', getFriendRequests);
router.get('/requests/sent', getSentRequests); // 🆕 إضافة المسار الجديد
router.post('/accept', acceptFriendRequest);
router.post('/reject', rejectFriendRequest);
router.get('/', getFriends);

export default router;