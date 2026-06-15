import { Outlet } from 'react-router-dom';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import DesktopSidebar from './DesktopSidebar';
import RightPanel from './RightPanel';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-bg-primary text-foreground relative">
      <div className="lg:max-w-7xl lg:mx-auto lg:grid lg:grid-cols-12 lg:gap-6 lg:p-4">
        
        {/* Left Sidebar (Desktop only) */}
        <DesktopSidebar />

        {/* Center Content Column */}
        <div className="col-span-12 lg:col-span-7 flex flex-col min-h-screen lg:min-h-0">
          <TopBar />
          
          <main className="flex-1 w-full pb-24 lg:pb-0">
            <Outlet />
          </main>
        </div>

        {/* Right Sidebar (Desktop only) */}
        <RightPanel />

      </div>

      {/* Bottom Nav (Mobile only) */}
      <BottomNav />
    </div>
  );
}
