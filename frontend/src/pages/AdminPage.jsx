import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Database, Cpu, Activity, RefreshCw, Terminal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminPage() {
  const { status, user } = useAuth();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [pipelineLoading, setPipelineLoading] = useState(false);
  const [pipelineLog, setPipelineLog] = useState('');

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (status === 'unauthenticated') {
      navigate('/login');
    }
  }, [status, navigate]);

  const fetchMetrics = () => {
    if (status !== 'authenticated') return;
    setLoading(true);
    setError(null);

    fetch('/api/admin/metrics', { credentials: 'include' })
      .then((res) => {
        if (res.status === 403) {
          throw new Error('Forbidden. You do not have permission to access the admin panel.');
        }
        if (!res.ok) throw new Error('Failed to load metrics');
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          setMetrics(data.metrics);
        }
      })
      .catch((err) => {
        setError(err.message || 'Error collecting statistics');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMetrics();
  }, [status]);

  const handleRunPipeline = async () => {
    setPipelineLoading(true);
    setPipelineLog('Initializing daily current affairs RSS feed pipeline...\nFetching XML endpoints...\n');
    try {
      const res = await fetch('/api/admin/scrape-now', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPipelineLog((prev) => prev + `Pipeline command accepted. ${data.message}\n`);
        fetchMetrics();
      } else {
        setPipelineLog((prev) => prev + `Pipeline execution failed: ${data.error || 'Unknown error'}\n`);
      }
    } catch (err) {
      setPipelineLog((prev) => prev + `Connection failure triggering pipeline: ${err.message}\n`);
    } finally {
      setPipelineLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-brand-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-3">Loading System Metrics...</span>
      </div>
    );
  }

  if (!isAdmin && user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-[50vh]">
        <div className="max-w-md w-full p-8 rounded-3xl bg-surface-card border border-brand-danger/25 text-center neo-card flex flex-col items-center gap-4">
          <ShieldAlert className="w-12 h-12 text-brand-danger" />
          <h3 className="text-xl font-bold">Access Forbidden</h3>
          <p className="text-sm text-gray-400">
            This route is protected. Only the registered administrator can access the administrative parameters.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 rounded-xl bg-surface-secondary text-xs font-bold border border-white/5 hover:bg-surface-elevated text-gray-200 transition-all cursor-pointer"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col pb-20 select-text">
      
      <header className="px-6 py-4 glass-panel border-b border-white/5 flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-brand-danger flex items-center justify-center shadow">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-base tracking-tight">
            Admin<span className="text-brand-danger">Panel</span>
          </span>
        </div>
        <button
          onClick={fetchMetrics}
          className="p-2 rounded-xl border border-white/5 hover:bg-white/5 text-gray-400 active:scale-95 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </header>

      <main className="w-full max-w-4xl mx-auto px-6 py-8 space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-brand-danger/10 border border-brand-danger/20 text-xs text-brand-danger flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Users', val: metrics?.totalUsers || 0, icon: Database, color: 'text-brand-primary' },
            { label: 'Total Articles', val: metrics?.totalArticles || 0, icon: Cpu, color: 'text-brand-success' },
            { label: 'Quiz Attempts', val: metrics?.totalAttempts || 0, icon: Terminal, color: 'text-brand-warning' },
            { label: 'MongoDB Health', val: metrics?.mongoState || 'N/A', icon: Activity, color: 'text-brand-info' }
          ].map((card, idx) => {
            const Icon = card.icon;
            return (
              <div key={idx} className="p-5 rounded-2xl bg-surface-card border border-white/5 neo-card text-left">
                <span className="text-[9px] uppercase font-bold tracking-wider text-gray-500 block mb-1">{card.label}</span>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xl font-black text-gray-200 font-mono leading-none">{card.val}</span>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
              </div>
            );
          })}
        </section>

        <section className="p-5 rounded-2xl bg-surface-card border border-white/5 neo-card flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-bold tracking-wider text-gray-500 block">Gemini API Consumption (Estimated)</span>
            <div className="text-xs text-gray-300">
              Tokens consumed: <span className="font-bold font-mono text-brand-primary">{metrics?.geminiTokens || 0} tokens</span>
            </div>
          </div>
          <div className="px-4 py-2 bg-brand-success/10 border border-brand-success/20 rounded-xl flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
            <span className="text-xs font-bold text-brand-success">Est. Cost:</span>
            <span className="text-sm font-black text-brand-success font-mono">${metrics?.geminiCost || 0} USD</span>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="p-6 rounded-2xl bg-surface-card border border-white/5 neo-card space-y-4">
            <h4 className="text-sm font-extrabold text-white font-display border-b border-white/5 pb-2">Feed Ingest & AI Pipeline</h4>
            <p className="text-xs text-gray-400 leading-normal">
              Trigger feed generation parsing, deduplication, Gemini article parsing, MCQ creation, and Resend digests.
            </p>
            <button
              onClick={handleRunPipeline}
              disabled={pipelineLoading}
              className="w-full py-3 bg-brand-primary text-white text-xs font-extrabold uppercase rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] neo-btn-accent shadow-[0_0_15px_rgba(99,102,241,0.25)] cursor-pointer"
            >
              {pipelineLoading ? 'Running Pipeline...' : 'Run Daily Ingest Pipeline'}
            </button>

            {pipelineLog && (
              <div className="p-3 bg-black/60 rounded-xl border border-white/10 text-[10px] font-mono text-brand-success overflow-x-auto leading-relaxed max-h-[150px] overflow-y-auto whitespace-pre-wrap">
                {pipelineLog}
              </div>
            )}
          </section>

          <section className="p-6 rounded-2xl bg-surface-card border border-white/5 neo-card space-y-4 flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-extrabold text-white font-display border-b border-white/5 pb-2">Failed Article Logs</h4>
              <div className="space-y-3 mt-4">
                {!metrics?.failedArticles || metrics?.failedArticles?.length === 0 ? (
                  <div className="text-center py-6 text-[10px] text-gray-500">No failed feeds logged. System running smooth.</div>
                ) : (
                  metrics?.failedArticles?.map((fail) => (
                    <div key={fail.id} className="p-3 bg-surface-secondary/40 rounded-xl border border-brand-danger/10 flex items-start gap-2.5">
                      <ShieldAlert className="w-4 h-4 text-brand-danger shrink-0 mt-0.5" />
                      <div className="text-[10px]">
                        <span className="font-extrabold text-gray-300 block">{fail.source}</span>
                        <p className="text-gray-500 mt-0.5 leading-normal">{fail.reason}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="text-[9px] text-gray-500 uppercase font-semibold text-right pt-2 border-t border-white/5">
              Logs refresh automatically on run
            </div>
          </section>
        </div>

        <div className="flex justify-center pt-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-bold text-gray-300 cursor-pointer"
          >
            Back to User Dashboard
          </button>
        </div>
      </main>
    </div>
  );
}
