import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { conferencesAPI } from '../api';
import ConferenceCard from '../components/ConferenceCard';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const ITEMS_PER_PAGE = 12;

export default function Home() {
  const { user } = useAuth();
  const [conferences, setConferences] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadConferences = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        skip: (currentPage - 1) * ITEMS_PER_PAGE,
        limit: ITEMS_PER_PAGE,
        sort,
      };

      if (search) params.search = search;
      if (category) params.category = category;

      const response = await conferencesAPI.getConferences(params);
      setConferences(response.data.items || []);
      setTotal(response.data.total || 0);
    } catch (err) {
      setError('Failed to load conferences');
      console.error('Error loading conferences:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, category, sort]);

  useEffect(() => {
    loadConferences();
  }, [loadConferences]);

  const handleSearchChange = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (value) => {
    setCategory(value);
    setCurrentPage(1);
  };

  const handleSortChange = (value) => {
    setSort(value);
    setCurrentPage(1);
  };

  const handleDelete = async (conferenceId) => {
    if (!window.confirm('Are you sure you want to delete this conference?')) {
      return;
    }

    try {
      await conferencesAPI.deleteConference(conferenceId);
      loadConferences();
    } catch (err) {
      alert('Failed to delete conference');
      console.error('Error deleting conference:', err);
    }
  };

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <div style={{ minHeight: '100vh', paddingTop: '64px' }}>
      {/* Hero Section */}
      <section style={{
        padding: '80px 24px 60px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: 800,
            marginBottom: '16px',
            background: 'linear-gradient(135deg, #a5b4fc 0%, #7dd3fc 50%, #f0abfc 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1.1,
          }}>
            Discover Scientific<br />Conferences Worldwide
          </h1>
          <p style={{
            fontSize: '18px',
            color: '#94a3b8',
            marginBottom: '40px',
            maxWidth: '600px',
            margin: '0 auto 40px',
          }}>
            Find CFPs, track deadlines, never miss a conference
          </p>

          {/* Stats */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '40px',
            marginBottom: '40px',
            flexWrap: 'wrap',
          }}>
            {[
              { number: '500+', label: 'Conferences' },
              { number: '50+', label: 'Categories' },
              { number: '100+', label: 'Countries' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                style={{
                  textAlign: 'center',
                  padding: '20px',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '16px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <div style={{
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: '#a5b4fc',
                  marginBottom: '4px',
                }}>
                  {stat.number}
                </div>
                <div style={{ fontSize: '14px', color: '#94a3b8' }}>
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Search Section */}
      <section style={{
        padding: '0 24px 40px',
        position: 'sticky',
        top: '64px',
        zIndex: 10,
        background: 'rgba(15, 15, 26, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}>
          <input
            type="text"
            placeholder="🔍 Search conferences..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              color: '#f1f5f9',
              fontSize: '15px',
            }}
          />

          <select
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            style={{
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              color: '#f1f5f9',
              fontSize: '15px',
              minWidth: '150px',
            }}
          >
            <option value="">All Categories</option>
            <option value="Computer Science">Computer Science</option>
            <option value="AI">AI</option>
            <option value="Physics">Physics</option>
            <option value="Biology">Biology</option>
            <option value="Mathematics">Mathematics</option>
          </select>

          <select
            value={sort}
            onChange={(e) => handleSortChange(e.target.value)}
            style={{
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              color: '#f1f5f9',
              fontSize: '15px',
              minWidth: '120px',
            }}
          >
            <option value="desc">Newest</option>
            <option value="asc">Oldest</option>
          </select>

          {(search || category) && (
            <button
              onClick={() => {
                setSearch('');
                setCategory('');
                setCurrentPage(1);
              }}
              style={{
                padding: '12px 20px',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '12px',
                color: '#fca5a5',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Reset
            </button>
          )}
        </div>
      </section>

      {/* Conferences Grid */}
      <section style={{ padding: '40px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {loading ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '24px',
            }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card" style={{
                  height: '280px',
                  background: 'rgba(255,255,255,0.05)',
                  animation: 'pulse 2s infinite',
                }} />
              ))}
            </div>
          ) : error ? (
            <div style={{
              textAlign: 'center',
              padding: '80px 20px',
              color: '#94a3b8',
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '16px' }}>😔</div>
              <h3 style={{ fontSize: '24px', marginBottom: '8px', color: '#f1f5f9' }}>
                Something went wrong
              </h3>
              <p>{error}</p>
            </div>
          ) : conferences.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '80px 20px',
              color: '#94a3b8',
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🔍</div>
              <h3 style={{ fontSize: '24px', marginBottom: '8px', color: '#f1f5f9' }}>
                No conferences found
              </h3>
              <p>Try adjusting your search criteria</p>
            </div>
          ) : (
            <>
              <motion.div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '24px',
                  marginBottom: '40px',
                }}
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.1,
                    },
                  },
                }}
              >
                {conferences.map((conference, index) => (
                  <motion.div
                    key={conference.id}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                  >
                    <ConferenceCard
                      conference={conference}
                      canEdit={user && (user.role === 'admin' || user.id === conference.owner_id)}
                      onDelete={handleDelete}
                    />
                  </motion.div>
                ))}
              </motion.div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '40px',
                }}>
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={!canGoPrevious}
                    style={{
                      padding: '8px 16px',
                      background: canGoPrevious ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: canGoPrevious ? '#a5b4fc' : '#94a3b8',
                      cursor: canGoPrevious ? 'pointer' : 'not-allowed',
                      fontSize: '14px',
                    }}
                  >
                    ← Previous
                  </button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        style={{
                          padding: '8px 12px',
                          background: pageNum === currentPage ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                          border: pageNum === currentPage ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                          color: pageNum === currentPage ? '#a5b4fc' : '#94a3b8',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: pageNum === currentPage ? 600 : 400,
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!canGoNext}
                    style={{
                      padding: '8px 16px',
                      background: canGoNext ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: canGoNext ? '#a5b4fc' : '#94a3b8',
                      cursor: canGoNext ? 'pointer' : 'not-allowed',
                      fontSize: '14px',
                    }}
                  >
                    Next →
                  </button>
                </div>
              )}

              <div style={{
                textAlign: 'center',
                marginTop: '20px',
                fontSize: '14px',
                color: '#94a3b8',
              }}>
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, total)} of {total} conferences
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
