import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { conferencesAPI } from '../api';
import ConferenceCard from '../components/ConferenceCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const ITEMS_PER_PAGE = 12;

const CATEGORIES = [
  { value: '', label: '🌍 All Categories' },
  { value: 'AI', label: '🤖 Artificial Intelligence' },
  { value: 'Machine Learning', label: '🧠 Machine Learning' },
  { value: 'Computer Science', label: '💻 Computer Science' },
  { value: 'Data Science', label: '📊 Data Science' },
  { value: 'Web Development', label: '🌐 Web Development' },
  { value: 'Security', label: '🔒 Cybersecurity' },
  { value: 'Physics', label: '⚛️ Physics' },
  { value: 'Biology', label: '🧬 Biology' },
  { value: 'Mathematics', label: '📐 Mathematics' },
  { value: 'Medicine', label: '🏥 Medicine' },
  { value: 'Chemistry', label: '⚗️ Chemistry' },
  { value: 'Engineering', label: '⚙️ Engineering' },
  { value: 'Python', label: '🐍 Python' },
];

const COUNTRIES = [
  { value: '', label: '🌍 All Countries' },
  { value: 'USA', label: '🇺🇸 USA' },
  { value: 'United Kingdom', label: '🇬🇧 UK' },
  { value: 'Germany', label: '🇩🇪 Germany' },
  { value: 'France', label: '🇫🇷 France' },
  { value: 'Canada', label: '🇨🇦 Canada' },
  { value: 'Australia', label: '🇦🇺 Australia' },
  { value: 'Japan', label: '🇯🇵 Japan' },
  { value: 'China', label: '🇨🇳 China' },
  { value: 'India', label: '🇮🇳 India' },
  { value: 'Singapore', label: '🇸🇬 Singapore' },
  { value: 'Austria', label: '🇦🇹 Austria' },
  { value: 'Netherlands', label: '🇳🇱 Netherlands' },
  { value: 'Switzerland', label: '🇨🇭 Switzerland' },
  { value: 'Virtual', label: '🌐 Virtual/Online' },
];

const QUICK_FILTERS = [
  { label: '🔥 Urgent CFP', filter: 'urgent' },
  { label: '🆕 This Month', filter: 'month' },
  { label: '❤️ Saved', filter: 'liked' },
  { label: '🌐 Virtual', filter: 'virtual' },
];

