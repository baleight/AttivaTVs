import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "welcome": "Welcome to TV-Time",
      "enter_tv": "Enter TV Number",
      "location": "Location",
      "select_plan": "Select Duration",
      "email_optional": "Email (Optional for Receipt & Recovery)",
      "pay_now": "Pay & Activate",
      "admin_login": "Admin Login",
      "dashboard": "Dashboard",
      "tvs": "TVs",
      "orders": "Orders",
      "rates": "Rates",
      "change_room": "Change Room",
      "otp": "Access Code (OTP)",
      "order_id": "Order ID",
      "move_time": "Move Remaining Time",
      "status_on": "ON",
      "status_off": "OFF",
      "days": "Days",
      "price": "Price",
      "error_tv_not_found": "TV Not Found. Please verify the number.",
      "error_device_offline": "Device is offline. Cannot activate.",
      "error_payment_failed": "Payment initialization failed.",
      "error_network": "Network error. Server unreachable.",
      "error_invalid_data": "Invalid data provided.",
      "error_invalid_input": "Please complete all fields.",
    }
  },
  it: {
    translation: {
      "welcome": "Benvenuto su TV-Time",
      "enter_tv": "Inserisci Numero TV",
      "location": "Posizione",
      "select_plan": "Seleziona Durata",
      "email_optional": "Email (Opzionale per Ricevuta)",
      "pay_now": "Paga e Attiva",
      "admin_login": "Accesso Admin",
      "dashboard": "Dashboard",
      "tvs": "TV",
      "orders": "Ordini",
      "rates": "Tariffe",
      "change_room": "Cambia Stanza",
      "otp": "Codice di Accesso (OTP)",
      "order_id": "ID Ordine",
      "move_time": "Sposta Tempo Rimanente",
      "status_on": "ON",
      "status_off": "OFF",
      "days": "Giorni",
      "price": "Prezzo",
      "error_tv_not_found": "TV non trovata. Verifica il numero.",
      "error_device_offline": "Dispositivo offline. Impossibile attivare.",
      "error_payment_failed": "Inizializzazione pagamento fallita.",
      "error_network": "Errore di rete. Server non raggiungibile.",
      "error_invalid_data": "Dati non validi.",
      "error_invalid_input": "Compila tutti i campi.",
    }
  },
  es: {
    translation: {
      "welcome": "Bienvenido a TV-Time",
      "pay_now": "Pagar y Activar",
      "error_tv_not_found": "TV no encontrada.",
      "error_network": "Error de red.",
    }
  },
  fr: {
    translation: {
      "welcome": "Bienvenue sur TV-Time",
      "pay_now": "Payer et Activer",
      "error_tv_not_found": "TV introuvable.",
      "error_network": "Erreur réseau.",
    }
  },
  ar: {
    translation: {
      "welcome": "مرحبًا بك في TV-Time",
      "pay_now": "ادفع وقم بالتفعيل",
      "error_tv_not_found": "التلفزيون غير موجود",
      "error_network": "خطأ في الشبكة",
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "it",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;