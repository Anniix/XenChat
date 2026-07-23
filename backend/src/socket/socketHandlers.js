const socketAuth = require('./socketAuth');
const Chat = require('../models/chat.model');
const Message = require('../models/message.model');
const User = require('../models/user.model');
const pool = require('../config/db');

module.exports = (io) => {
  io.use(socketAuth);

  io.on('connection', async (socket) => {
    console.log(`⚡ User connected: ${socket.user.username} [${socket.id}]`);

    // Mark user as online in DB
    await User.updateOnlineStatus(socket.user.id, true);
    io.emit('user:online', { user_id: socket.user.id });

    // Join user's personal room
    socket.join(`user:${socket.user.id}`);

    // Update status to 'delivered' for messages sent while user was offline
    try {
      const delivered = await pool.query(
        `UPDATE messages
         SET status = 'delivered'
         WHERE chat_id IN (SELECT chat_id FROM chat_members WHERE user_id = $1)
           AND sender_id != $1
           AND status = 'sent'
         RETURNING id, sender_id`,
        [socket.user.id]
      );

      delivered.rows.forEach(msg => {
        io.to(`user:${msg.sender_id}`).emit('message:status', {
          message_id: msg.id,
          status: 'delivered',
        });
      });
    } catch (e) {
      console.error('Error updating delivered status on connect:', e.message);
    }

    // ── Join a chat room ─────────────────────────────────────
    socket.on('chat:join', (chatId) => {
      socket.join(`chat:${chatId}`);
      console.log(`${socket.user.username} joined chat:${chatId}`);
    });

    // ── Leave a chat room ─────────────────────────────────────
    socket.on('chat:leave', (chatId) => {
      socket.leave(`chat:${chatId}`);
    });

    // ── Real-time presence check ──────────────────────────────
    socket.on('presence:check', async ({ user_id }) => {
      try {
        const allSockets = await io.fetchSockets();
        const isOnline = allSockets.some(s => s.user?.id === user_id);
        socket.emit('presence:status', { user_id, is_online: isOnline });
      } catch (err) {
        socket.emit('presence:status', { user_id, is_online: false });
      }
    });

    // ── Send a message ────────────────────────────────────────
    socket.on('message:send', async (data) => {
      try {
        const { chat_id, ciphertext, cipher_display } = data;

        if (!chat_id || !ciphertext) {
          socket.emit('error', { message: 'chat_id and ciphertext are required' });
          return;
        }

        // Verify sender is a member
        const isMember = await Chat.isChatMember(chat_id, socket.user.id);
        if (!isMember) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        // Save message to DB (status = 'sent')
        const message = await Message.createMessage({
          chat_id,
          sender_id: socket.user.id,
          ciphertext,
          cipher_display: cipher_display || null,
        });

        // Get member user IDs of this chat
        const memberIds = await Chat.getChatMemberIds(chat_id);
        const otherMemberIds = memberIds.filter(id => id !== socket.user.id);

        // Fetch all connected sockets to check if recipient is online
        const allSockets = await io.fetchSockets();
        const recipientSockets = allSockets.filter(s => otherMemberIds.includes(s.user?.id));
        const isDelivered = recipientSockets.length > 0;

        if (isDelivered) {
          await Message.updateStatus(message.id, 'delivered');
          message.status = 'delivered';
        }

        const msgPayload = {
          ...message,
          username: socket.user.username,
        };

        // Broadcast to chat room
        io.to(`chat:${chat_id}`).emit('message:new', msgPayload);

        // Broadcast to all chat members' personal user rooms
        memberIds.forEach(mId => {
          io.to(`user:${mId}`).emit('message:new', msgPayload);
        });

        // Tell sender the delivery status (sent vs delivered)
        socket.emit('message:status', {
          message_id: message.id,
          status: message.status,
        });

      } catch (err) {
        console.error('message:send error:', err.message);
        socket.emit('error', { message: err.message });
      }
    });

    // ── Mark messages as read ─────────────────────────────────
    socket.on('messages:read', async ({ chat_id }) => {
      try {
        // Mark all unread messages in this chat as read
        const readMessages = await Message.markMessagesRead(chat_id, socket.user.id);

        if (readMessages.length === 0) return;

        // Notify each sender that their messages were read
        const senderIds = [...new Set(readMessages.map(m => m.sender_id))];
        senderIds.forEach(senderId => {
          io.to(`user:${senderId}`).emit('messages:read', {
            chat_id,
            read_by: socket.user.id,
          });
        });

      } catch (err) {
        console.error('messages:read error:', err.message);
      }
    });

    // ── Typing indicators ─────────────────────────────────────
    socket.on('typing:start', ({ chat_id }) => {
      socket.to(`chat:${chat_id}`).emit('typing:start', {
        user_id: socket.user.id,
        username: socket.user.username,
      });
    });

    socket.on('typing:stop', ({ chat_id }) => {
      socket.to(`chat:${chat_id}`).emit('typing:stop', {
        user_id: socket.user.id,
      });
    });

    // ── Disconnect ─────────────────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`❌ User disconnected: ${socket.user.username}`);
      await User.updateOnlineStatus(socket.user.id, false);
      io.emit('user:offline', { user_id: socket.user.id });
    });
  });
};