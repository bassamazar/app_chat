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

router.post('/request', sendFriendRequest);
router.get('/requests', getFriendRequests);
router.get('/requests/sent', getSentRequests); // 🆕 إضافة المسار الجديد
router.post('/accept', acceptFriendRequest);
router.post('/reject', rejectFriendRequest);
router.get('/', getFriends);

export default router;