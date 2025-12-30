// Safely access environment variables with fallback
const getEnvVar = (key: string, fallback: string): string => {
  try {
    // Cast to any to avoid TypeScript errors regarding ImportMeta.env
    const meta = import.meta as any;
    // Check if meta and meta.env exist before accessing the key to prevent runtime errors
    if (meta && meta.env && meta.env[key]) {
      return String(meta.env[key]);
    }
  } catch (e) {
    // Return fallback if access fails or import.meta is not defined
  }
  return fallback;
};

// PASTE YOUR GOOGLE APPS SCRIPT WEB APP URL HERE IN .env (VITE_API_URL)
// OR REPLACE THE STRING BELOW WITH YOUR LINK
// Example: 'https://script.google.com/macros/s/AKfycbx.../exec'
export const API_URL = getEnvVar('VITE_API_URL', 'https://script.google.com/macros/s/AKfycbyHbLg6DEhaStXsrpjEBYdr11HQF7ukEAxC1Z6TJnqg2ZIEsALyWEZOVU6n8lCBqEtRvg/exec'); 

// WebSocket Server URL
// Defaults to localhost for the Node.js server we just created
export const WS_URL = getEnvVar('VITE_WS_URL', 'ws://localhost:8080');

export const LANGUAGES = [
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
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