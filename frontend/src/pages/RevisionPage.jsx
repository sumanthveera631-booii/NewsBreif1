import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, CheckCircle2, AlertCircle, ArrowRight, BookmarkCheck, BookOpen } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useAuth } from '../context/AuthContext';

export default function RevisionPage() {
  const { status, user, update } = useAuth();
  const navigate = useNavigate();
  const { setUserProfile, addXp } = useAppStore();

  const [activeTab, setActiveTab] = useState('daily');
  const [revisionData, setRevisionData] = useState({ daily: [], weekly: [], monthly: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completingId, setCompletingId] = useState(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      navigate('/login');
    }
  }, [status, navigate]);

  const loadRevisionQueue = () => {
    if (status !== 'authenticated') return;
    setLoading(true);
    setError(null);

    fetch('/api/revision', { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load revision items');
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          setRevisionData({
            daily: data.daily || [],
            weekly: data.weekly || [],
            monthly: data.monthly || []
          });
        }
      })
      .catch((err) => {
        setError('Could not sync spaced repetition queue.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadRevisionQueue();
  }, [status]);

  const handleMarkComplete = async (revisionId) => {
    setCompletingId(revisionId);
    try {
      const res = await fetch('/api/revision/complete', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revisionId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRevisionData((prev) => {
          const updated = { ...prev };
          Object.keys(updated).forEach((tab) => {
            updated[tab] = updated[tab].filter((item) => item._id !== revisionId);
          });
          return updated;
        });

        addXp(5);
        if (user) {
          setUserProfile({
            ...user,
            xp: data.userXp
          });
        }
        await update(); // refresh auth session context
      }
    } catch (err) {
      console.error('Failed to log completion:', err);
    } finally {
      setCompletingId(null);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-brand-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-3">Syncing Spaced Repetition...</span>
      </div>
    );
  }

  const activeList = revisionData[activeTab] || [];

  return (
    <div className="w-full max-w-xl mx-auto px-4 lg:px-0 py-6 flex-1 flex flex-col gap-6">
      <section aria-label="Header Summary" className="flex items-center gap-3 bg-surface-card/30 p-4 rounded-2xl border border-white/5 neo-card mt-4 lg:mt-0">
        <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
          <Calendar className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-white font-display leading-none">Spaced Repetition Queue</h2>
          <p className="text-[11px] text-gray-500 font-semibold mt-1">AI schedules articles for recall to optimize your memory locks.</p>
        </div>
      </section>

      <section aria-label="Revision schedule selectors">
        <div className="flex p-1 bg-surface-secondary rounded-2xl border border-white/5 neo-card">
          {[
            { id: 'daily', label: 'Daily', count: revisionData.daily.length },
            { id: 'weekly', label: 'Weekly', count: revisionData.weekly.length },
            { id: 'monthly', label: 'Monthly', count: revisionData.monthly.length }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 text-xs font-bold uppercase rounded-xl transition-all relative flex items-center justify-center gap-1.5 cursor-pointer ${
                  isActive 
                    ? 'bg-brand-primary text-white shadow shadow-brand-primary/20' 
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black ${
                    isActive ? 'bg-white/20 text-white' : 'bg-surface-elevated text-gray-400'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section aria-label="Revision cards lists" className="flex flex-col gap-4">
        {error ? (
          <div className="p-8 rounded-2xl bg-surface-card border border-brand-danger/10 text-center neo-card flex flex-col items-center gap-3">
            <AlertCircle className="w-8 h-8 text-brand-danger" />
            <p className="text-sm font-semibold text-gray-300">{error}</p>
            <button
              onClick={loadRevisionQueue}
              className="mt-2 px-4 py-2 text-xs font-bold rounded-lg border border-brand-danger/25 text-brand-danger hover:bg-brand-danger/5 transition-all cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : activeList.length === 0 ? (
          <div className="p-10 rounded-2xl bg-surface-card border border-white/5 text-center neo-card flex flex-col items-center justify-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-surface-secondary flex items-center justify-center text-gray-500 border border-white/5">
              <BookmarkCheck className="w-7 h-7 text-brand-success" />
            </div>
            <div>
              <h4 className="text-base font-bold text-gray-300 font-display">All Caught Up!</h4>
              <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1.5 leading-relaxed">
                No pending study briefings in your {activeTab} revision pool. Read briefings and select "Schedule Revision" to populate this queue.
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-5 py-2.5 rounded-xl bg-brand-primary text-xs font-bold text-white transition-all neo-btn-accent shadow cursor-pointer"
            >
              Find Briefings
            </button>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {activeList.map((item) => (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.25 }}
                layout
                className="w-full p-5 rounded-2xl bg-surface-card border border-white/5 neo-card text-left flex flex-col justify-between gap-4"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <span className="text-[9px] uppercase tracking-wider text-brand-primary font-bold block mb-1.5">
                      Scheduled: {new Date(item.scheduledDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                    <h4 
                      onClick={() => navigate(`/article/${item.articleId?._id}`)}
                      className="text-sm font-extrabold text-gray-200 leading-snug font-display hover:text-brand-primary transition-colors cursor-pointer"
                    >
                      {item.articleId?.title || 'Unknown Briefing'}
                    </h4>
                  </div>

                  <div className="shrink-0 flex items-center gap-1 bg-surface-secondary/50 px-2 py-0.5 rounded border border-white/5 text-[9px] font-bold text-gray-400">
                    <BookOpen className="w-3 h-3" /> {item.articleId?.source}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-2">
                  <button
                    onClick={() => navigate(`/article/${item.articleId?._id}`)}
                    className="text-[10px] font-extrabold text-gray-400 hover:text-white uppercase flex items-center gap-1.5 cursor-pointer"
                  >
                    Read Briefing <ArrowRight className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => handleMarkComplete(item._id)}
                    disabled={completingId === item._id}
                    className="px-3 py-1.5 rounded-xl border border-brand-success/20 bg-brand-success/5 text-[10px] font-extrabold uppercase text-brand-success flex items-center gap-1 hover:bg-brand-success/10 transition-all active:scale-95 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> {completingId === item._id ? 'Saving...' : 'Mark Done (+5 XP)'}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </section>
    </div>
  );
}
