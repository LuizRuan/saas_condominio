import React, { createContext, useContext, useState, ReactNode } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

interface DemoContextType {
  isDemo: boolean;
  blockAction: () => void;
  demoRole: string;
  setDemoRole: (role: string) => void;
}

const DemoContext = createContext<DemoContextType>({
  isDemo: false,
  blockAction: () => {},
  demoRole: 'admin',
  setDemoRole: () => {},
});

export const useDemo = () => useContext(DemoContext);

export const DemoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isDemo, overrideDemoRole } = useAuth();
  const [demoRole, setDemoRoleState] = useState('admin');

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

  const setDemoRole = (role: string) => {
    setDemoRoleState(role);
    overrideDemoRole(role);
  };

  return (
    <DemoContext.Provider value={{ isDemo, blockAction, demoRole, setDemoRole }}>
      {children}
    </DemoContext.Provider>
  );
};
