import { create } from 'zustand';
import { authAPI } from '../services/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('tf_token') || null,
  loading: true,
  isAuthenticated: false,

  init: async () => {
    const token = localStorage.getItem('tf_token');
    if (!token) { set({ loading: false }); return; }
    try {
      const res = await authAPI.me();
      set({ user: res.data.user, isAuthenticated: true, loading: false });
    } catch {
      localStorage.removeItem('tf_token');
      set({ user: null, token: null, isAuthenticated: false, loading: false });
    }
  },

  login: async (email, password) => {
    const res = await authAPI.login({ email, password });
    localStorage.setItem('tf_token', res.data.token);
    set({ user: res.data.user, token: res.data.token, isAuthenticated: true });
    return res.data.user;
  },

  register: async (name, email, password) => {
    const res = await authAPI.register({ name, email, password });
    localStorage.setItem('tf_token', res.data.token);
    set({ user: res.data.user, token: res.data.token, isAuthenticated: true });
    return res.data.user;
  },

  logout: () => {
    localStorage.removeItem('tf_token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateUser: (data) => set({ user: { ...get().user, ...data } }),
}));

export const useWorkspaceStore = create((set, get) => ({
  workspaces: [],
  currentWorkspace: null,
  loading: false,

  setWorkspaces: (ws) => set({ workspaces: ws }),
  setCurrentWorkspace: (ws) => set({ currentWorkspace: ws }),

  addWorkspace: (ws) => set({ workspaces: [...get().workspaces, ws] }),
  removeWorkspace: (id) => set({ workspaces: get().workspaces.filter(w => w._id !== id) }),
  updateWorkspace: (id, data) => set({
    workspaces: get().workspaces.map(w => w._id === id ? { ...w, ...data } : w),
  }),
}));

export const useBoardStore = create((set, get) => ({
  currentBoard: null,
  loading: false,

  setBoard: (board) => set({ currentBoard: board }),

  addColumn: (col) => set({
    currentBoard: {
      ...get().currentBoard,
      columns: [...(get().currentBoard?.columns || []), { ...col, cards: [] }],
    },
  }),

  updateColumn: (colId, data) => set({
    currentBoard: {
      ...get().currentBoard,
      columns: get().currentBoard?.columns.map(c => c._id === colId ? { ...c, ...data } : c),
    },
  }),

  removeColumn: (colId) => set({
    currentBoard: {
      ...get().currentBoard,
      columns: get().currentBoard?.columns.filter(c => c._id !== colId),
    },
  }),

  addCard: (columnId, card) => set({
    currentBoard: {
      ...get().currentBoard,
      columns: get().currentBoard?.columns.map(c =>
        c._id === columnId ? { ...c, cards: [...c.cards, card] } : c
      ),
    },
  }),

  updateCard: (cardId, data) => set({
    currentBoard: {
      ...get().currentBoard,
      columns: get().currentBoard?.columns.map(c => ({
        ...c,
        cards: c.cards.map(card => card._id === cardId ? { ...card, ...data } : card),
      })),
    },
  }),

  removeCard: (cardId) => set({
    currentBoard: {
      ...get().currentBoard,
      columns: get().currentBoard?.columns.map(c => ({
        ...c,
        cards: c.cards.filter(card => card._id !== cardId),
      })),
    },
  }),

  moveCard: (cardId, fromColId, toColId) => {
    const board = get().currentBoard;
    const fromCol = board.columns.find(c => c._id === fromColId);
    const card = fromCol?.cards.find(c => c._id === cardId);
    if (!card) return;

    set({
      currentBoard: {
        ...board,
        columns: board.columns.map(col => {
          if (col._id === fromColId) return { ...col, cards: col.cards.filter(c => c._id !== cardId) };
          if (col._id === toColId) {
            const cards = [...col.cards, { ...card, column: toColId }];
            cards.sort((a, b) => a.order - b.order);
            return { ...col, cards };
          }
          return col;
        }),
      },
    });
  },
}));
