import React from 'react';
import SideBar from './SideBar';
import TopBar from './TopBar';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden text-text-primary">
      <SideBar />
      
      <div className="flex flex-col flex-1 h-full min-w-0">
        <TopBar />
        
        {/* Main Content Area - Uses the custom scrollbar we defined in index.css */}
        <main className="flex-1 overflow-y-auto custom-scroll relative">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;