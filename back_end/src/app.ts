import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import chatRoutes from './routes/chat.routes';
import friendRoutes from './routes/friend.routes';
import groupRoutes from './routes/group.routes';
const app = express();

app.use(cors());
app.use(express.json());

// ربط مسارات المصادقة
app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/groups', groupRoutes);

app.get('/', (req, res) => {
  res.send('Chat API is running smoothly! 🚀');
});

export default app;