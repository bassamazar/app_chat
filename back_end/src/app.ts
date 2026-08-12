import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import chatRoutes from './routes/chat.routes';
import friendRoutes from './routes/friend.routes';
import groupRoutes from './routes/group.routes';
import blockRoutes from './routes/block.routes';
import uploadRoutes from './routes/upload.routes';
import { setupSwagger } from './config/swagger';

const app = express();

app.use(cors());
app.use(express.json());

// ربط مسارات المصادقة
app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/blocks', blockRoutes);
app.use('/api/upload', uploadRoutes);
setupSwagger(app);

app.get('/', (req, res) => {
  res.send('Chat API is running smoothly! 🚀');
});

export default app;