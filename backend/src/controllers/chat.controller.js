const Chat = require('../models/chat.model');

const createChat = async (req, res) => {
  try {
    const user2_id = req.body.user2_id || req.body.recipient_id;
    const user1_id = req.user.id;

    if (!user2_id) {
      return res.status(400).json({ success: false, message: 'user2_id or recipient_id required' });
    }

    if (user1_id === user2_id) {
      return res.status(400).json({ success: false, message: 'Cannot chat with yourself' });
    }

    const chat = await Chat.createChat(user1_id, user2_id);
    res.status(201).json({ success: true, chat });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUserChats = async (req, res) => {
  try {
    const chats = await Chat.getUserChats(req.user.id);
    res.json({ success: true, chats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getChatMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const isMember = await Chat.isChatMember(id, req.user.id);
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const messages = await Chat.getChatMessages(id);
    res.json({ success: true, messages });
  } catch (error) {
    console.error('getChatMessages error:', error.message); // ye add karo
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createChat, getUserChats, getChatMessages };