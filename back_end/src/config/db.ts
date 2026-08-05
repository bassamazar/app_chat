import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

declare global {
  var prisma: PrismaClient | undefined;
}

// 1. قراءة الرابط وتفكيكه باستخدام أداة URL المدمجة في Node.js
const dbUrl = new URL(process.env.DATABASE_URL!);

// 2. تمرير البيانات مفصلة وإجبار كلمة السر لتكون نص (String)
const pool = new Pool({
  user: dbUrl.username,
  password: String(dbUrl.password), // 👈 هنا يكمن الحل السحري
  host: dbUrl.hostname,
  port: Number(dbUrl.port),
  database: dbUrl.pathname.substring(1), // لإزالة علامة "/" من اسم قاعدة البيانات
});

const adapter = new PrismaPg(pool);

// 3. تمرير المحول إلى Prisma
const prisma = global.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;