import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, BookOpen, Brain, Award, Flame, Play, ArrowRight, Check, Zap } from 'lucide-react';
import WatchDemoModal from '../components/WatchDemoModal';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { status } = useAuth();
  const navigate = useNavigate();
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  const handleStartLearning = () => {
    if (status === 'authenticated') {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const handleExploreFeatures = () => {
    const el = document.getElementById('features-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen bg-bg-primary text-gray-100 flex flex-col justify-between selection:bg-brand-primary/30">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[600px] h-[600px] bg-brand-secondary/10 rounded-full blur-[150px] pointer-events-none" />

      <header className="sticky top-0 z-40 w-full px-6 py-4 glass-panel border-b border-white/5 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center shadow-lg">
            <span className="font-bold text-xl text-white font-display">N</span>
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-gray-100 to-gray-300 bg-clip-text text-transparent font-display">
            News<span className="text-brand-primary">Brief</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={handleExploreFeatures}
            className="hidden sm:inline-block text-sm font-semibold text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            Features
          </button>
          {status === 'authenticated' ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="px-5 py-2 text-sm font-bold rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white transition-all neo-btn-accent shadow-[0_0_15px_rgba(99,102,241,0.3)] cursor-pointer"
            >
              Go to Dashboard
            </button>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="px-5 py-2 text-sm font-bold rounded-xl border border-white/10 hover:bg-white/5 text-gray-200 transition-all neo-btn cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12 md:py-20 max-w-5xl mx-auto z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-semibold uppercase tracking-wider mb-6"
        >
          <Sparkles className="w-3.5 h-3.5" /> Powered by Gemini 2.5 Flash Lite
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="text-4xl sm:text-6xl md:text-7xl font-extrabold font-display leading-[1.1] mb-6 text-white"
        >
          Master Current Affairs<br />
          <span className="bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-info bg-clip-text text-transparent">
            In 15 Seconds Flat.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-lg md:text-xl text-gray-400 max-w-2xl leading-relaxed mb-10"
        >
          The ultimate AI-powered, gamified learning companion for UPSC, Banking, and SSC exams. Multi-mode summaries, interactive active recall quizzes, and automated revision loops.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-md mb-16"
        >
          <button
            onClick={handleStartLearning}
            className="w-full sm:w-auto px-8 py-4 text-base font-bold rounded-2xl bg-brand-primary text-white flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all neo-btn-accent shadow-[0_0_25px_rgba(99,102,241,0.35)] cursor-pointer"
          >
            START LEARNING <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsDemoOpen(true)}
            className="w-full sm:w-auto px-8 py-4 text-base font-bold rounded-2xl border border-white/10 hover:bg-white/5 text-gray-200 flex items-center justify-center gap-2 transition-all neo-btn cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current text-brand-secondary" /> WATCH DEMO
          </button>
        </motion.div>

        <section id="features-section" className="w-full pt-16 border-t border-white/5 scroll-mt-24">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-4xl font-extrabold font-display mb-3 text-white">Engineered For Top Aspirants</h2>
            <p className="text-gray-400 text-sm sm:text-base max-w-md mx-auto">Everything you need to digest daily briefs, pass validation quizzes, and master long-term retention.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div whileHover={{ y: -6 }} className="p-6 rounded-2xl bg-surface-card border border-white/5 text-left neo-card flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary mb-4">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-200 mb-2 font-display">15-Sec Summaries</h3>
                <p className="text-sm text-gray-400 leading-relaxed">Toggle dynamically between bulleted points, 100-word summaries, or deep dives depending on your focus and time available.</p>
              </div>
              <div className="mt-4 text-xs font-semibold text-brand-primary flex items-center gap-1">Kindle focus-mode reader <Zap className="w-3.5 h-3.5" /></div>
            </motion.div>

            <motion.div whileHover={{ y: -6 }} className="p-6 rounded-2xl bg-surface-card border border-white/5 text-left neo-card flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-brand-secondary/10 flex items-center justify-center text-brand-secondary mb-4">
                  <Brain className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-200 mb-2 font-display">Gamified Active Recall</h3>
                <p className="text-sm text-gray-400 leading-relaxed">Duolingo-style flashcard quizzes generated instantly from news. Earn XP, maintain daily streaks, and learn with interactive explanations.</p>
              </div>
              <div className="mt-4 text-xs font-semibold text-brand-secondary flex items-center gap-1">Audio cues & confetti validation <Flame className="w-3.5 h-3.5" /></div>
            </motion.div>

            <motion.div whileHover={{ y: -6 }} className="p-6 rounded-2xl bg-surface-card border border-white/5 text-left neo-card flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-brand-info/10 flex items-center justify-center text-brand-info mb-4">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-200 mb-2 font-display">Intelligent Revision</h3>
                <p className="text-sm text-gray-400 leading-relaxed">Automatically schedules articles for daily, weekly, and monthly recall reviews. Build streaks and unlock exam-ready badges.</p>
              </div>
              <div className="mt-4 text-xs font-semibold text-brand-info flex items-center gap-1">Systematic Spaced Repetition <Check className="w-3.5 h-3.5" /></div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="w-full py-8 px-6 text-center text-xs text-gray-500 border-t border-white/5 bg-surface-secondary/40">
        <p>© 2026 NewsBrief Inc. All rights reserved. Designed for elite academic focus.</p>
      </footer>

      <WatchDemoModal isOpen={isDemoOpen} onClose={() => setIsDemoOpen(false)} />
    </div>
  );
}
