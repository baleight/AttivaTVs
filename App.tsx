import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/public/LandingPage';
import { ChangeRoomPage } from './pages/public/ChangeRoomPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { useAppStore } from './store/useAppStore';
import './i18n';

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const admin = useAppStore((state) => state.admin);
  const token = localStorage.getItem('admin_token');
  
  if (!admin && !token) {
    return <Navigate to="/admin" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/change-room" element={<ChangeRoomPage />} />
      
      {/* Admin Routes */}
      <Route path="/admin" element={<AdminLoginPage />} />
      <Route 
        path="/admin/dashboard" 
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
};

export default App;