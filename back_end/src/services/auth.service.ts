import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';

// التأكد من وجود مفتاح التشفير في بيئة العمل
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

export const registerUser = async (email: string, username: string, password: string) => {
  // 1. التأكد من أن المستخدم غير مسجل مسبقاً
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }]
    }
  });

  if (existingUser) {
    throw new Error('البريد الإلكتروني أو اسم المستخدم مستخدم بالفعل');
  }

  // 2. تشفير كلمة المرور
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // 3. حفظ المستخدم في قاعدة البيانات
  const user = await prisma.user.create({
    data: {
      email,
      username,
      passwordHash
    }
  });

  // 4. إنشاء Token للمستخدم
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

  return { user, token };
};

export const loginUser = async (email: string, password: string) => {
  // 1. البحث عن المستخدم في قاعدة البيانات
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw new Error('بيانات الدخول غير صحيحة');
  }

  // 2. مقارنة كلمة المرور المدخلة مع المشفرة
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new Error('بيانات الدخول غير صحيحة');
  }

  // 3. إنشاء Token جديد
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

  return { user, token };
};