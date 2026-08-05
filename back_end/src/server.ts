import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import { handleConnection } from './sockets/socket.handler';

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
});

// تفعيل الهاندلر الرئيسي لاتصالات الـ Socket
io.on('connection', (socket) => {
  handleConnection(io, socket);
});

server.listen(PORT, () => {
  console.log(`🚀 Server is running smoothly with WebSockets on port: ${PORT}`);
});