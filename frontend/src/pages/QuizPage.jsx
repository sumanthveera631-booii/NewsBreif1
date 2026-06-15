import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Sparkles, Award, CheckCircle, XCircle, Flame, ArrowRight, BookOpen, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAppStore } from '../store/appStore';
import { useAuth } from '../context/AuthContext';

export default function QuizPage() {
  const { status, user, update } = useAuth();
  const navigate = useNavigate();
  const { examPreference, setExamPreference, setUserProfile } = useAppStore();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState(null); // The user's chosen option
  const [evaluated, setEvaluated] = useState(false); // Has the user clicked Evaluate?
  const [correctCount, setCorrectCount] = useState(0);

  const [startTime, setStartTime] = useState(null);
  const [quizFinished, setQuizFinished] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [rewardsEarned, setRewardsEarned] = useState(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      navigate('/login');
    }
  }, [status, navigate]);

  const loadQuiz = () => {
    if (status !== 'authenticated') return;
    const targetExam = examPreference || 'UPSC';
    setLoading(true);
    setError(null);
    setQuizFinished(false);
    setSelectedIdx(null);
    setEvaluated(false);
    setCorrectCount(0);
    setCurrentIdx(0);
    setRewardsEarned(null);

    fetch(`/api/quiz/questions?exam=${targetExam}`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load questions');
        return res.json();
      })
      .then((data) => {
        if (data.questions && data.questions.length > 0) {
          // Validate each question has all required fields before using
          const validQuestions = data.questions.filter(
            q => q.question && Array.isArray(q.options) && q.options.length >= 2 
              && typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 
              && q.explanation
          );
          if (validQuestions.length > 0) {
            setQuestions(validQuestions);
            setStartTime(Date.now());
          } else {
            setQuestions([]);
          }
        } else {
          setQuestions([]);
        }
      })
      .catch((err) => {
        setError('Could not compile quiz. Check your connection. Retry');
        console.error('Quiz fetch error:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadQuiz();
  }, [status, examPreference]);

  const triggerAudioTone = (isSuccess) => {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (isSuccess) {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.38);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(110, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (e) {
      console.warn('Synth trigger failed:', e);
    }
  };

  const handleSelectOption = (idx) => {
    if (evaluated) return;
    setSelectedIdx(idx);
  };

  const handleEvaluate = () => {
    if (selectedIdx === null || evaluated) return;
    setEvaluated(true);
    const correct = selectedIdx === questions[currentIdx].correctAnswer;
    
    triggerAudioTone(correct);

    if (correct) {
      setCorrectCount((prev) => prev + 1);
      confetti({
        particleCount: 70,
        spread: 50,
        origin: { y: 0.75 }
      });
    }
  };

  const handleNext = () => {
    setSelectedIdx(null);
    setEvaluated(false);
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const handleClaimRewards = async () => {
    setClaiming(true);
    const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);
    try {
      const res = await fetch('/api/quiz/attempt', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: correctCount,
          totalQuestions: questions.length,
          completionTime: elapsedSeconds,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRewardsEarned({
          xp: data.xpAwarded,
          streak: data.streak,
          newBadges: data.newBadges || []
        });
        await update(); // trigger auth context refresh
      }
    } catch (err) {
      console.error('Failed to log quiz attempt:', err);
    } finally {
      setClaiming(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-brand-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-3">Compiling Daily Quiz...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto px-4 lg:px-0 py-6 flex-1 flex flex-col justify-center">
      {error ? (
        <div className="p-8 rounded-2xl bg-surface-card border border-brand-danger/10 text-center neo-card flex flex-col items-center gap-3">
          <AlertCircle className="w-8 h-8 text-brand-danger" />
          <p className="text-sm font-semibold text-gray-300">{error}</p>
          <button
            onClick={loadQuiz}
            className="mt-2 px-4 py-2 text-xs font-bold rounded-lg border border-brand-danger/25 text-brand-danger hover:bg-brand-danger/5 transition-all cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : questions.length === 0 ? (
        <div className="p-10 rounded-2xl bg-surface-card border border-white/5 text-center neo-card flex flex-col items-center justify-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-surface-secondary flex items-center justify-center text-gray-500 border border-white/5">
            <Brain className="w-7 h-7 text-brand-primary" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-gray-300 font-display">No Quiz Today</h4>
            <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1.5 leading-relaxed">
              There are no current affairs MCQs logged for {examPreference} in the last 7 days. Try reading articles or switching exam mode preferences first!
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 rounded-xl bg-brand-primary text-xs font-bold text-white transition-all neo-btn-accent shadow cursor-pointer"
          >
            Go to Briefings
          </button>
        </div>
      ) : !quizFinished ? (
        !questions[currentIdx] ? (
          <div className="p-8 rounded-2xl bg-surface-card border border-brand-danger/10 text-center neo-card flex flex-col items-center gap-3">
            <AlertCircle className="w-8 h-8 text-brand-danger" />
            <p className="text-sm font-semibold text-gray-300">Could not compile quiz. Check your connection. Retry</p>
            <button
              onClick={loadQuiz}
              className="mt-2 px-4 py-2 text-xs font-bold rounded-lg border border-brand-danger/25 text-brand-danger hover:bg-brand-danger/5 transition-all cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-success transition-all duration-300"
                  style={{ width: `${((currentIdx) / questions.length) * 100}%` }}
                />
              </div>
              <span className="text-xs font-bold text-gray-400 font-mono shrink-0">
                {currentIdx + 1} / {questions.length}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-warning flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-current" /> Streak Shield Engaged
              </span>
              <span className="text-[10px] font-bold text-gray-400">XP Reward Level: Medium</span>
            </div>

          <div className="p-6 rounded-3xl bg-surface-card border border-white/5 neo-card text-left">
            <span className="text-[9px] uppercase tracking-wider text-brand-primary font-extrabold block mb-2">
              Context: {questions[currentIdx].articleTitle}
            </span>
            <h3 className="text-base font-extrabold text-gray-100 leading-snug mb-5 font-display select-text">
              {questions[currentIdx].question}
            </h3>

            <div className="space-y-2.5">
              {questions[currentIdx].options.map((option, idx) => {
                const isSelected = selectedIdx === idx;
                const isCorrect = idx === questions[currentIdx].correctAnswer;
                
                let optionClass = 'border-white/5 bg-surface-secondary text-gray-300 hover:bg-surface-elevated';
                
                if (evaluated) {
                  if (isCorrect) {
                    optionClass = 'border-brand-success bg-brand-success/15 text-brand-success shadow-[0_0_15px_rgba(34,197,94,0.1)]';
                  } else if (isSelected) {
                    optionClass = 'border-brand-danger bg-brand-danger/15 text-brand-danger shadow-[0_0_15px_rgba(239,68,68,0.1)]';
                  } else {
                    optionClass = 'border-white/5 bg-surface-secondary/40 text-gray-600';
                  }
                } else if (isSelected) {
                  optionClass = 'border-brand-primary bg-brand-primary/10 text-brand-primary border-brand-primary/50';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    disabled={evaluated}
                    className={`w-full p-4 rounded-xl text-left border transition-all text-xs font-semibold flex items-center justify-between cursor-pointer active:scale-[0.99] ${optionClass}`}
                  >
                    <span>{option}</span>
                    {evaluated && isCorrect && <CheckCircle className="w-4 h-4 text-brand-success shrink-0 ml-2" />}
                    {evaluated && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-brand-danger shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>

            <AnimatePresence>
              {evaluated && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-5 pt-4 border-t border-white/5 overflow-hidden"
                >
                  <div className="flex items-center gap-1 text-[10px] font-bold text-brand-primary uppercase tracking-wider mb-2">
                    <BookOpen className="w-3.5 h-3.5" /> Explanation Brief
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed select-text">
                    {questions[currentIdx].explanation}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex justify-end gap-3">
            {!evaluated ? (
              <button
                onClick={handleEvaluate}
                disabled={selectedIdx === null}
                className={`px-6 py-3.5 rounded-xl font-bold text-xs uppercase flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(99,102,241,0.25)] cursor-pointer hover:scale-[1.01] active:scale-[0.99] ${
                  selectedIdx !== null ? 'bg-brand-primary text-white neo-btn-accent' : 'bg-surface-elevated text-gray-500 border border-white/10 cursor-not-allowed opacity-50'
                }`}
              >
                Evaluate Answer
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-6 py-3.5 rounded-xl bg-brand-primary text-white font-bold text-xs uppercase flex items-center gap-2 transition-all neo-btn-accent shadow-[0_0_15px_rgba(99,102,241,0.25)] cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
              >
                {currentIdx === questions.length - 1 ? 'Finish Quiz' : 'Next Question'} <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        )
      ) : (
        <div className="p-8 rounded-3xl bg-surface-card border border-white/5 text-center neo-card flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary border border-brand-primary/10">
            <Award className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-white font-display">Daily Briefing Mastered!</h2>
            <p className="text-xs text-gray-500 mt-1">Excellent job on active recall. You are locking in the facts.</p>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="p-4 rounded-2xl bg-surface-secondary border border-white/5">
              <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider block">Score Result</span>
              <span className="text-xl font-black text-gray-200 mt-1 block font-mono">
                {correctCount} / {questions.length}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-surface-secondary border border-white/5">
              <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider block">Accuracy Rate</span>
              <span className="text-xl font-black text-brand-success mt-1 block font-mono">
                {Math.round((correctCount / questions.length) * 100)}%
              </span>
            </div>
          </div>

          {rewardsEarned ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full p-4 rounded-2xl bg-brand-primary/5 border border-brand-primary/20 text-left space-y-3"
            >
              <h4 className="text-xs font-extrabold uppercase text-brand-primary tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 fill-brand-primary/10" /> Rewards Awarded
              </h4>
              <div className="flex justify-between items-center text-xs text-gray-300">
                <span>XP Gained:</span>
                <span className="font-bold font-mono text-brand-secondary">+{rewardsEarned.xp} XP</span>
              </div>
              <div className="flex justify-between items-center text-xs text-gray-300">
                <span>Current Study Streak:</span>
                <span className="font-bold font-mono text-brand-warning flex items-center gap-1">
                  <Flame className="w-4 h-4 fill-current text-brand-warning" /> {rewardsEarned.streak} Days
                </span>
              </div>
              {rewardsEarned.newBadges.length > 0 && (
                <div className="pt-2 border-t border-white/5">
                  <span className="text-[10px] font-bold text-gray-400 block mb-1">Badges Unlocked:</span>
                  <div className="flex gap-1.5 flex-wrap mt-1">
                    {rewardsEarned.newBadges.map((badge, bIdx) => (
                      <span key={bIdx} className="px-2 py-0.5 rounded bg-brand-secondary/15 border border-brand-secondary/20 text-[9px] font-bold text-brand-secondary">
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full mt-2 py-3 bg-brand-primary text-white text-xs font-bold uppercase rounded-xl transition-all cursor-pointer text-center flex items-center justify-center"
              >
                Return to Dashboard
              </button>
            </motion.div>
          ) : (
            <button
              onClick={handleClaimRewards}
              disabled={claiming}
              className="w-full py-4 bg-brand-success text-white font-bold rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.99] neo-btn-accent shadow-[0_0_15px_rgba(34,197,94,0.3)] cursor-pointer"
            >
              {claiming ? 'Updating Database...' : 'Claim Study Rewards'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
