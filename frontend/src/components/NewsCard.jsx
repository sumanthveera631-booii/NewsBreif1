import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Share2, Calendar, Sparkles } from 'lucide-react';
import { useAppStore } from '../store/appStore';

export default function NewsCard({ article, onBookmarkToggle }) {
  const navigate = useNavigate();
  const { bookmarkedIds, toggleBookmark } = useAppStore();
  const [savingRevision, setSavingRevision] = useState(false);
  const [revisionScheduled, setRevisionScheduled] = useState(false);
  const [shareText, setShareText] = useState('Share');

  const isBookmarked = bookmarkedIds.includes(article._id);

  const handleBookmark = async (e) => {
    e.stopPropagation();
    try {
      const res = await fetch('/api/user/bookmark', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId: article._id }),
      });
      if (res.ok) {
        toggleBookmark(article._id);
        if (onBookmarkToggle) onBookmarkToggle(article._id);
      }
    } catch (err) {
      console.error('Error bookmarking:', err);
    }
  };

  const handleSaveRevision = async (e) => {
    e.stopPropagation();
    if (revisionScheduled) return;
    setSavingRevision(true);
    try {
      const res = await fetch('/api/revision/schedule', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId: article._id, intervalDays: 1 }),
      });
      if (res.ok) {
        setRevisionScheduled(true);
      }
    } catch (err) {
      console.error('Error scheduling revision:', err);
    } finally {
      setSavingRevision(false);
    }
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/article/${article._id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: `Check out this exam briefing on NewsBrief:`,
          url: shareUrl
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      setShareText('Copied!');
      setTimeout(() => setShareText('Share'), 2000);
    }
  };

  const handleCardClick = () => {
    navigate(`/article/${article._id}`);
  };

  const handleAIExplain = (e) => {
    e.stopPropagation();
    navigate(`/article/${article._id}?ai=true`);
  };

  const importanceColor = 
    article.importanceScore >= 80 
      ? 'text-brand-danger bg-brand-danger/10 border-brand-danger/20' 
      : article.importanceScore >= 50 
      ? 'text-brand-warning bg-brand-warning/10 border-brand-warning/20' 
      : 'text-brand-info bg-brand-info/10 border-brand-info/20';

  const probColor = 
    article.examProbabilityScore >= 85 
      ? 'text-brand-success bg-brand-success/10 border-brand-success/20' 
      : 'text-brand-primary bg-brand-primary/10 border-brand-primary/20';

  const previewText = article.bulletPoints?.length
    ? article.bulletPoints.join(' ')
    : article.wordSummary || article.summaries?.oneHundredWord || article.summary100w || 'Deep exam-context briefing unavailable.';
  const previewLabel = article.bulletPoints?.length
    ? 'Bullet summary'
    : article.wordSummary
    ? '100-word summary'
    : article.summary15s
    ? '15-second summary'
    : 'Brief summary';

  return (
    <motion.div
      layout
      onClick={handleCardClick}
      className="w-full rounded-2xl bg-surface-card border border-white/5 hover:border-white/10 transition-all duration-300 hover:-translate-y-1 cursor-pointer neo-card overflow-hidden"
      whileHover={{ y: -3 }}
    >
      {article.imageUrl ? (
        <div className="w-full h-40 relative bg-surface-elevated overflow-hidden">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=800';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-card/80 to-transparent" />
          <div className="absolute bottom-3 left-3 rounded-full bg-black/40 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white backdrop-blur-sm">
            {article.source}
          </div>
        </div>
      ) : (
        <div className="w-full h-40 bg-surface-elevated flex items-center justify-center text-gray-500 text-xs uppercase tracking-[0.2em]">
          Live media unavailable
        </div>
      )}

      <div className="p-5 flex flex-col flex-1">
        {/* Top Details */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-surface-elevated border border-white/10 flex items-center justify-center text-[10px] font-bold text-gray-400">
              {article.source ? article.source.charAt(0) : 'N'}
            </div>
            <div>
              <span className="text-xs font-bold text-gray-300 font-display block leading-none">{article.source || 'News Source'}</span>
              <span className="text-[9px] text-gray-500 font-semibold uppercase mt-0.5 block">
                {new Date(article.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>

          <div className="flex gap-1.5">
            <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase border ${importanceColor}`}>
              Imp {article.importanceScore}
            </span>
            <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase border ${probColor}`}>
              Prob {article.examProbabilityScore}%
            </span>
          </div>
        </div>

        {/* Headline & Read Time */}
        <div className="flex-1 mb-4">
          <h3 className="text-base font-extrabold text-gray-100 font-display leading-snug line-clamp-2 mb-2 hover:text-brand-primary transition-colors">
            {article.title}
          </h3>
          <p className="text-sm text-gray-300 leading-relaxed line-clamp-4 mb-3">
            {previewText}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
              {previewLabel}
            </span>
            <span className="text-[10px] text-gray-500">•</span>
            <span className="text-[10px] text-brand-secondary font-bold uppercase tracking-wider">
              3 MIN READ
            </span>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-auto">
          <div className="flex items-center gap-1">
            <button
              onClick={handleBookmark}
              className={`p-2 rounded-xl border transition-all hover:bg-white/5 active:scale-95 cursor-pointer ${
                isBookmarked 
                  ? 'border-brand-primary/30 text-brand-primary bg-brand-primary/5' 
                  : 'border-white/5 text-gray-400'
              }`}
              title="Bookmark"
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={handleSaveRevision}
              disabled={savingRevision}
              className={`p-2 rounded-xl border transition-all hover:bg-white/5 active:scale-95 cursor-pointer ${
                revisionScheduled 
                  ? 'border-brand-success/30 text-brand-success bg-brand-success/5' 
                  : 'border-white/5 text-gray-400'
              }`}
              title={revisionScheduled ? 'Scheduled for Revision' : 'Schedule Revision'}
            >
              <Calendar className={`w-4 h-4 ${revisionScheduled ? 'text-brand-success' : ''}`} />
            </button>

            <button
              onClick={handleShare}
              className="p-2 rounded-xl border border-white/5 hover:bg-white/5 text-gray-400 active:scale-95 transition-all cursor-pointer"
              title="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleAIExplain}
            className="px-3 py-1.5 rounded-xl border border-brand-primary/20 bg-brand-primary/5 text-[10px] font-extrabold uppercase text-brand-primary flex items-center gap-1 hover:bg-brand-primary/10 transition-all active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 fill-brand-primary/10" /> AI Explain
          </button>
        </div>
      </div>
    </motion.div>
  );
}
