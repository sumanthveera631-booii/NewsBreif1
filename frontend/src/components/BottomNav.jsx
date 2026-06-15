import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Brain, Calendar, Search, User } from 'lucide-react';
import { useAppStore } from '../store/appStore';

export default function BottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { examPreference } = useAppStore();

  const navItems = [
    { label: 'Home', icon: Home, path: '/dashboard' },
    { label: 'Quiz', icon: Brain, path: '/quiz' },
    { label: 'Revision', icon: Calendar, path: '/revision' },
    { label: 'Search', icon: Search, path: '/search' },
    { label: 'Profile', icon: User, path: '/profile' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-4 md:pb-6 pointer-events-none flex justify-center lg:hidden">
      <nav className="w-full max-w-lg pointer-events-auto rounded-2xl glass-panel-elevated shadow-lg flex items-center justify-around py-3 px-4 border border-white/10">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;

          const activeColor = 
            examPreference === 'UPSC' 
              ? 'text-brand-primary' 
              : examPreference === 'BANKING' 
              ? 'text-brand-success' 
              : 'text-brand-warning';

          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 active:scale-90 relative cursor-pointer"
            >
              <Icon 
                className={`w-6 h-6 transition-colors duration-200 ${
                  isActive ? activeColor : 'text-gray-400 hover:text-gray-200'
                }`} 
              />
              <span 
                className={`text-[9px] font-extrabold uppercase mt-1 tracking-wider transition-colors duration-200 ${
                  isActive ? activeColor : 'text-gray-500'
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <div 
                  className={`absolute -bottom-1 w-1 h-1 rounded-full ${
                    examPreference === 'UPSC' 
                      ? 'bg-brand-primary' 
                      : examPreference === 'BANKING' 
                      ? 'bg-brand-success' 
                      : 'bg-brand-warning'
                  }`} 
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
