import axios from 'axios';
import { API_URL } from '../constants';
import { CheckoutRequest, AuthResponse, Rate, TV, Order } from '../types';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor for Admin JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Helper to simulate backend response if server is offline (Network Error)
const handleApiCall = async <T>(apiCall: () => Promise<any>, mockData?: T): Promise<{ data: T }> => {
  try {
    return await apiCall();
  } catch (error: any) {
    // Check if we should use fallback data
    // !error.response implies the server did not respond (Network Error, CORS, Offline)
    // Also handle 404 (Endpoint not found) and 5xx (Server Error) to fallback to mock data
    const status = error.response?.status;
    const shouldMock = !error.response || 
                       error.code === 'ERR_NETWORK' || 
                       error.message === 'Network Error' ||
                       status === 404 || 
                       status >= 500;

    if (mockData && shouldMock) {
      console.warn(`API Error (${status || error.code}). Using mock data.`, error);
      return new Promise((resolve) => setTimeout(() => resolve({ data: mockData }), 800));
    }
    throw error;
  }
};

export const PublicService = {
  createCheckoutSession: async (data: CheckoutRequest) => {
    return handleApiCall(
      () => api.post<{ checkoutUrl: string }>('/public/create-checkout-session', data),
      { checkoutUrl: 'https://checkout.stripe.com/c/pay/demo_session' } // Mock URL
    );
  },
  changeRoom: async (data: { orderId: string; otp: string; newTvNumber: string }) => {
    return handleApiCall(
      () => api.post('/public/change-room', data),
      { success: true }
    );
  },
  checkTvStatus: async (tvNumber: string) => {
    return handleApiCall(
      () => api.get<{ connected: boolean; location: string }>(`/public/tv-status/${tvNumber}`),
      { connected: true, location: 'Demo Room' }
    );
  }
};

export const AdminService = {
  login: async (credentials: { email: string; password: string }) => {
    return handleApiCall(
        () => api.post<AuthResponse>('/admin/auth/login', credentials),
        { 
            user: { adminId: '1', email: credentials.email, fullName: 'Demo Admin', isAdmin: true },
            token: 'demo_jwt_token' 
        }
    );
  },
  getAllOrders: async (page = 1, limit = 20) => {
    return handleApiCall(
        () => api.get<{ orders: Order[]; total: number }>(`/admin/all-orders?page=${page}&limit=${limit}`),
        { orders: [], total: 0 }
    );
  },
  getAllTVs: async () => {
    return handleApiCall(
        () => api.get<{ tvs: TV[] }>('/admin/all-tvs'),
        { tvs: [] }
    );
  },
  addTV: async (data: { tvNumber: string; location: string }) => {
    return api.post('/admin/add-tv', data);
  },
  toggleTV: async (tvNumber: string, newState: 'on' | 'off') => {
    return api.put('/admin/toggle-tv', { tvNumber, newState });
  },
  removeTV: async (tvNumber: string) => {
    return api.delete('/admin/remove-tv', { data: { tvNumber } });
  },
  updateThresholds: async (thresholds: Rate[]) => {
    return api.post('/admin/change-thresholds', { thresholds });
  }
};