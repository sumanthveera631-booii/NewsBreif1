import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Brain, Calendar, Search, User, LogOut } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useAuth } from '../context/AuthContext';

export default function DesktopSidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { examPreference } = useAppStore();
  const { signOut } = useAuth();

  const navItems = [
    { label: 'Dashboard', icon: Home, path: '/dashboard' },
    { label: 'Quiz Mode', icon: Brain, path: '/quiz' },
    { label: 'Revision', icon: Calendar, path: '/revision' },
    { label: 'Search', icon: Search, path: '/search' },
    { label: 'Profile', icon: User, path: '/profile' }
  ];

  const activeColor = 
    examPreference === 'UPSC' 
      ? 'text-brand-primary bg-brand-primary/10 border-brand-primary/20' 
      : examPreference === 'BANKING' 
      ? 'text-brand-success bg-brand-success/10 border-brand-success/20' 
      : 'text-brand-warning bg-brand-warning/10 border-brand-warning/20';

  const indicatorColor = 
    examPreference === 'UPSC' 
      ? 'bg-brand-primary' 
      : examPreference === 'BANKING' 
      ? 'bg-brand-success' 
      : 'bg-brand-warning';

  return (
    <aside className="hidden lg:flex flex-col col-span-2 h-[calc(100vh-32px)] sticky top-4 neo-card overflow-hidden">
      <div className="p-6 pb-2">
        <div className="flex items-center gap-3 cursor-pointer mb-8" onClick={() => navigate('/dashboard')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center shadow">
            <span className="font-bold text-xl text-white">N</span>
          </div>
          <span className="font-extrabold text-xl tracking-tight">
            News<span className="text-brand-primary">Brief</span>
          </span>
        </div>

        <div className="text-[10px] uppercase font-bold text-gray-500 mb-3 tracking-widest pl-2">Menu</div>
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;

            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-200 border cursor-pointer ${
                  isActive 
                    ? activeColor 
                    : 'border-transparent text-gray-400 hover:bg-white/5 hover:text-gray-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? '' : 'text-gray-400'}`} />
                <span className="font-bold text-sm">{item.label}</span>
                {isActive && (
                  <div className={`w-1.5 h-1.5 rounded-full ml-auto ${indicatorColor}`} />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 pt-2">
        <div className="text-[10px] uppercase font-bold text-gray-500 mb-3 tracking-widest pl-2">Preferences</div>
        <div className="flex items-center gap-3 w-full p-3 rounded-xl bg-surface-elevated border border-white/5 mb-4">
          <div className={`w-2 h-2 rounded-full ${indicatorColor}`} />
          <span className="font-bold text-sm text-gray-300">{examPreference}</span>
        </div>

        <button
          onClick={signOut}
          className="flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-200 border border-transparent text-gray-400 hover:bg-brand-danger/10 hover:text-brand-danger hover:border-brand-danger/20 cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-bold text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
}
