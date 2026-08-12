import { Response } from 'express';
import cloudinary from '../config/cloudinary';
import streamifier from 'streamifier'; // مكتبة صغيرة عشان نحول البفر لستريم

export const uploadFile = async (req: any, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file provided' });
      return;
    }

    // عشان نقدر نرفع من الـ Memory، لازم نستخدم stream
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'chat_app_uploads', // رح يعملك مجلد بهاد الاسم جوا كلاوديناري
        resource_type: 'auto', // هاد سحر: بيفهم لحاله إذا الملف صورة، صوت، أو ملف عادي
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary Upload Error:', error);
          return res.status(500).json({ message: 'Upload to Cloudinary failed' });
        }
        
        // إذا نجح الرفع، بنرجع رابط الملف ومعلوماته للفرونت إند
        res.status(200).json({
          message: 'File uploaded successfully',
          fileUrl: result?.secure_url,
          format: result?.format,
          resourceType: result?.resource_type
        });
      }
    );

    // تحويل الملف من الذاكرة لستريم ورفعه
    streamifier.createReadStream(req.file.buffer).pipe(uploadStream);

  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ message: 'Server error during file upload' });
  }
};