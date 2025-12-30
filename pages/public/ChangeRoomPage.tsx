import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { MoveRight, ArrowLeft } from 'lucide-react';
import { GlassCard } from '../../components/GlassCard';
import { PublicService } from '../../services/api';

export const ChangeRoomPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
      orderId: '',
      otp: '',
      newTvNumber: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
        await PublicService.changeRoom(formData);
        alert("Success! Time moved to new TV.");
        navigate('/');
    } catch (e) {
        alert("Failed to change room. Check OTP or TV status.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <GlassCard>
            <button onClick={() => navigate('/')} className="mb-4 text-gray-400 hover:text-white flex items-center gap-1 text-sm">
                <ArrowLeft size={16} /> Back
            </button>
            <h2 className="text-2xl font-bold font-heading mb-6">{t('change_room')}</h2>
            
            <div className="space-y-4">
                <input 
                    placeholder={t('order_id')}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
                    onChange={(e) => setFormData({...formData, orderId: e.target.value})}
                />
                <input 
                    placeholder={t('otp')}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
                    onChange={(e) => setFormData({...formData, otp: e.target.value})}
                />
                <input 
                    placeholder="New TV Number"
                    maxLength={4}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
                    onChange={(e) => setFormData({...formData, newTvNumber: e.target.value})}
                />
                
                <button 
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold flex justify-center items-center gap-2 mt-4"
                >
                    {loading ? 'Processing...' : <><MoveRight size={20} /> {t('move_time')}</>}
                </button>
            </div>
        </GlassCard>
      </div>
    </div>
  );
};
