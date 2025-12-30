import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  isVisible: boolean;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-md border border-white/10 ${
            type === 'error' ? 'bg-red-500/80 text-white' : 
            type === 'success' ? 'bg-green-500/80 text-white' : 
            'bg-indigo-500/80 text-white'
          }`}
        >
          {type === 'error' && <AlertCircle size={20} />}
          {type === 'success' && <CheckCircle size={20} />}
          {type === 'info' && <Info size={20} />}
          
          <span className="font-medium text-sm">{message}</span>
          
          <button onClick={onClose} className="opacity-70 hover:opacity-100 ml-2">
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};