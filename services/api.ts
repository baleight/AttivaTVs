import axios from 'axios';
import { API_URL } from '../constants';
import { CheckoutRequest, AuthResponse, Rate, TV, Order, AgendaEvent } from '../types';

// Google Apps Script usually runs on a single endpoint
// We will route requests by adding a ?route= parameter
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'text/plain;charset=utf-8', // GAS prefers text/plain to avoid preflight issues in some browser configs
  },
});

// Interceptor to handle "Single Endpoint" routing
api.interceptors.request.use((config) => {
  // If the user hasn't set the API URL yet, don't break, just let it fail naturally or use mock
  if (!API_URL || API_URL.includes('localhost')) {
      // Keep standard behavior for localhost mocking
      return config;
  }

  // Convert standard REST path (e.g., /admin/all-tvs) to Query Param (e.g., ?route=/admin/all-tvs)
  if (config.url && config.url.startsWith('/')) {
    const route = config.url;
    config.url = ''; // Base URL only
    config.params = { ...config.params, route: route };
  }
  
  // For GAS, POST data is often better sent as stringified JSON in the body 
  // if Content-Type is text/plain to bypass complex CORS
  if (config.method === 'post' || config.method === 'put') {
     if (typeof config.data === 'object') {
         config.data = JSON.stringify(config.data);
     }
  }

  return config;
});

// Helper to simulate backend response if server is offline (Network Error)
const handleApiCall = async <T>(apiCall: () => Promise<any>, mockData?: T): Promise<{ data: T }> => {
  try {
    const response = await apiCall();
    // GAS sometimes returns 200 even if script failed, check for data.error
    if (response.data && response.data.error) {
        throw new Error(response.data.error);
    }
    return response;
  } catch (error: any) {
    // Check if we should use fallback data
    const status = error.response?.status;
    const shouldMock = !API_URL || 
                       API_URL === '' ||
                       !error.response || 
                       error.code === 'ERR_NETWORK' || 
                       error.message === 'Network Error' ||
                       status === 404 || 
                       status >= 500;

    if (mockData && shouldMock) {
      console.warn(`API Error or No URL configured. Using mock data for: ${error.config?.params?.route || error.config?.url}`);
      return new Promise((resolve) => setTimeout(() => resolve({ data: mockData }), 800));
    }
    throw error;
  }
};

export const PublicService = {
  createCheckoutSession: async (data: CheckoutRequest) => {
    return handleApiCall(
      () => api.post<{ checkoutUrl: string }>('/public/create-checkout-session', data),
      { checkoutUrl: 'https://checkout.stripe.com/c/pay/demo_session' } 
    );
  },
  changeRoom: async (data: { orderId: string; otp: string; newTvNumber: string }) => {
    return handleApiCall(
      () => api.post('/public/change-room', data),
      { success: true }
    );
  },
  checkTvStatus: async (tvNumber: string) => {
    // Pass tvNumber as query param for GET request
    return handleApiCall(
      () => api.get<{ connected: boolean; location: string }>('/public/tv-status', { params: { tvNumber } }),
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
        () => api.get<{ orders: Order[]; total: number }>('/admin/all-orders', { params: { page, limit } }),
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
    return handleApiCall(
        () => api.post('/admin/add-tv', data),
        { success: true }
    );
  },
  toggleTV: async (tvNumber: string, newState: 'on' | 'off') => {
    return api.post('/admin/toggle-tv', { tvNumber, newState });
  },
  removeTV: async (tvNumber: string) => {
    return api.post('/admin/remove-tv', { tvNumber });
  },
  updateTVLocation: async (tvNumber: string, location: string) => {
    return api.post('/admin/update-tv', { tvNumber, location });
  },
  updateThresholds: async (thresholds: Rate[]) => {
    return api.post('/admin/change-thresholds', { thresholds });
  },
  // Agenda Methods
  getAgenda: async () => {
    return handleApiCall(
        () => api.get<{ events: AgendaEvent[] }>('/admin/agenda/all'),
        { events: [] }
    );
  },
  addAgendaEvent: async (event: Partial<AgendaEvent>) => {
    return api.post('/admin/agenda/add', event);
  },
  deleteAgendaEvent: async (id: string) => {
    return api.post('/admin/agenda/delete', { id });
  }
};