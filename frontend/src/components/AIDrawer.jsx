import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, X, Brain, HelpCircle, BookOpen, FileText, Languages, RefreshCcw, Smile } from 'lucide-react';

export default function AIDrawer({ isOpen, onClose, articleId }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [selectedAction, setSelectedAction] = useState(null);

  const prompts = [
    { id: 'explain_simply', label: 'Explain Simply', icon: Smile, color: 'text-brand-success bg-brand-success/10' },
    { id: 'explain_teacher', label: 'Explain like Teacher', icon: BookOpen, color: 'text-brand-primary bg-brand-primary/10' },
    { id: 'generate_mcqs', label: 'Generate MCQs', icon: HelpCircle, color: 'text-brand-warning bg-brand-warning/10' },
    { id: 'create_flashcards', label: 'Create Flashcards', icon: Brain, color: 'text-brand-secondary bg-brand-secondary/10' },
    { id: 'create_revision_notes', label: 'Create Revision Notes', icon: FileText, color: 'text-brand-info bg-brand-info/10' },
    { id: 'translate', label: 'Translate (Hindi/Telugu)', icon: Languages, color: 'text-purple-400 bg-purple-400/10' },
    { id: 'memory_tricks', label: 'Memory Tricks', icon: Sparkles, color: 'text-pink-400 bg-pink-400/10' }
  ];

  const handleQuery = async (actionId) => {
    setLoading(true);
    setSelectedAction(actionId);
    setResult('');
    try {
      const res = await fetch('/api/ai/explain', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId, action: actionId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResult(data.explanation);
      } else {
        setResult(data.error || 'Failed to generate explanation. Try again.');
      }
    } catch (err) {
      setResult('Connection error. Failed to connect to AI server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end pointer-events-none">
      <div onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-xs pointer-events-auto" />

      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="relative w-full md:w-[450px] h-full bg-surface-card border-l border-white/10 flex flex-col justify-between shadow-2xl pointer-events-auto z-10 glass-panel-elevated"
      >
        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-surface-secondary">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-primary animate-pulse" />
            <h3 className="font-extrabold text-gray-100 font-display">Gemini 2.5 Flash Assistant</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar">
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block mb-1">AI Prompt Actions</span>
            <div className="grid grid-cols-2 gap-2">
              {prompts.map((p) => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleQuery(p.id)}
                    disabled={loading}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all text-xs font-semibold cursor-pointer ${
                      selectedAction === p.id && result
                        ? 'border-brand-primary bg-brand-primary/5 text-gray-100'
                        : 'border-white/5 bg-surface-secondary/50 hover:bg-surface-elevated hover:border-white/10 text-gray-300'
                    }`}
                  >
                    <span className={`p-1.5 rounded-lg shrink-0 ${p.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <span className="leading-tight mt-0.5">{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 min-h-[300px]">
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block mb-3">AI Response Output</span>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-7 h-7 border-3 border-brand-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider animate-pulse">Running model...</span>
              </div>
            ) : result ? (
              <div className="prose prose-invert max-w-none text-xs text-gray-300 leading-relaxed font-medium space-y-3 whitespace-pre-wrap select-text">
                {result}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
                <Brain className="w-10 h-10 text-gray-600" />
                <p className="text-xs text-gray-500 max-w-xs leading-normal">
                  Select a prompt category above. Gemini will analyze the article content and format a specialized study report instantly.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-surface-secondary border-t border-white/5 flex items-center justify-between">
          <span className="text-[9px] text-gray-500 uppercase font-semibold">Ready to test? Go to the Quiz section.</span>
          {result && (
            <button
              onClick={() => handleQuery(selectedAction)}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg border border-white/5 bg-surface-card hover:bg-surface-elevated text-[10px] font-extrabold uppercase text-gray-400 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
            >
              <RefreshCcw className="w-3 h-3" /> Regenerate
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
