import { X, Play, Target } from 'lucide-react';

export default function WatchDemoModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div 
        className="absolute inset-0 bg-bg-primary/90 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-lg neo-card-elevated p-6 animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-primary/10 flex items-center justify-center border border-brand-primary/20">
              <Play className="w-4 h-4 text-brand-primary fill-brand-primary ml-0.5" />
            </div>
            <h3 className="font-extrabold text-lg text-gray-100">How to use NewsBrief</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-surface-elevated border border-white/5 hover:bg-white/10 transition-colors text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Placeholder */}
        <div className="w-full aspect-video rounded-xl bg-surface-elevated border border-white/10 mb-6 flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer">
          {/* Subtle gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-brand-secondary/5" />
          
          <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-md group-hover:scale-110 transition-transform duration-300 shadow-xl">
            <Play className="w-6 h-6 text-white fill-white ml-1" />
          </div>
          <span className="mt-4 font-bold text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
            Watch 2-min Walkthrough
          </span>
        </div>

        {/* Key Features List */}
        <div className="space-y-4 mb-8">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-lg bg-surface-elevated flex items-center justify-center mt-0.5 shrink-0 border border-white/5">
              <span className="text-xs font-bold text-gray-300">1</span>
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-200">Set Your Goal</h4>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                Choose between 15m, 30m, or 60m daily reading targets.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-lg bg-surface-elevated flex items-center justify-center mt-0.5 shrink-0 border border-white/5">
              <span className="text-xs font-bold text-gray-300">2</span>
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-200">Daily Briefings</h4>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                Read highly compressed, exam-focused news summaries.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-lg bg-surface-elevated flex items-center justify-center mt-0.5 shrink-0 border border-white/5">
              <span className="text-xs font-bold text-gray-300">3</span>
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-200">Test & Revise</h4>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                Take MCQs and use AI-generated flashcards for spaced repetition.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button 
          onClick={onClose}
          className="w-full py-3.5 rounded-xl neo-btn-accent font-extrabold text-sm text-white tracking-wide"
        >
          Got it, let's start
        </button>

      </div>
    </div>
  );
}
