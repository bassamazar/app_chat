import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

// توسيع واجهة Request الخاصة بـ Express لتشمل بيانات المستخدم
export interface AuthRequest extends Request {
  user?: { userId: string };
}

export const protectRoute = (req: AuthRequest, res: Response, next: NextFunction): void => {
  // 1. جلب التوكن من ترويسة الطلب (Headers)
  const authHeader = req.header('Authorization');
  const token = authHeader?.split(' ')[1]; // استخراج التوكن بعد كلمة Bearer

  if (!token) {
    res.status(401).json({ error: 'غير مصرح لك بالمرور، التوكن مفقود' });
    return;
  }

  try {
    // 2. التحقق من صحة التوكن وفك تشفيره
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    
    // 3. إرفاق معرّف المستخدم بالطلب ليكون متاحاً في الـ Controllers
    req.user = decoded;
    
    // 4. السماح للطلب بالمرور إلى الخطوة التالية
    next(); 
  } catch (error) {
    res.status(401).json({ error: 'التوكن غير صالح أو منتهي الصلاحية' });
  }
};