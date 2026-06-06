import { Outlet } from 'react-router-dom';
import SideBar from './components/layout/SideBar';
import TopBar from './components/layout/TopBar';

export default function Layout() {
  return (
    <div className="flex h-screen w-full bg-white font-sans overflow-hidden">
      <SideBar />

      <div className="flex flex-col flex-1 w-full overflow-hidden">
        {/* TopBar no longer needs props passed to it */}
        <TopBar />

        {/* The Outlet renders the child route components here */}
        <main className="flex-1 overflow-y-auto bg-white">
          <Outlet />
        </main>
      </div>
    </div>
  );
}