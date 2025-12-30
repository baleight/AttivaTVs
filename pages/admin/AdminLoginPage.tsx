import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Lock, Loader2 } from 'lucide-react';
import { GlassCard } from '../../components/GlassCard';
import { AdminService } from '../../services/api';
import { useAppStore } from '../../store/useAppStore';
import { Toast, ToastType } from '../../components/Toast';

export const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAdmin, admin } = useAppStore();

  // Check if already logged in - Declarative Redirect
  const token = localStorage.getItem('admin_token');
  if (token || admin) {
      return <Navigate to="/admin/dashboard" replace />;
  }

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

      // Update state; this will trigger re-render and the <Navigate> above will kick in
      setTimeout(() => {
        setAdmin({ ...data.user, token: data.token });
      }, 500);

    } catch (err: any) {
      console.error("Login Error:", err);
      let msg = 'An unexpected error occurred.';

      if (err.response) {
        // Server responded with a status code outside of 2xx
        const status = err.response.status;
        if (status === 401) {
            msg = 'Incorrect email or password';
        } else if (status === 403) {
            msg = 'Access denied. Account locked or insufficient permissions.';
        } else if (status === 404) {
            msg = 'Login service not found. Check API configuration.';
        } else if (status >= 500) {
            msg = 'Server error. Please try again later.';
        } else {
            msg = err.response.data?.message || 'Login failed.';
        }
      } else if (err.request) {
        // Request made but no response received
        msg = 'Server unreachable. Please check your internet connection.';
      } else {
        // Error setting up request or manual throw (e.g. handleApiCall)
        if (err.message && (err.message.includes('Invalid Credentials') || err.message.includes('401'))) {
            msg = 'Incorrect email or password';
        } else if (err.message && (err.message.includes('Network Error') || err.message.includes('Failed to fetch'))) {
            msg = 'Server unreachable. Check your connection.';
        } else {
            msg = err.message || 'Login initialization failed.';
        }
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