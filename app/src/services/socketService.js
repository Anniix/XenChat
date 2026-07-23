import { io } from 'socket.io-client';

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:5000';

let socket = null;
let currentToken = null;
let currentChatId = null;

/**
 * Initialize or reconnect socket using JWT token.
 */
export const connectSocket = (token) => {
  if (!token) return null;

  // If socket exists with same token
  if (socket && currentToken === token) {
    if (!socket.connected) socket.connect();
    return socket;
  }

  // If token changed or old socket exists, disconnect old socket
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  currentToken = token;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['polling', 'websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 20,
    timeout: 10000,
  });

  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket.id);
    // Re-join active chat room if user was in a chat
    if (currentChatId) {
      socket.emit('chat:join', currentChatId);
    }
  });

  socket.on('connect_error', (err) => {
    console.error('❌ Socket connection error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', reason);
  });

  return socket;
};

/**
 * Get current socket instance.
 */
export const getSocket = () => socket;

/**
 * Join a chat room.
 */
export const joinChat = (chatId) => {
  currentChatId = chatId;
  if (socket) {
    socket.emit('chat:join', chatId);
    console.log('Emitted chat:join for', chatId);
  }
};

/**
 * Leave a chat room.
 */
export const leaveChat = (chatId) => {
  if (currentChatId === chatId) currentChatId = null;
  if (socket) socket.emit('chat:leave', chatId);
};

/**
 * Send a message via socket.
 */
export const sendSocketMessage = (chatId, ciphertext, cipherDisplay = null) => {
  if (socket) {
    socket.emit('message:send', {
      chat_id: chatId,
      ciphertext,
      cipher_display: cipherDisplay,
    });
  }
};

/**
 * Typing indicators
 */
export const emitTypingStart = (chatId) => {
  if (socket) socket.emit('typing:start', { chat_id: chatId });
};

export const emitTypingStop = (chatId) => {
  if (socket) socket.emit('typing:stop', { chat_id: chatId });
};

/**
 * Read receipt emit
 */
export const markMessagesAsRead = (chatId) => {
  if (socket) socket.emit('messages:read', { chat_id: chatId });
};

/**
 * Disconnect socket on logout
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentToken = null;
    currentChatId = null;
    console.log('🔌 Socket manually disconnected');
  }
};
