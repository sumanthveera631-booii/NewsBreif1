import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Bookmark, Share2, Sparkles, AlertCircle, ZoomIn, ZoomOut, Eye, EyeOff } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useAuth } from '../context/AuthContext';
import AIDrawer from '../components/AIDrawer';

export default function ArticlePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();

  const { status } = useAuth();
  const { bookmarkedIds, toggleBookmark } = useAppStore();

  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [summaryMode, setSummaryMode] = useState('15s'); 
  const [fontSize, setFontSize] = useState(18);
  const [focusMode, setFocusMode] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [activeQuizIndex, setActiveQuizIndex] = useState(0);
  const [showQuizAnswer, setShowQuizAnswer] = useState(false);

  const articleRef = useRef(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      navigate('/login');
    }
  }, [status, navigate]);

  useEffect(() => {
    if (status !== 'authenticated' || !id) return;

    setLoading(true);
    setError(null);

    fetch(`/api/articles/${id}`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Briefing not found');
        return res.json();
      })
      .then((data) => {
        if (data.article) {
          setArticle(data.article);
          if (searchParams.get('ai') === 'true') {
            setIsAiOpen(true);
          }
        }
      })
      .catch((err) => {
        setError(err.message || 'Error loading briefing');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [status, id, searchParams]);

  useEffect(() => {
    const handleScroll = () => {
      if (!articleRef.current) return;
      const element = articleRef.current;
      const totalHeight = element.clientHeight - window.innerHeight;
      const windowScroll = window.scrollY;
      if (totalHeight > 0) {
        setScrollProgress(Math.min(100, (windowScroll / totalHeight) * 100));
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [article, loading]);

  const handleBookmarkToggle = async () => {
    if (!article) return;
    try {
      const res = await fetch('/api/user/bookmark', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId: article._id }),
      });
      if (res.ok) {
        toggleBookmark(article._id);
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err);
    }
  };

  const isBookmarked = article ? bookmarkedIds.includes(article._id) : false;

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-bg-primary text-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-brand-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Opening Reader...</span>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-bg-primary text-gray-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-3xl bg-surface-card border border-brand-danger/10 text-center neo-card flex flex-col items-center gap-4">
          <AlertCircle className="w-10 h-10 text-brand-danger" />
          <h3 className="text-lg font-bold">Failed to Load Briefing</h3>
          <p className="text-sm text-gray-400">{error || 'Briefing details could not be retrieved.'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 rounded-xl bg-surface-secondary text-xs font-bold border border-white/5 hover:bg-surface-elevated text-gray-200 transition-all cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={articleRef} className="min-h-screen bg-bg-primary text-gray-100 pb-28 selection:bg-brand-primary/20">
      <div className="fixed top-0 left-0 right-0 h-1 z-50 bg-white/5">
        <div className="h-full bg-brand-primary transition-all duration-100" style={{ width: `${scrollProgress}%` }} />
      </div>

      <header className="sticky top-0 z-40 w-full px-4 py-3.5 glass-panel border-b border-white/5 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl border border-white/5 hover:bg-white/5 text-gray-400 hover:text-white transition-all active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFocusMode(!focusMode)}
            className={`p-2 rounded-xl border transition-all hover:bg-white/5 active:scale-95 cursor-pointer ${focusMode ? 'border-brand-primary text-brand-primary bg-brand-primary/5' : 'border-white/5 text-gray-400'}`}
            title="Focus Mode"
          >
            {focusMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setFontSize((prev) => Math.max(14, prev - 2))}
            className="p-2 rounded-xl border border-white/5 hover:bg-white/5 text-gray-400 active:scale-95 transition-all cursor-pointer"
            title="Decrease Text"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            onClick={() => setFontSize((prev) => Math.min(26, prev + 2))}
            className="p-2 rounded-xl border border-white/5 hover:bg-white/5 text-gray-400 active:scale-95 transition-all cursor-pointer"
            title="Increase Text"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={handleBookmarkToggle}
            className={`p-2 rounded-xl border transition-all hover:bg-white/5 active:scale-95 cursor-pointer ${isBookmarked ? 'border-brand-primary text-brand-primary bg-brand-primary/5' : 'border-white/5 text-gray-400'}`}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>
        </div>
      </header>

      {!focusMode && (
        <div className="w-full max-w-2xl mx-auto px-6 pt-8">
          <div className="flex items-center justify-between mb-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
            <span>{article.source}</span>
            <span>{new Date(article.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold font-display text-white leading-tight mb-4 select-text">
            {article.title}
          </h1>

          <div className="flex gap-2 mb-8">
            <span className="px-3 py-1 rounded-lg text-xs font-extrabold uppercase bg-brand-danger/10 border border-brand-danger/25 text-brand-danger">
              Importance: {article.importanceScore} / 100
            </span>
            <span className="px-3 py-1 rounded-lg text-xs font-extrabold uppercase bg-brand-success/10 border border-brand-success/25 text-brand-success">
              Exam Probability: {article.examProbabilityScore}%
            </span>
          </div>

          <div className="flex p-1 bg-surface-secondary rounded-2xl border border-white/5 neo-card mb-8">
            {[
              { id: '15s', label: '15-Sec Bullets' },
              { id: '100w', label: '100-Word summary' },
              { id: 'deep', label: 'Deep Dive' }
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setSummaryMode(mode.id)}
                className={`flex-1 py-3 text-xs font-extrabold uppercase rounded-xl transition-all cursor-pointer ${
                  summaryMode === mode.id
                    ? 'bg-brand-primary text-white shadow shadow-brand-primary/20'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="w-full max-w-2xl mx-auto px-6 mt-4 select-text">
        <motion.div
          key={summaryMode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="serif-article text-gray-200"
          style={{ fontSize: `${fontSize}px` }}
        >
          {summaryMode === '15s' && (
            <div className="space-y-4">
              {article.bulletPoints?.length ? (
                article.bulletPoints.map((bullet, idx) => (
                  <div key={idx} className="flex gap-3 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0 mt-3.5" />
                    <p className="m-0 leading-relaxed font-medium text-gray-300">{bullet}</p>
                  </div>
                ))
              ) : article.summary15s ? (
                article.summary15s.split('\n').map((bullet, idx) => (
                  <div key={idx} className="flex gap-3 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0 mt-3.5" />
                    <p className="m-0 leading-relaxed font-medium text-gray-300">{bullet.replace(/^-\s*/, '')}</p>
                  </div>
                ))
              ) : (
                <p>No 15-second summaries generated for this briefing.</p>
              )}
            </div>
          )}

          {summaryMode === '100w' && (
            <p className="leading-relaxed font-medium text-gray-300">
              {article.wordSummary || article.summaries?.oneHundredWord || article.summary100w || 'No 100-word summary available.'}
            </p>
          )}

          {summaryMode === 'deep' && (
            <div 
              className="leading-relaxed text-gray-300 font-medium"
              dangerouslySetInnerHTML={{ __html: article.deepDive || article.summaries?.deepDive || article.summaryDeepDive || article.content }}
            />
          )}
        </motion.div>
      </div>

      {article.quiz?.length > 0 && (
        <section className="w-full max-w-2xl mx-auto px-6 mt-8">
          <div className="rounded-3xl bg-surface-secondary border border-white/10 p-6 neo-card">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-extrabold text-white">Quiz</h2>
                <p className="text-xs text-gray-400 mt-1">Test your understanding of this briefing.</p>
              </div>
              <span className="text-[11px] uppercase font-bold tracking-[0.25em] text-brand-primary">
                {activeQuizIndex + 1} / {article.quiz.length}
              </span>
            </div>

            <div className="space-y-4">
              <div className="text-sm text-gray-300 leading-relaxed">
                {article.quiz[activeQuizIndex].question}
              </div>

              <div className="grid gap-3">
                {article.quiz[activeQuizIndex].options.map((option, idx) => {
                  // Resolve correctAnswer text to index for highlighting
                  const correctText = String(article.quiz[activeQuizIndex].correctAnswer || '').trim().toLowerCase();
                  const resolvedCorrectIdx = article.quiz[activeQuizIndex].options.findIndex(
                    opt => opt.trim().toLowerCase() === correctText
                  );
                  const isCorrect = showQuizAnswer && idx === resolvedCorrectIdx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setShowQuizAnswer(true)}
                      className={`w-full text-left rounded-2xl border px-4 py-3 transition-all ${
                        isCorrect ? 'border-brand-success bg-brand-success/10 text-brand-success' : 'border-white/10 bg-surface-card text-gray-200 hover:bg-surface-elevated'
                      }`}
                    >
                      <span className="font-medium">{String.fromCharCode(65 + idx)}.</span> {option}
                    </button>
                  );
                })}
              </div>

              {showQuizAnswer && (() => {
                const correctText = String(article.quiz[activeQuizIndex].correctAnswer || '').trim().toLowerCase();
                const resolvedIdx = article.quiz[activeQuizIndex].options.findIndex(
                  opt => opt.trim().toLowerCase() === correctText
                );
                return (
                  <div className="rounded-2xl bg-black/20 border border-white/10 p-4">
                    <p className="text-sm text-gray-300 font-semibold">Correct answer:</p>
                    <p className="text-sm text-gray-100 mt-2">
                      {resolvedIdx >= 0 ? `${String.fromCharCode(65 + resolvedIdx)}. ${article.quiz[activeQuizIndex].options[resolvedIdx]}` : article.quiz[activeQuizIndex].correctAnswer}
                    </p>
                    <p className="text-sm text-gray-400 mt-3">{article.quiz[activeQuizIndex].explanation}</p>
                  </div>
                );
              })()}

              <div className="flex flex-wrap gap-3 mt-4">
                <button
                  type="button"
                  disabled={activeQuizIndex === 0}
                  onClick={() => {
                    setActiveQuizIndex((prev) => Math.max(0, prev - 1));
                    setShowQuizAnswer(false);
                  }}
                  className="px-4 py-2 rounded-full border border-white/10 text-xs uppercase font-bold tracking-[0.2em] text-gray-300 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const nextIndex = activeQuizIndex === article.quiz.length - 1 ? 0 : activeQuizIndex + 1;
                    setActiveQuizIndex(nextIndex);
                    setShowQuizAnswer(false);
                  }}
                  className="px-4 py-2 rounded-full border border-brand-primary text-xs uppercase font-bold tracking-[0.2em] text-brand-primary bg-brand-primary/5 hover:bg-brand-primary/10"
                >
                  {activeQuizIndex === article.quiz.length - 1 ? 'Restart Quiz' : 'Next Question'}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsAiOpen(true)}
          className="w-14 h-14 rounded-full bg-brand-primary text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all glow-active cursor-pointer"
          title="Open AI Panel"
        >
          <Sparkles className="w-6 h-6 fill-current text-white" />
        </button>
      </div>

      <AIDrawer isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} articleId={article._id} />
    </div>
  );
}
