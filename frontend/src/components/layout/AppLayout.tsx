import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import DemoBanner from '../demo/DemoBanner';

const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell flex h-screen flex-col overflow-hidden">
      <DemoBanner />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <main className="app-main flex-1 overflow-y-auto">
            <Outlet context={{ onMenuClick: () => setSidebarOpen(true) }} />
          </main>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
