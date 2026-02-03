import { create } from 'zustand';
import { User, UserRole } from '@/types';
import { db } from '@/lib/storage/indexed-db';

interface UserState {
  users: User[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchUsers: () => Promise<void>;
  addUser: (user: User) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  getUserById: (id: string) => Promise<User | undefined>;
  getUserByEmail: (email: string) => Promise<User | undefined>;
  getUsersByRole: (role: UserRole) => User[];
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  isLoading: false,
  error: null,

  fetchUsers: async () => {
    set({ isLoading: true, error: null });
    try {
      const users = await db.users.toArray();
      set({ users, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addUser: async (user: User) => {
    try {
      await db.users.add(user);
      set(state => ({ users: [...state.users, user] }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  updateUser: async (id: string, updates: Partial<User>) => {
    try {
      await db.users.update(id, { ...updates, updatedAt: new Date().toISOString() });
      set(state => ({
        users: state.users.map(user =>
          user.id === id ? { ...user, ...updates, updatedAt: new Date().toISOString() } : user
        ),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  deleteUser: async (id: string) => {
    try {
      await db.users.delete(id);
      set(state => ({ users: state.users.filter(user => user.id !== id) }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  getUserById: async (id: string) => {
    return db.users.get(id);
  },

  getUserByEmail: async (email: string) => {
    return db.users.where('email').equalsIgnoreCase(email).first();
  },

  getUsersByRole: (role: UserRole) => {
    return get().users.filter(user => user.role === role);
  },
}));
