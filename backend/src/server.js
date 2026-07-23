require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
require('./config/db');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
  transports: ['polling', 'websocket'],
  allowEIO3: true,
});

// Socket handlers
require('./socket/socketHandlers')(io);

server.listen(PORT, () => {
  console.log(`🚀 XenChat backend running on port ${PORT}`);
});