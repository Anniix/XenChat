import { create } from 'zustand';

const useChatStore = create((set, get) => ({
  chats: [],
  activeChat: null,
  messages: {},
  privacyMode: false,

  setChats: (chats) => set({ chats }),

  setActiveChat: (chat) => set({ activeChat: chat }),

  addMessage: (chatId, message) => {
    const current = get().messages[chatId] || [];
    set({
      messages: {
        ...get().messages,
        [chatId]: [...current, message],
      },
    });
  },

  setMessages: (chatId, messages) => {
    set({
      messages: {
        ...get().messages,
        [chatId]: messages,
      },
    });
  },

  togglePrivacyMode: () => set((state) => ({ privacyMode: !state.privacyMode })),
}));

export default useChatStore;