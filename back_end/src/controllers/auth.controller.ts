import { Request, Response } from 'express';
import * as authService from '../services/auth.service';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, username, password } = req.body;

    // التحقق المبدئي من وجود البيانات
    if (!email || !username || !password) {
      res.status(400).json({ error: 'جميع الحقول مطلوبة' });
      return;
    }

    const result = await authService.registerUser(email, username, password);
    
    // إخفاء كلمة المرور المشفرة قبل إرسال الرد للعميل
    const { passwordHash, ...userWithoutPassword } = result.user;

    res.status(201).json({
      message: 'تم إنشاء الحساب بنجاح',
      user: userWithoutPassword,
      token: result.token
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور' });
      return;
    }

    const result = await authService.loginUser(email, password);
    
    const { passwordHash, ...userWithoutPassword } = result.user;

    res.status(200).json({
      message: 'تم تسجيل الدخول بنجاح',
      user: userWithoutPassword,
      token: result.token
    });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
};