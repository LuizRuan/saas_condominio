import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import CondominiumBar from './CondominiumBar';
import { useAuth } from '../../contexts/AuthContext';

const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { isAdmin } = useAuth();

  return (
    <div className="app-shell flex h-screen overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {isAdmin && <CondominiumBar />}
        <main className="app-main flex-1 overflow-y-auto">
          <Outlet context={{ onMenuClick: () => setSidebarOpen(true) }} />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
