import { Router } from 'express';
import { createGroup, getGroups, addMemberToGroup, removeMemberFromGroup } from '../controllers/group.controller';
import { protectRoute } from '../middlewares/auth.middleware';

const router = Router();

router.use(protectRoute);
/**
 * @openapi
 * /api/groups:
 *   get:
 *     summary: Get all groups the user is part of
 *     tags: [Groups]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "List of groups" }
 * 
 * /api/groups/create:
 *   post:
 *     summary: Create a new group
 *     tags: [Groups]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               participantIds:
 *                 type: array
 *                 items: { type: string }
 *     responses:
 *       201: { description: "Group created successfully" }
 * 
 * /api/groups/add-member:
 *   post:
 *     summary: Add a member to a group
 *     tags: [Groups]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               groupId: { type: string }
 *               userId: { type: string }
 *     responses:
 *       200: { description: "Member added successfully" }
 * 
 * /api/groups/remove-member:
 *   post:
 *     summary: Remove a member from a group (or leave group)
 *     tags: [Groups]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               groupId: { type: string }
 *               userId: { type: string }
 *     responses:
 *       200: { description: "Member removed successfully" }
 */
router.post('/create', createGroup);
router.get('/', getGroups);
router.post('/add-member', addMemberToGroup); // 🆕
router.post('/remove-member', removeMemberFromGroup); // 🆕

export default router;