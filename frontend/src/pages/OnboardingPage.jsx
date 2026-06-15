import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, CheckCircle, Sparkles, BookOpen, Brain, Clock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppStore } from '../store/appStore';

export default function OnboardingPage() {
  const { status, user, update } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const { setExamPreference } = useAppStore();

  const [exam, setExam] = useState('UPSC');
  const [level, setLevel] = useState('Beginner');
  const [goal, setGoal] = useState(15);

  useEffect(() => {
    if (status === 'unauthenticated') {
      navigate('/login');
    }
  }, [status, navigate]);

  if (status !== 'authenticated') return null;

  const handleNext = () => setStep((prev) => Math.min(3, prev + 1));
  const handleBack = () => setStep((prev) => Math.max(1, prev - 1));

  const handleComplete = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/user/onboard', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examPreference: exam,
          prepLevel: level,
          dailyGoal: Number(goal),
        }),
      });

      if (res.ok) {
        setExamPreference(exam);
        await update(); // refresh auth session context
        navigate('/dashboard');
      } else {
        console.error('Failed to submit onboarding details');
      }
    } catch (err) {
      console.error('Error during onboarding submission:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    {
      title: "Target Examination",
      subtitle: "Select your active syllabus focus to curate and score relevant articles.",
      content: (
        <div className="space-y-4">
          {[
            { id: 'UPSC', title: 'UPSC Civil Services', desc: 'Detailed coverage of Indian Polity, Economy, History, and current policy reviews.', color: 'border-brand-primary/30 text-brand-primary' },
            { id: 'BANKING', title: 'Banking (RBI Grade B / SBI)', desc: 'Heavy emphasis on banking regulations, monetary policy, and macro economy briefs.', color: 'border-brand-success/30 text-brand-success' },
            { id: 'SSC', title: 'SSC CGL & Govt Exams', desc: 'Focus on national achievements, general awareness, appointments, and quick briefs.', color: 'border-brand-warning/30 text-brand-warning' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setExam(item.id)}
              className={`w-full p-5 text-left rounded-2xl border transition-all duration-300 ${
                exam === item.id 
                  ? 'border-brand-primary bg-surface-elevated/80 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                  : 'border-white/5 bg-surface-card hover:bg-surface-elevated hover:border-white/10'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-lg text-white font-display">{item.title}</span>
                {exam === item.id ? (
                  <CheckCircle className="w-5 h-5 text-brand-primary fill-brand-primary/10" />
                ) : (
                  <div className="w-5 h-5 rounded-full border border-white/20" />
                )}
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
            </button>
          ))}
        </div>
      )
    },
    {
      title: "Preparation Level",
      subtitle: "Helps the AI system fine-tune the complexity of generated summaries and MCQs.",
      content: (
        <div className="space-y-4">
          {[
            { id: 'Beginner', title: 'Beginner', desc: 'Just starting out. AI explanations will be simple and focus on core concepts.' },
            { id: 'Intermediate', title: 'Intermediate', desc: 'Comfortable with basics. Summaries assume some prior syllabus knowledge.' },
            { id: 'Advanced', title: 'Advanced', desc: 'Deep revision mode. Content will include critical linkages and analytical briefs.' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setLevel(item.id)}
              className={`w-full p-5 text-left rounded-2xl border transition-all duration-300 ${
                level === item.id 
                  ? 'border-brand-primary bg-surface-elevated/80 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                  : 'border-white/5 bg-surface-card hover:bg-surface-elevated hover:border-white/10'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-lg text-white font-display">{item.title}</span>
                {level === item.id ? (
                  <CheckCircle className="w-5 h-5 text-brand-primary" />
                ) : (
                  <div className="w-5 h-5 rounded-full border border-white/20" />
                )}
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
            </button>
          ))}
        </div>
      )
    },
    {
      title: "Daily Study Goal",
      subtitle: "Setting realistic goals builds consistency streaks. Start small, finish big.",
      content: (
        <div className="space-y-6">
          <div className="flex justify-between gap-4">
            {[15, 30, 60].map((mins) => (
              <button
                key={mins}
                onClick={() => setGoal(mins)}
                className={`flex-1 py-6 px-4 rounded-2xl border text-center transition-all duration-300 ${
                  goal === mins 
                    ? 'border-brand-primary bg-surface-elevated/80 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                    : 'border-white/5 bg-surface-card hover:bg-surface-elevated hover:border-white/10'
                }`}
              >
                <Clock className={`w-8 h-8 mx-auto mb-3 transition-colors ${goal === mins ? 'text-brand-primary' : 'text-gray-400'}`} />
                <span className="block font-extrabold text-2xl text-white font-display">{mins}</span>
                <span className="text-xs text-gray-400 font-medium">Minutes / Day</span>
              </button>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-surface-secondary border border-white/5 flex gap-3 text-xs text-gray-400 items-start">
            <ShieldCheck className="w-5 h-5 text-brand-success shrink-0" />
            <div>
              <span className="font-bold text-gray-200 block mb-1">Consistency Streak Shield</span>
              Completing just one summary or quiz attempt per day keeps your daily streak active and locks in XP multipliers.
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="relative min-h-screen bg-bg-primary text-gray-100 flex items-center justify-center p-4">
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-brand-primary/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-brand-secondary/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-xl flex flex-col gap-6 z-10">
        <div className="flex justify-between items-center px-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-brand-primary/10 text-brand-primary">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-xs uppercase tracking-widest text-brand-primary font-bold">Personalized Onboarding</span>
          </div>
          <span className="text-xs text-gray-400 font-bold">Step {step} of 3</span>
        </div>

        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-brand-primary" 
            animate={{ width: `${(step / 3) * 100}%` }} 
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="p-6 md:p-8 rounded-3xl glass-panel neo-card flex flex-col min-h-[460px] justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-white font-display mb-1">
              {steps[step - 1].title}
            </h2>
            <p className="text-xs text-gray-400 leading-relaxed mb-6">
              {steps[step - 1].subtitle}
            </p>

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
              >
                {steps[step - 1].content}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex justify-between gap-4 mt-8 pt-6 border-t border-white/5">
            {step > 1 ? (
              <button
                onClick={handleBack}
                disabled={submitting}
                className="px-5 py-3 rounded-xl border border-white/10 text-gray-300 flex items-center gap-2 font-bold hover:bg-white/5 transition-all neo-btn cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                onClick={handleNext}
                className="px-6 py-3 rounded-xl bg-brand-primary text-white flex items-center gap-2 font-bold transition-all hover:scale-[1.01] active:scale-[0.99] neo-btn-accent shadow-[0_0_15px_rgba(99,102,241,0.25)] cursor-pointer"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={submitting}
                className="px-6 py-3 rounded-xl bg-brand-success text-white flex items-center gap-2 font-bold transition-all hover:scale-[1.01] active:scale-[0.99] neo-btn-accent shadow-[0_0_15px_rgba(34,197,94,0.25)] cursor-pointer"
              >
                {submitting ? 'Setting Profile...' : 'Complete Account'} <CheckCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
