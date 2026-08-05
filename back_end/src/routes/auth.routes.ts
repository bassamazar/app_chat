import { Router } from 'express';
import { register, login } from '../controllers/auth.controller';

const router = Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username: { type: string }
 *               password: { type: string }
 *     responses:
 *       201: { description: "User registered successfully" }
 *       400: { description: "Username already exists or validation error" }
 * 
 * /api/auth/login:
 *   post:
 *     summary: Login to get a JWT token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: "Token returned" }
 *       401: { description: "Invalid credentials" }
 */
router.post('/register', register);
router.post('/login', login);

export default router;