import React from 'react';
import SideBar from './SideBar';
import TopBar from './TopBar';

interface AppLayoutProps {
  children: React.ReactNode;
  activeView: 'calendar' | 'overview';
  setActiveView: (view: 'calendar' | 'overview') => void;
}

const AppLayout = ({ children, activeView, setActiveView }: AppLayoutProps) => {
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden text-text-primary">
      <SideBar />
      
      <div className="flex flex-col flex-1 h-full min-w-0">
        {/* Pass the props into TopBar */}
        <TopBar activeView={activeView} setActiveView={setActiveView} />
        
        <main className="flex-1 overflow-y-auto custom-scroll relative">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;