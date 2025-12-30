import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Loader2 } from 'lucide-react';
import { GlassCard } from '../../components/GlassCard';
import { AdminService } from '../../services/api';
import { useAppStore } from '../../store/useAppStore';
import { Toast, ToastType } from '../../components/Toast';

export const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAdmin = useAppStore(state => state.setAdmin);

  // Toast State
  const [toast, setToast] = useState<{ show: boolean; message: string; type: ToastType }>({
    show: false,
    message: '',
    type: 'info'
  });

  const showToast = (message: string, type: ToastType) => {
    setToast({ show: true, message, type });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
        showToast('Please enter both email and password', 'error');
        return;
    }

    setLoading(true);
    try {
      const { data } = await AdminService.login({ email, password });
      
      // Simulate token validation or successful login feedback
      if (data.token === 'demo_jwt_token') {
         showToast('Login Successful (Demo Mode)', 'success');
      } else {
         showToast('Login Successful', 'success');
      }

      // Short delay to show success message
      setTimeout(() => {
        setAdmin({ ...data.user, token: data.token });
        navigate('/admin/dashboard');
      }, 500);

    } catch (err: any) {
      console.error(err);
      let msg = 'Invalid credentials';
      if (err.response) {
         if (err.response.status === 401) msg = 'Incorrect email or password';
         else if (err.response.status === 403) msg = 'Access denied';
         else if (err.response.status === 404) msg = 'Login service not found';
         else if (err.response.status >= 500) msg = 'Server error. Please try again later.';
      } else if (err.request) {
          msg = 'Server unreachable. Check your connection.';
      }
      showToast(msg, 'error');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <GlassCard className="w-full max-w-sm relative">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-indigo-500/20 rounded-full">
            <Lock className="w-8 h-8 text-indigo-400" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center mb-6 font-heading">Admin Access</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 uppercase font-semibold">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-indigo-500 focus:outline-none transition-colors"
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase font-semibold">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-indigo-500 focus:outline-none transition-colors"
              placeholder="••••••••"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 rounded-lg font-bold transition-colors flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
                For demo access, use any email/password. 
                <br/>(e.g., admin@tvtime.com / admin)
            </p>
        </div>
      </GlassCard>

      <Toast 
            message={toast.message} 
            type={toast.type} 
            isVisible={toast.show} 
            onClose={() => setToast(prev => ({ ...prev, show: false }))} 
      />
    </div>
  );
};