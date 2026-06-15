import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, Filter, RotateCcw, ChevronLeft, ChevronRight, AlertCircle, Newspaper } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useAuth } from '../context/AuthContext';
import NewsCard from '../components/NewsCard';

export default function SearchPage() {
  const { status } = useAuth();
  const navigate = useNavigate();
  const { examPreference } = useAppStore();

  const [keyword, setKeyword] = useState('');
  const [selectedExam, setSelectedExam] = useState(examPreference);
  const [dateFilter, setDateFilter] = useState('all'); 
  const [selectedSource, setSelectedSource] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [page, setPage] = useState(1);

  const [articles, setArticles] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      navigate('/login');
    }
  }, [status, navigate]);

  useEffect(() => {
    if (examPreference) {
      setSelectedExam(examPreference);
    }
  }, [examPreference]);

  const fetchSearchResults = () => {
    if (status !== 'authenticated') return;

    setLoading(true);
    setError(null);

    const queryParams = new URLSearchParams({
      exam: selectedExam || 'UPSC',
      date: dateFilter,
      search: keyword,
      source: selectedSource,
      topic: selectedTopic,
      page: page.toString(),
      limit: '6' 
    });

    fetch(`/api/articles?${queryParams.toString()}`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Search failed');
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          setArticles(data.articles || []);
          setPagination(data.pagination || { total: 0, page: 1, limit: 6, pages: 1 });
        }
      })
      .catch((err) => {
        setError('Connection error. Could not query search index.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSearchResults();
  }, [status, selectedExam, dateFilter, selectedSource, selectedTopic, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchSearchResults();
  };

  const handleResetFilters = () => {
    setKeyword('');
    setSelectedExam(examPreference);
    setDateFilter('all');
    setSelectedSource('');
    setSelectedTopic('');
    setPage(1);
  };

  if (status === 'loading') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-brand-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-3">Syncing Search Engine...</span>
      </div>
    );
  }

  const sourcesList = ['PIB', 'RBI', 'PRS', 'The Hindu', 'Indian Express', 'Economic Times', 'Gov Releases'];
  const topicsList = ['Polity', 'Economy', 'Science', 'Environment', 'Defense', 'International Relations', 'Social Issues'];

  return (
    <div className="w-full max-w-xl mx-auto px-4 lg:px-0 py-6 flex-1 flex flex-col gap-6">
      
      <section aria-label="Search inputs">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
              <SearchIcon className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search keywords, headlines, notes..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-surface-card border border-white/5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-brand-primary/40 focus:ring-1 focus:ring-brand-primary/40 transition-all shadow-inner neo-card"
            />
          </div>
          
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`p-3.5 rounded-2xl border transition-all flex items-center justify-center cursor-pointer ${
              showFilters || selectedSource || selectedTopic || dateFilter !== 'all'
                ? 'border-brand-primary text-brand-primary bg-brand-primary/5 shadow'
                : 'border-white/5 bg-surface-card hover:bg-surface-elevated text-gray-400'
            }`}
          >
            <Filter className="w-5 h-5" />
          </button>
        </form>
      </section>

      <AnimatePresence>
        {showFilters && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
            aria-label="Advanced Filters Panels"
          >
            <div className="p-5 rounded-3xl bg-surface-card border border-white/5 space-y-4 neo-card">
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Advanced Filters</span>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-[9px] font-bold text-brand-primary uppercase tracking-wide flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              </div>

              <div className="space-y-1.5">
                <span className="text-[9px] font-bold uppercase text-gray-500 tracking-wider block">Exam Category</span>
                <div className="flex gap-2">
                  {['UPSC', 'BANKING', 'SSC'].map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => { setSelectedExam(ex); setPage(1); }}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        selectedExam === ex
                          ? 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary'
                          : 'bg-surface-secondary text-gray-400 border-transparent hover:bg-surface-elevated'
                      }`}
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[9px] font-bold uppercase text-gray-500 tracking-wider block">Date Interval</span>
                <div className="flex gap-1.5 flex-wrap">
                  {[
                    { id: 'all', label: 'All Dates' },
                    { id: 'today', label: 'Today' },
                    { id: 'yesterday', label: 'Yesterday' },
                    { id: 'week', label: 'Last 7 Days' },
                    { id: 'archive', label: 'Archive' }
                  ].map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => { setDateFilter(d.id); setPage(1); }}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border cursor-pointer ${
                        dateFilter === d.id
                          ? 'bg-white/10 text-white border-white/10'
                          : 'bg-surface-secondary text-gray-400 border-transparent hover:bg-surface-elevated'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[9px] font-bold uppercase text-gray-500 tracking-wider block">Publisher Source</span>
                <select
                  value={selectedSource}
                  onChange={(e) => { setSelectedSource(e.target.value); setPage(1); }}
                  className="w-full p-2.5 rounded-xl bg-surface-secondary border border-white/5 text-xs text-gray-300 focus:outline-none focus:border-brand-primary/40 font-semibold"
                >
                  <option value="">Select Publisher...</option>
                  {sourcesList.map((src) => (
                    <option key={src} value={src}>{src}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <span className="text-[9px] font-bold uppercase text-gray-500 tracking-wider block">Topic Tag</span>
                <select
                  value={selectedTopic}
                  onChange={(e) => { setSelectedTopic(e.target.value); setPage(1); }}
                  className="w-full p-2.5 rounded-xl bg-surface-secondary border border-white/5 text-xs text-gray-300 focus:outline-none focus:border-brand-primary/40 font-semibold"
                >
                  <option value="">Select Topic...</option>
                  {topicsList.map((top) => (
                    <option key={top} value={top}>{top}</option>
                  ))}
                </select>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {!loading && !error && articles.length > 0 && (
        <div className="px-1 text-[10px] text-gray-500 font-bold uppercase tracking-wider flex justify-between items-center">
          <span>Found {pagination.total} briefings</span>
          <span>Page {pagination.page} of {pagination.pages || 1}</span>
        </div>
      )}

      <section aria-label="Search results feed" className="flex flex-col gap-4">
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="w-full p-5 rounded-2xl bg-surface-card border border-white/5 animate-pulse flex flex-col gap-4 min-h-[200px]">
              <div className="flex justify-between items-center">
                <div className="h-3 w-16 bg-surface-elevated rounded animate-pulse" />
                <div className="h-4 w-12 bg-surface-elevated rounded animate-pulse" />
              </div>
              <div className="h-4 w-11/12 bg-surface-elevated rounded animate-pulse" />
              <div className="h-3 w-4/12 bg-surface-elevated rounded animate-pulse" />
            </div>
          ))
        ) : error ? (
          <div className="p-8 rounded-2xl bg-surface-card border border-brand-danger/10 text-center neo-card flex flex-col items-center gap-3">
            <AlertCircle className="w-8 h-8 text-brand-danger" />
            <p className="text-sm font-semibold text-gray-300">{error}</p>
            <button
              onClick={fetchSearchResults}
              className="mt-2 px-4 py-2 text-xs font-bold rounded-lg border border-brand-danger/25 text-brand-danger hover:bg-brand-danger/5 transition-all cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : articles.length === 0 ? (
          <div className="p-10 rounded-2xl bg-surface-card border border-white/5 text-center neo-card flex flex-col items-center justify-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-surface-secondary flex items-center justify-center text-gray-500 border border-white/5">
              <Newspaper className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-base font-bold text-gray-300 font-display">No Match Found</h4>
              <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1.5 leading-relaxed">
                We could not find any current affairs matching your query criteria. Try adjustments to your keywords or clearing advanced filters.
              </p>
            </div>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 text-xs font-bold rounded-lg border border-white/10 hover:bg-white/5 text-gray-300 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Clear Filters
            </button>
          </div>
        ) : (
          <>
            {articles.map((article) => (
              <NewsCard key={article._id} article={article} />
            ))}

            {pagination.pages > 1 && (
              <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-4">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 font-bold text-xs uppercase flex items-center gap-1.5 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer neo-btn"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <button
                  disabled={page === pagination.pages}
                  onClick={() => setPage((prev) => Math.min(pagination.pages, prev + 1))}
                  className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 font-bold text-xs uppercase flex items-center gap-1.5 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer neo-btn"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
