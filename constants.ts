// Safely access environment variables with fallback
const getEnvVar = (key: string, fallback: string): string => {
  try {
    // @ts-ignore
    const env = (import.meta as any).env;
    return (env && env[key]) ? env[key] : fallback;
  } catch (e) {
    // Return fallback if access fails
    return fallback;
  }
};

// PASTE YOUR GOOGLE APPS SCRIPT WEB APP URL HERE IN .env (VITE_API_URL)
// OR REPLACE THE EMPTY STRING BELOW
export const API_URL = getEnvVar('VITE_API_URL', ''); 

// WebSocket is not supported by standard Google Apps Script
// We will use polling in the dashboard if WS is empty
export const WS_URL = getEnvVar('VITE_WS_URL', '');

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