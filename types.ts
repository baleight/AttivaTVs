export interface TV {
  tvNumber: string;
  location: string;
  state: 'on' | 'off';
  remainingDuration: number; // minutes
  balance: number;
  last_updated: string;
  deleted?: boolean;
  connected?: boolean;
}

export interface Order {
  id: string;
  tvNumber: string;
  location: string;
  timeBought: number; // days
  totalCost: number;
  orderDate: string;
  otp: string;
  status: 'paid' | 'pending' | 'failed';
  customerEmail?: string;
}

export interface AgendaEvent {
  id: string;
  title: string;
  date: string; // ISO Date string YYYY-MM-DD
  type: 'manual' | 'expiry' | 'maintenance';
  description?: string;
}

export interface Rate {
  days: number;
  price: number;
}

export interface AdminUser {
  adminId: string;
  email: string;
  fullName: string;
  isAdmin: boolean;
  token: string;
}

export interface CheckoutRequest {
  timeBought: number;
  tvNumber: string;
  location: string;
  language: string;
  customerEmail?: string;
}

export interface AuthResponse {
  user: Omit<AdminUser, 'token'>;
  token: string;
}