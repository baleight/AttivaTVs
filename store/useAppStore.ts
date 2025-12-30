import { create } from 'zustand';
import { AdminUser, TV, Order, Rate, AgendaEvent } from '../types';

interface AppState {
  // Admin State
  admin: AdminUser | null;
  setAdmin: (user: AdminUser | null) => void;
  logout: () => void;
  
  // Data State
  tvs: TV[];
  orders: Order[];
  rates: Rate[];
  events: AgendaEvent[];
  
  setTVs: (tvs: TV[]) => void;
  updateTV: (tv: TV) => void;
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  setRates: (rates: Rate[]) => void;
  setEvents: (events: AgendaEvent[]) => void;
  addEvent: (event: AgendaEvent) => void;
  removeEvent: (id: string) => void;
  
  // UI State
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  admin: null,
  setAdmin: (admin) => {
    if (admin) localStorage.setItem('admin_token', admin.token);
    set({ admin });
  },
  logout: () => {
    localStorage.removeItem('admin_token');
    set({ admin: null });
  },
  
  tvs: [],
  orders: [],
  rates: [],
  events: [],
  
  setTVs: (tvs) => set({ tvs }),
  updateTV: (updatedTv) => set((state) => ({
    tvs: state.tvs.map((tv) => tv.tvNumber === updatedTv.tvNumber ? updatedTv : tv)
  })),
  setOrders: (orders) => set({ orders }),
  addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),
  setRates: (rates) => set({ rates }),
  setEvents: (events) => set({ events }),
  addEvent: (event) => set((state) => ({ events: [...state.events, event] })),
  removeEvent: (id) => set((state) => ({ events: state.events.filter(e => e.id !== id) })),
  
  isLoading: false,
  setLoading: (isLoading) => set({ isLoading }),
}));