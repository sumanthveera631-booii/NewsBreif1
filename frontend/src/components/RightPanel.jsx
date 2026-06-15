import { useState, useEffect } from 'react';
import { Target, TrendingUp, Calendar, Zap, Flame } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useAuth } from '../context/AuthContext';

export default function RightPanel() {
  const { user } = useAuth();
  const { examPreference } = useAppStore();
  const [revisions, setRevisions] = useState([]);

  useEffect(() => {
    // Fetch upcoming revisions to show in the panel
    const fetchRevisions = async () => {
      try {
      const res = await fetch('/api/revision', { credentials: 'include' });
        const data = await res.json();
        if (data.success) {
          setRevisions(data.daily.slice(0, 3)); // show top 3 due today
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchRevisions();
  }, []);

  const xp = user?.xp || 0;
  const streak = user?.currentStreak || 0;

  const indicatorColor = 
    examPreference === 'UPSC' 
      ? 'text-brand-primary bg-brand-primary/10' 
      : examPreference === 'BANKING' 
      ? 'text-brand-success bg-brand-success/10' 
      : 'text-brand-warning bg-brand-warning/10';

  return (
    <aside className="hidden lg:flex flex-col col-span-3 gap-6 h-[calc(100vh-32px)] sticky top-4 overflow-y-auto no-scrollbar">
      {/* Daily Progress */}
      <div className="neo-card p-5">
        <h3 className="font-extrabold text-sm text-gray-200 mb-4 flex items-center gap-2">
          <Target className="w-4 h-4 text-brand-secondary" /> 
          Daily Progress
        </h3>
        
        <div className="bg-surface-elevated rounded-xl p-4 border border-white/5 flex items-center justify-between mb-3">
          <div>
            <div className="text-[10px] uppercase font-bold text-gray-500 mb-1">Current Streak</div>
            <div className="text-xl font-black text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-brand-warning" />
              {streak} Days
            </div>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-surface-card flex items-center justify-center bg-brand-warning/10 text-brand-warning font-black text-sm">
            🔥
          </div>
        </div>

        <div className="bg-surface-elevated rounded-xl p-4 border border-white/5 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-gray-500 mb-1">Total XP</div>
            <div className="text-xl font-black text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-brand-secondary" />
              {xp}
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Revisions */}
      <div className="neo-card p-5 flex-1">
        <h3 className="font-extrabold text-sm text-gray-200 mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-brand-primary" /> 
          Due Today
        </h3>

        {revisions.length === 0 ? (
          <div className="h-32 flex flex-col items-center justify-center text-center p-4 border border-white/5 border-dashed rounded-xl">
            <span className="text-2xl mb-2">🎉</span>
            <span className="text-sm font-bold text-gray-400">All caught up!</span>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {revisions.map((rev) => (
              <div key={rev._id} className="p-3 bg-surface-elevated rounded-xl border border-white/5">
                <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md ${indicatorColor} mb-2 inline-block`}>
                  Revision
                </span>
                <p className="text-xs font-bold text-gray-300 line-clamp-2">
                  {rev.articleId?.title || 'Article'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
