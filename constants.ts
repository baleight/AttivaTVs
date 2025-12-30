const env = (import.meta as any).env || {};

export const API_URL = env.VITE_API_URL || 'http://localhost:5000/api';
export const WS_URL = env.VITE_WS_URL || 'ws://localhost:5000';

export const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
];

export const DEFAULT_RATES = [
  { days: 1, price: 5 },
  { days: 3, price: 12 },
  { days: 7, price: 25 },
  { days: 30, price: 80 },
];