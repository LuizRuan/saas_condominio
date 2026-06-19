import React, { createContext, useContext, ReactNode } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

interface DemoContextType {
  isDemo: boolean;
  blockAction: () => void;
}

const DemoContext = createContext<DemoContextType>({ isDemo: false, blockAction: () => {} });

export const useDemo = () => useContext(DemoContext);

export const DemoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isDemo } = useAuth();

  const blockAction = () => {
    toast('🎭 Você está em modo demonstração. Crie uma conta gratuita para usar esta função.', {
      duration: 3500,
      style: {
        background: '#1e293b',
        color: '#f8fafc',
        fontSize: '13px',
        borderRadius: '10px',
        border: '1px solid rgba(251, 191, 36, 0.3)',
      },
      icon: '🔒',
    });
  };

  return (
    <DemoContext.Provider value={{ isDemo, blockAction }}>
      {children}
    </DemoContext.Provider>
  );
};
