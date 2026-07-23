import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  setAuth: async (user, token) => {
    // Persist to storage before updating state
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  logout: async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadFromStorage: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');
      if (token && userStr) {
        set({
          token,
          user: JSON.parse(userStr),
          isAuthenticated: true,
        });
      }
    } catch (e) {
      console.warn('Failed to load auth from storage:', e.message);
    }
  },

  // Update user in store and storage after profile edits
  updateUser: async (updatedUser) => {
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    set((state) => ({ user: { ...state.user, ...updatedUser } }));
  },
}));

export default useAuthStore;