export default function Home() {
  const { user } = useAuth();
  const [conferences, setConferences] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [country, setCountry] = useState('');
  const [sort, setSort] = useState('desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [quickFilter, setQuickFilter] = useState('');
  const [likedIds, setLikedIds] = useState(() => {
    return JSON.parse(localStorage.getItem('liked_conferences') || '[]');
  });

  const loadConferences = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        skip: (currentPage - 1) * ITEMS_PER_PAGE,
        limit: ITEMS_PER_PAGE,
        sort_order: sort,
        sort_by: 'created_at',
      };
      if (search) params.search = search;
      if (category) params.category = category;
      const response = await conferencesAPI.getConferences(params);
      let items = response.data.items || [];
      let tot = response.data.total || 0;

      // Client-side filters
      if (country) {
        items = items.filter(c => c.location && c.location.includes(country));
        tot = items.length;
      }
      if (quickFilter === 'urgent') {
        items = items.filter(c => {
          if (!c.cfp_deadline) return false;
          const days = Math.ceil((new Date(c.cfp_deadline) - new Date()) / 86400000);
          return days >= 0 && days <= 30;
        });
        tot = items.length;
      }
      if (quickFilter === 'month') {
        const now = new Date();
        items = items.filter(c => {
          const start = new Date(c.start_date);
          return start.getMonth() === now.getMonth() && start.getFullYear() === now.getFullYear();
        });
        tot = items.length;
      }
      if (quickFilter === 'virtual') {
        items = items.filter(c => c.location && (c.location.toLowerCase().includes('virtual') || c.location.toLowerCase().includes('online')));
        tot = items.length;
      }
      if (quickFilter === 'liked') {
        const liked = JSON.parse(localStorage.getItem('liked_conferences') || '[]');
        items = items.filter(c => liked.includes(c.id));
        tot = items.length;
      }

      setConferences(items);
      setTotal(tot);
    } catch (err) {
      setError('Failed to load conferences');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, category, country, sort, quickFilter]);

  useEffect(() => { loadConferences(); }, [loadConferences]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const resetFilters = () => {
    setSearch(''); setCategory(''); setCountry('');
    setQuickFilter(''); setCurrentPage(1);
  };

  const hasFilters = search || category || country || quickFilter;

  return (
    <div style={{ minHeight: '100vh', paddingTop: '64px', background: '#0f0f1a' }}>

      {/* ═══ HERO ═══ */}
      <section style={{
        padding: '80px 24px 60px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background orbs */}
        <div style={{
          position: 'absolute', top: '-100px', left: '10%',
          width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(99,102,241,0.15), transparent)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '-50px', right: '10%',
          width: 300, height: 300,
          background: 'radial-gradient(circle, rgba(14,165,233,0.1), transparent)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 100,
            background: 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.2)',
            fontSize: 13, color: '#a5b4fc', marginBottom: 24,
            fontWeight: 600,
          }}>
            🚀 The #1 Platform for Scientific Conferences
          </div>

          <h1 style={{
            fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
            fontWeight: 900,
            marginBottom: 20,
            background: 'linear-gradient(135deg, #a5b4fc 0%, #7dd3fc 50%, #f0abfc 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1.1,
          }}>
            Discover Scientific<br />Conferences Worldwide
          </h1>

          <p style={{
            fontSize: 18, color: '#64748b',
            maxWidth: 600, margin: '0 auto 40px',
            lineHeight: 1.6,
          }}>
            Find CFPs, track deadlines, connect with researchers.<br />
            Never miss an important conference again.
          </p>

          {/* Stats */}
          <div style={{
            display: 'flex', justifyContent: 'center',
            gap: 20, flexWrap: 'wrap', marginBottom: 48,
          }}>
            {[
              { number: '500+', label: 'Conferences', icon: '🎓' },
              { number: '50+', label: 'Categories', icon: '🏷️' },
              { number: '100+', label: 'Countries', icon: '🌍' },
              { number: '10K+', label: 'Researchers', icon: '👩‍🔬' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 + 0.3 }}
                style={{
                  textAlign: 'center', padding: '20px 28px',
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(10px)',
                  minWidth: 120,
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 4 }}>{stat.icon}</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#a5b4fc' }}>{stat.number}</div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* CTA Buttons */}
          {!user && (
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/register" style={{
                padding: '14px 32px',
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: 'white', textDecoration: 'none',
                borderRadius: 12, fontSize: 15, fontWeight: 700,
                boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
                transition: 'all 0.2s',
              }}>
                🚀 Get Started Free
              </Link>
              <Link to="/login" style={{
                padding: '14px 32px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#cbd5e1', textDecoration: 'none',
                borderRadius: 12, fontSize: 15, fontWeight: 600,
              }}>
                Sign In →
              </Link>
            </div>
          )}
        </motion.div>
      </section>

      {/* ═══ QUICK FILTERS ═══ */}
      <section style={{ padding: '0 24px 24px' }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          display: 'flex', gap: 10, flexWrap: 'wrap',
        }}>
          {QUICK_FILTERS.map(({ label, filter }) => (
            <button
              key={filter}
              onClick={() => {
                setQuickFilter(quickFilter === filter ? '' : filter);
                setCurrentPage(1);
              }}
              style={{
                padding: '8px 18px', borderRadius: 100,
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.2s',
                background: quickFilter === filter
                  ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
                  : 'rgba(255,255,255,0.05)',
                border: quickFilter === filter
                  ? 'none'
                  : '1px solid rgba(255,255,255,0.1)',
                color: quickFilter === filter ? 'white' : '#94a3b8',
                boxShadow: quickFilter === filter ? '0 4px 15px rgba(99,102,241,0.3)' : 'none',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* ═══ SEARCH + FILTERS ═══ */}
      <section style={{
        padding: '16px 24px',
        background: 'rgba(15,15,26,0.9)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky', top: 64, zIndex: 10,
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center',
        }}>
          {/* Search */}
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <span style={{
              position: 'absolute', left: 14, top: '50%',
              transform: 'translateY(-50%)', fontSize: 16,
            }}>🔍</span>
            <input
              type="text"
              placeholder="Search conferences, topics, authors..."
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              style={{
                width: '100%', padding: '11px 16px 11px 42px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12, color: '#f1f5f9', fontSize: 14,
                outline: 'none', transition: 'all 0.2s',
                fontFamily: 'Inter, sans-serif',
              }}
              onFocus={e => e.target.style.borderColor = '#6366f1'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>

          {/* Category */}
          <select
            value={category}
            onChange={e => { setCategory(e.target.value); setCurrentPage(1); }}
            style={{
              padding: '11px 16px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12, color: '#f1f5f9', fontSize: 14,
              minWidth: 180, cursor: 'pointer',
            }}
          >
            {CATEGORIES.map(c => (
              <option key={c.value} value={c.value} style={{ background: '#1e1e3a' }}>
                {c.label}
              </option>
            ))}
          </select>

          {/* Country */}
          <select
            value={country}
            onChange={e => { setCountry(e.target.value); setCurrentPage(1); }}
            style={{
              padding: '11px 16px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12, color: '#f1f5f9', fontSize: 14,
              minWidth: 160, cursor: 'pointer',
            }}
          >
            {COUNTRIES.map(c => (
              <option key={c.value} value={c.value} style={{ background: '#1e1e3a' }}>
                {c.label}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sort}
            onChange={e => { setSort(e.target.value); setCurrentPage(1); }}
            style={{
              padding: '11px 16px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12, color: '#f1f5f9', fontSize: 14,
              minWidth: 130, cursor: 'pointer',
            }}
          >
            <option value="desc" style={{ background: '#1e1e3a' }}>🆕 Newest</option>
            <option value="asc" style={{ background: '#1e1e3a' }}>📅 Oldest</option>
          </select>

          {/* View mode */}
          <div style={{ display: 'flex', gap: 4 }}>
            {[
              { mode: 'grid', icon: '⊞' },
              { mode: 'list', icon: '☰' },
            ].map(({ mode, icon }) => (
              <button key={mode} onClick={() => setViewMode(mode)} style={{
                padding: '11px 14px',
                background: viewMode === mode ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                border: viewMode === mode ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, color: viewMode === mode ? '#a5b4fc' : '#64748b',
                cursor: 'pointer', fontSize: 16,
              }}>
                {icon}
              </button>
            ))}
          </div>

          {/* Reset */}
          {hasFilters && (
            <button onClick={resetFilters} style={{
              padding: '11px 18px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 12, color: '#fca5a5',
              cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>
              ✕ Reset
            </button>
          )}
        </div>
      </section>

      {/* ═══ RESULTS INFO ═══ */}
      <section style={{ padding: '20px 24px 0' }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', flexWrap: 'wrap', gap: 8,
        }}>
          <div style={{ fontSize: 14, color: '#64748b' }}>
            {loading ? 'Loading...' : (
              <span>
                Found <span style={{ color: '#a5b4fc', fontWeight: 700 }}>{total}</span> conferences
                {hasFilters && <span style={{ color: '#64748b' }}> matching your filters</span>}
              </span>
            )}
          </div>
          {user && (
            <Link to="/create" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 18px',
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              color: 'white', textDecoration: 'none',
              borderRadius: 10, fontSize: 13, fontWeight: 600,
              boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
            }}>
              + Add Conference
            </Link>
          )}
        </div>
      </section>

      {/* ═══ GRID ═══ */}
      <section style={{ padding: '20px 24px 60px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {loading ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: viewMode === 'grid'
                ? 'repeat(auto-fill, minmax(320px, 1fr))'
                : '1fr',
              gap: 20,
            }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{
                  height: 280, borderRadius: 20,
                  background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.5s infinite',
                }} />
              ))}
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <div style={{ fontSize: '4rem', marginBottom: 16 }}>😔</div>
              <h3 style={{ color: '#f1f5f9', marginBottom: 8 }}>Something went wrong</h3>
              <p style={{ color: '#64748b' }}>{error}</p>
              <button onClick={loadConferences} style={{
                marginTop: 20, padding: '10px 24px',
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                border: 'none', borderRadius: 10,
                color: 'white', cursor: 'pointer', fontSize: 14,
              }}>Try Again</button>
            </div>
          ) : conferences.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <div style={{ fontSize: '5rem', marginBottom: 16 }}>🔍</div>
              <h3 style={{ color: '#f1f5f9', marginBottom: 8, fontSize: 24 }}>No conferences found</h3>
              <p style={{ color: '#64748b', marginBottom: 24 }}>
                Try adjusting your search or filters
              </p>
              <button onClick={resetFilters} style={{
                padding: '10px 24px',
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                border: 'none', borderRadius: 10,
                color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 600,
              }}>Clear Filters</button>
            </div>
          ) : (
            <>
              <motion.div
                layout
                style={{
                  display: 'grid',
                  gridTemplateColumns: viewMode === 'grid'
                    ? 'repeat(auto-fill, minmax(320px, 1fr))'
                    : '1fr',
                  gap: 20, marginBottom: 40,
                }}
              >
                <AnimatePresence>
                  {conferences.map((conf, i) => (
                    <motion.div
                      key={conf.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <ConferenceCard
                        conference={conf}
                        canEdit={user && (user.role === 'admin' || user.id === conf.owner_id)}
                        onDelete={async (id) => {
                          if (!window.confirm('Delete this conference?')) return;
                          try {
                            await conferencesAPI.deleteConference(id);
                            loadConferences();
                          } catch { alert('Failed to delete'); }
                        }}
                        viewMode={viewMode}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{
                  display: 'flex', justifyContent: 'center',
                  alignItems: 'center', gap: 8,
                }}>
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={{
                      padding: '9px 18px', borderRadius: 10, cursor: 'pointer',
                      background: currentPage === 1 ? 'rgba(255,255,255,0.03)' : 'rgba(99,102,241,0.1)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: currentPage === 1 ? '#64748b' : '#a5b4fc',
                      fontSize: 14, fontWeight: 600,
                    }}
                  >← Prev</button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    return (
                      <button key={page} onClick={() => setCurrentPage(page)} style={{
                        padding: '9px 14px', borderRadius: 10, cursor: 'pointer',
                        background: page === currentPage ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'rgba(255,255,255,0.05)',
                        border: 'none', color: page === currentPage ? 'white' : '#64748b',
                        fontSize: 14, fontWeight: page === currentPage ? 700 : 400,
                        boxShadow: page === currentPage ? '0 4px 15px rgba(99,102,241,0.3)' : 'none',
                      }}>
                        {page}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: '9px 18px', borderRadius: 10, cursor: 'pointer',
                      background: currentPage === totalPages ? 'rgba(255,255,255,0.03)' : 'rgba(99,102,241,0.1)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: currentPage === totalPages ? '#64748b' : '#a5b4fc',
                      fontSize: 14, fontWeight: 600,
                    }}
                  >Next →</button>
                </div>
              )}

              <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#64748b' }}>
                Page {currentPage} of {totalPages} · {total} total conferences
              </div>
            </>
          )}
        </div>
      </section>

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}