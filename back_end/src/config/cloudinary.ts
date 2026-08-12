import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

// تهيئة الاتصال مع كلاوديناري
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// إعداد Multer عشان يستقبل الملفات ويحفظها بالـ Memory (الذاكرة المؤقتة) 
// بدل ما يحفظها على الهارد ديسك تبع السيرفر
const storage = multer.memoryStorage();

export const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // الحد الأقصى للملف 10 ميجا بايت
  }
});

export default cloudinary;