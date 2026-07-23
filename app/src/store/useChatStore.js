import { create } from 'zustand';

const useChatStore = create((set, get) => ({
  chats: [],
  activeChat: null,
  messages: {},       // { [chatId]: Message[] }
  typingUsers: {},    // { [chatId]: { user_id, username }[] }
  privacyMode: false,

  setChats: (chats) => set({ chats }),

  setActiveChat: (chat) => set({ activeChat: chat }),

  // Append a single message to a chat's message list
  addMessage: (chatId, message) => {
    const current = get().messages[chatId] || [];

    let filtered;
    if (!message.temp) {
      // Real message arriving from socket: remove the optimistic temp copy
      // (temp messages share same sender_id + ciphertext but different id)
      filtered = current.filter(
        (m) =>
          !(
            m.temp &&
            m.sender_id === message.sender_id &&
            m.ciphertext === message.ciphertext
          )
      );
    } else {
      filtered = current;
    }

    // Also deduplicate by exact id (safety net)
    filtered = filtered.filter((m) => m.id !== message.id);

    set({
      messages: {
        ...get().messages,
        [chatId]: [...filtered, message],
      },
    });
  },

  // Set the full message list for a chat
  setMessages: (chatId, messages) => {
    set({
      messages: {
        ...get().messages,
        [chatId]: messages,
      },
    });
  },

  // Add a typing user indicator for a chat
  addTypingUser: (chatId, userInfo) => {
    const current = get().typingUsers[chatId] || [];
    const exists = current.find((u) => u.user_id === userInfo.user_id);
    if (!exists) {
      set({
        typingUsers: {
          ...get().typingUsers,
          [chatId]: [...current, userInfo],
        },
      });
    }
  },

  // Remove a typing user indicator for a chat
  removeTypingUser: (chatId, userId) => {
    const current = get().typingUsers[chatId] || [];
    set({
      typingUsers: {
        ...get().typingUsers,
        [chatId]: current.filter((u) => u.user_id !== userId),
      },
    });
  },

  // Update status of a single message (sent -> delivered -> read)
  updateMessageStatus: (chatId, messageId, status) => {
    const current = get().messages[chatId] || [];
    const updated = current.map((m) => (m.id === messageId ? { ...m, status } : m));
    set({
      messages: {
        ...get().messages,
        [chatId]: updated,
      },
    });
  },

  // Mark all messages sent by current user as read in a chat
  markChatMessagesRead: (chatId, readerId) => {
    const current = get().messages[chatId] || [];
    const updated = current.map((m) => (m.sender_id !== readerId ? { ...m, status: 'read', read_at: true } : m));
    set({
      messages: {
        ...get().messages,
        [chatId]: updated,
      },
    });
  },

  togglePrivacyMode: () => set((state) => ({ privacyMode: !state.privacyMode })),
}));

export default useChatStore;