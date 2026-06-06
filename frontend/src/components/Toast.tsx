import React, { useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';

interface ToastProps {
  message: string;
  isOpen: boolean;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  return (
    <div 
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 border border-green-500/30 text-green-400 px-4 py-3 rounded-2xl flex items-center space-x-2 shadow-2xl transition-all duration-300 pointer-events-none ${
        isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <CheckCircle2 className="w-4 h-4" />
      <span className="text-xs font-semibold">{message}</span>
    </div>
  );
};
