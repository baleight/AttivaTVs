import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Tv, CreditCard, RefreshCw, Mail, MapPin } from 'lucide-react';
import { GlassCard } from '../../components/GlassCard';
import { LanguageSelector } from '../../components/LanguageSelector';
import { PublicService } from '../../services/api';
import { DEFAULT_RATES } from '../../constants';
import { Toast, ToastType } from '../../components/Toast';

export const LandingPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [tvNumber, setTvNumber] = useState('');
  const [selectedDays, setSelectedDays] = useState<number | null>(null);
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingTv, setCheckingTv] = useState(false);
  const [isTvValid, setIsTvValid] = useState<boolean | null>(null);
  
  // Toast State
  const [toast, setToast] = useState<{ show: boolean; message: string; type: ToastType }>({
    show: false,
    message: '',
    type: 'info'
  });

  const showToast = (message: string, type: ToastType) => {
    setToast({ show: true, message, type });
  };

  // Check TV Status via API
  useEffect(() => {
    if (tvNumber.length === 4) {
      setCheckingTv(true);
      const timer = setTimeout(async () => {
        try {
            const { data } = await PublicService.checkTvStatus(tvNumber);
            if(data.connected) {
                setIsTvValid(true);
                setLocation(data.location || "Unknown Location");
            } else {
                setIsTvValid(false);
                setLocation('');
                // Only show toast if explicitly invalid response logic requires it, 
                // but usually silent fail on input is better UX until submission, 
                // however visual indicator (red border/text) is managed by isTvValid state in UI
            }
        } catch (error) {
            setIsTvValid(false);
            setLocation('');
            showToast('Connection to TV failed. Please try again.', 'error');
        } finally {
            setCheckingTv(false);
        }
      }, 800);
      return () => clearTimeout(timer);
    } else {
      setIsTvValid(null);
      setLocation('');
      setSelectedDays(null);
    }
  }, [tvNumber]);

  const handlePurchase = async () => {
    if (!tvNumber || !selectedDays || !isTvValid) {
        showToast(t('error_invalid_input') || "Please check your inputs.", 'error');
        return;
    }

    setLoading(true);
    try {
      console.log("Initiating purchase session...");
      const response = await PublicService.createCheckoutSession({
        tvNumber,
        timeBought: selectedDays,
        location,
        language: i18n.language,
        customerEmail: email
      });
      
      // Redirect to Stripe or handle demo mode
      if (response && response.data && response.data.checkoutUrl) {
          if (response.data.checkoutUrl.includes('demo_session')) {
              showToast("Demo Mode: Payment Successful!", 'success');
              // Delay alert to let toast show
              setTimeout(() => {
                  alert("Demo Mode: Payment Successful! (Simulated)\n\nIn a real environment, this would redirect to Stripe.");
              }, 500);
          } else {
              window.location.href = response.data.checkoutUrl;
          }
      } else {
          throw new Error("Invalid response received from server");
      }
    } catch (error: any) {
      console.error("Purchase failed", error);
      let errorMessage = t('error_payment_failed') || "Payment initialization failed.";

      if (error.response) {
        // Server responded with a status code
        switch (error.response.status) {
            case 404:
                errorMessage = t('error_tv_not_found') || "TV Not Found. Please verify the TV number.";
                break;
            case 422: 
                errorMessage = t('error_invalid_data') || "Invalid data provided. Please check your inputs.";
                break;
            case 503:
                errorMessage = t('error_device_offline') || "Device appears to be offline. Cannot activate remotely.";
                break;
            default:
                errorMessage = error.response.data?.message || errorMessage;
        }
      } else if (error.request) {
        errorMessage = t('error_network') || "Network Error. Backend is unreachable.";
      } else {
        errorMessage = error.message;
      }

      showToast(errorMessage, 'error');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold font-heading mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            TV-Time
          </h1>
          <p className="text-gray-400">{t('welcome')}</p>
        </div>

        <GlassCard>
          <div className="space-y-6">
            
            {/* TV Number Input */}
            <div>
              <label className="block text-sm text-gray-400 mb-1 ml-1">{t('enter_tv')}</label>
              <div className="relative">
                <Tv className="absolute left-3 top-3 text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  maxLength={4}
                  value={tvNumber}
                  onChange={(e) => setTvNumber(e.target.value.replace(/\D/g, ''))}
                  className={`w-full bg-white/5 border rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none transition-colors text-lg tracking-widest placeholder-gray-600 ${
                    isTvValid === false ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-indigo-500'
                  }`}
                  placeholder="0000"
                />
                {checkingTv && (
                  <RefreshCw className="absolute right-3 top-3 text-blue-400 w-5 h-5 animate-spin" />
                )}
              </div>
              {isTvValid && (
                <div className="flex items-center gap-2 mt-2 text-sm text-green-400 animate-fade-in">
                  <MapPin className="w-3 h-3" />
                  <span>{location}</span>
                </div>
              )}
              {isTvValid === false && !checkingTv && (
                 <div className="flex items-center gap-2 mt-2 text-sm text-red-400 animate-fade-in">
                  <span>{t('error_tv_not_found')}</span>
                 </div>
              )}
            </div>

            {/* Plan Selection */}
            {isTvValid && (
              <div className="animate-fade-in-up">
                <label className="block text-sm text-gray-400 mb-2 ml-1">{t('select_plan')}</label>
                <div className="grid grid-cols-2 gap-3">
                  {DEFAULT_RATES.map((rate) => (
                    <button
                      key={rate.days}
                      onClick={() => setSelectedDays(rate.days)}
                      className={`relative p-3 rounded-xl border transition-all duration-200 ${
                        selectedDays === rate.days
                          ? 'bg-indigo-600/50 border-indigo-400 shadow-lg shadow-indigo-500/20'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="text-xl font-bold font-heading">{rate.days} {t('days')}</div>
                      <div className="text-sm text-gray-300">€{rate.price}</div>
                      {selectedDays === rate.days && (
                        <div className="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Email Input */}
            {selectedDays && (
              <div className="animate-fade-in-up">
                <label className="block text-sm text-gray-400 mb-1 ml-1">{t('email_optional')}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-gray-500 w-5 h-5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="name@example.com"
                  />
                </div>
              </div>
            )}

            {/* Action Button */}
            <button
              disabled={!isTvValid || !selectedDays || loading}
              onClick={handlePurchase}
              className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg ${
                !isTvValid || !selectedDays || loading
                  ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:scale-[1.02] shadow-indigo-500/25 text-white'
              }`}
            >
              {loading ? (
                <RefreshCw className="animate-spin w-6 h-6" />
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  {t('pay_now')}
                </>
              )}
            </button>
            
            <div className="text-center pt-2">
                <button onClick={() => navigate('/change-room')} className="text-sm text-gray-400 hover:text-white underline decoration-gray-600">
                    {t('change_room')}
                </button>
            </div>
          </div>
        </GlassCard>

        <LanguageSelector />
        
        <div className="text-center mt-8 opacity-30 text-xs">
            Admin Access? <button onClick={() => navigate('/admin')} className="hover:text-white underline bg-transparent border-none cursor-pointer">Click here</button>
        </div>
        
        {/* Toast Notification */}
        <Toast 
            message={toast.message} 
            type={toast.type} 
            isVisible={toast.show} 
            onClose={() => setToast(prev => ({ ...prev, show: false }))} 
        />
      </div>
    </div>
  );
};