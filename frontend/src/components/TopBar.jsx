import { useNavigate } from 'react-router-dom';
import { Flame, Award, Clock, User } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useAuth } from '../context/AuthContext';

export default function TopBar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { examPreference } = useAppStore();

  const xp = user?.xp || 0;
  const streak = user?.currentStreak || 0;
  const dailyGoal = user?.dailyGoal || 15;
  
  const articlesTarget = dailyGoal === 15 ? 3 : dailyGoal === 30 ? 6 : 12;
  const readTodayCount = Math.min(articlesTarget, Math.floor(xp / 10) % articlesTarget || 1);
  const progressPercent = Math.min(100, Math.round((readTodayCount / articlesTarget) * 100));

  return (
    <div className="w-full px-6 py-4 glass-panel border-b border-white/5 flex items-center justify-between sticky top-0 z-30">
      {/* Brand (Hidden on desktop since Sidebar handles it) */}
      <div className="flex items-center gap-2 cursor-pointer lg:hidden" onClick={() => navigate('/dashboard')}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center shadow">
          <span className="font-bold text-lg text-white">N</span>
        </div>
        <span className="font-extrabold text-base tracking-tight hidden xs:inline-block">
          News<span className="text-brand-primary">Brief</span>
        </span>
      </div>

      <div className="hidden lg:block font-extrabold text-xl font-display">
        {/* Placeholder for page title, but we can leave it empty for now or show date */}
        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
      </div>

      {/* Stats Container */}
      <div className="flex items-center gap-4 md:gap-6 ml-auto lg:ml-0">
        {/* Streak */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-card border border-white/5 shadow-sm">
          <Flame className="w-4 h-4 text-brand-warning fill-brand-warning" />
          <span className="font-bold text-sm text-gray-200">{streak}</span>
          <span className="text-[10px] uppercase font-bold text-brand-warning tracking-wider hidden sm:inline">Days</span>
        </div>

        {/* XP */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-card border border-white/5 shadow-sm">
          <Award className="w-4 h-4 text-brand-secondary" />
          <span className="font-bold text-sm text-gray-200">{xp}</span>
          <span className="text-[10px] uppercase font-bold text-brand-secondary tracking-wider hidden sm:inline">XP</span>
        </div>

        {/* Daily Goal Gauge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-card border border-white/5 shadow-sm">
          <div className="relative w-5 h-5 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="10" cy="10" r="8" stroke="rgba(255,255,255,0.05)" strokeWidth="2.5" fill="transparent" />
              <circle
                cx="10" cy="10" r="8"
                stroke="var(--accent)"
                strokeWidth="2.5" fill="transparent"
                strokeDasharray={`${2 * Math.PI * 8}`}
                strokeDashoffset={`${2 * Math.PI * 8 * (1 - progressPercent / 100)}`}
                className="transition-all duration-500"
              />
            </svg>
            <Clock className="w-2.5 h-2.5 absolute text-gray-400" />
          </div>
          <div className="flex flex-col text-[10px]">
            <span className="font-extrabold text-gray-200 leading-none">{readTodayCount * 5}m</span>
            <span className="text-gray-500 font-semibold uppercase leading-none mt-0.5">/ {dailyGoal}m</span>
          </div>
        </div>

        {/* Profile Image/Avatar */}
        <div 
          onClick={() => navigate('/profile')}
          className="w-9 h-9 rounded-full overflow-hidden border border-white/10 hover:border-brand-primary bg-surface-card cursor-pointer transition-all flex items-center justify-center shrink-0"
        >
          {user?.image ? (
            <img src={user.image} alt={user.name || 'User'} className="w-full h-full object-cover" />
          ) : (
            <User className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>
    </div>
  );
}
