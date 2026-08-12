import express from 'express';
import { uploadFile } from '../controllers/upload.controller';
import { protectRoute } from '../middlewares/auth.middleware';
import { upload } from '../config/cloudinary';

const router = express.Router();

/**
 * @openapi
 * /api/upload:
 *   post:
 *     summary: Upload a file (image, audio, document)
 *     tags: [Upload]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200: { description: "File uploaded successfully" }
 *       400: { description: "No file provided" }
 */

// هون بنستخدم multer (upload.single('file')) عشان يمسك الملف اللي جاي باسم 'file'
router.post('/', protectRoute, upload.single('file'), uploadFile);

export default router;