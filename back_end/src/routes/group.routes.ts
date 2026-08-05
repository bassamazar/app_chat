import { Router } from 'express';
import { createGroup, getGroups, addMemberToGroup, removeMemberFromGroup } from '../controllers/group.controller';
import { protectRoute } from '../middlewares/auth.middleware';

const router = Router();

router.use(protectRoute);

router.post('/create', createGroup);
router.get('/', getGroups);
router.post('/add-member', addMemberToGroup); // 🆕
router.post('/remove-member', removeMemberFromGroup); // 🆕

export default router;