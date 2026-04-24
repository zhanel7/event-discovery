import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { conferencesAPI } from '../api'
import ConferenceCard from '../components/ConferenceCard'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

const CATEGORY_INFO = {
  'AI': {
    icon: '🤖', color: '#7c3aed',
    desc: 'Explore cutting-edge Artificial Intelligence conferences featuring research on machine perception, reasoning, and autonomous systems.',
    image: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=1200&q=80',
  },
  'Machine Learning': {
    icon: '🧠', color: '#4f46e5',
    desc: 'Discover the latest advances in Machine Learning, from deep neural networks to reinforcement learning and beyond.',
    image: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=1200&q=80',
  },
  'Computer Science': {
    icon: '💻', color: '#0ea5e9',
    desc: 'Browse top Computer Science conferences covering algorithms, systems, programming languages, and theoretical foundations.',
    image: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=1200&q=80',
  },
  'Data Science': {
    icon: '📊', color: '#059669',
    desc: 'Find Data Science conferences focused on big data analytics, visualization, and data-driven decision making.',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80',
  },
  'Security': {
    icon: '🔒', color: '#dc2626',
    desc: 'Stay ahead of cyber threats with top Security conferences on cryptography, network security, and privacy.',
    image: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=1200&q=80',
  },
  'Web Development': {
    icon: '🌐', color: '#0284c7',
    desc: 'Connect with web developers and researchers at conferences on modern frameworks, web standards, and browser technologies.',
    image: 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=1200&q=80',
  },
  'Physics': {
    icon: '⚛️', color: '#db2777',
    desc: 'Explore Physics conferences from quantum mechanics to astrophysics and particle physics.',
    image: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=1200&q=80',
  },
  'Biology': {
    icon: '🧬', color: '#16a34a',
    desc: 'Discover Biology and Life Sciences conferences covering genomics, cell biology, and biotechnology.',
    image: 'https://images.unsplash.com/photo-1530026186672-2cd00ffc50fe?w=1200&q=80',
  },
  'Mathematics': {
    icon: '📐', color: '#ea580c',
    desc: 'Engage with mathematicians worldwide at conferences on pure and applied mathematics.',
    image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&q=80',
  },
  'Medicine': {
    icon: '🏥', color: '#e11d48',
    desc: 'Find Medical conferences covering clinical research, healthcare innovation, and medical technology.',
    image: 'https://images.unsplash.com/photo-1576671081837-49000212a370?w=1200&q=80',
  },
  'Chemistry': {
    icon: '⚗️', color: '#d97706',
    desc: 'Explore Chemistry conferences on organic synthesis, materials science, and chemical engineering.',
    image: 'https://images.unsplash.com/photo-1532634922-8fe0b757fb13?w=1200&q=80',
  },
  'Engineering': {
    icon: '⚙️', color: '#0891b2',
    desc: 'Browse Engineering conferences covering civil, mechanical, electrical, and software engineering.',
    image: 'https://images.unsplash.com/photo-1537462715879-360eeb61a0ad?w=1200&q=80',
  },
  'Python': {
    icon: '🐍', color: '#ca8a04',
    desc: 'Join Python conferences featuring talks on web frameworks, data science, and software development.',
    image: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=1200&q=80',
  },
}

const BROWSE_TOPICS = [
  { label: 'Business & Economics', icon: '💼', cats: ['Economics', 'Business', 'Finance'] },
  { label: 'Engineering & Tech', icon: '⚙️', cats: ['Engineering', 'Computer Science', 'Web Development'] },
  { label: 'AI & Machine Learning', icon: '🤖', cats: ['AI', 'Machine Learning', 'Data Science'] },
  { label: 'Medical & Health', icon: '🏥', cats: ['Medicine', 'Biology', 'Chemistry'] },
  { label: 'Physical Sciences', icon: '⚛️', cats: ['Physics', 'Mathematics', 'Chemistry'] },
  { label: 'Security & Privacy', icon: '🔒', cats: ['Security', 'Python', 'Web Development'] },
]

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function CategoryPage() {
  const { category } = useParams()
  const { user } = useAuth()
  const [conferences, setConferences] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [selectedMonth, setSelectedMonth] = useState(null)
  const [search, setSearch] = useState('')
  const [currentYear] = useState(new Date().getFullYear())
  const [monthOffset, setMonthOffset] = useState(0)

  const decodedCategory = decodeURIComponent(category)
  const info = CATEGORY_INFO[decodedCategory] || {
    icon: '🎓', color: '#6366f1',
    desc: `Explore upcoming ${decodedCategory} conferences worldwide.`,
    image: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200&q=80',
  }

  useEffect(() => {
    loadConferences()
  }, [category, search])

  const loadConferences = async () => {
    try {
      setLoading(true)
      const params = { limit: 50, category: decodedCategory }
      if (search) params.search = search
      const response = await conferencesAPI.getConferences(params)
      setConferences(response.data.items || [])
      setTotal(response.data.total || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete?')) return
    try {
      await conferencesAPI.deleteConference(id)
      loadConferences()
    } catch { alert('Failed') }
  }

  // Filter by month
  const filteredConferences = selectedMonth !== null
    ? conferences.filter(c => {
        const m = new Date(c.start_date).getMonth()
        return m === selectedMonth
      })
    : conferences

  // Get visible months (5 at a time)
  const allMonths = Array.from({ length: 12 }, (_, i) => i)
  const visibleMonths = allMonths.slice(monthOffset, monthOffset + 5)

  // Count conferences per month
  const monthCounts = allMonths.map(m =>
    conferences.filter(c => new Date(c.start_date).getMonth() === m).length
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', paddingTop: 64 }}>

      {/* Hero */}
      <div style={{ position: 'relative', height: 260, overflow: 'hidden' }}>
        <img src={info.image} alt="" style={{
          width: '100%', height: '100%', objectFit: 'cover',
          filter: 'brightness(0.2)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(135deg, ${info.color}40, #0f0f1a)`,
        }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
          background: 'linear-gradient(to top, #0f0f1a, transparent)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center',
          padding: '0 40px', maxWidth: 1200, margin: '0 auto',
        }}>
          <div>
            <div style={{
              fontSize: 48, marginBottom: 8,
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))',
            }}>{info.icon}</div>
            <h1 style={{
              fontSize: 'clamp(1.6rem, 3vw, 2.4rem)',
              fontWeight: 900, color: '#f1f5f9', marginBottom: 8,
            }}>
              International {decodedCategory} Conferences
            </h1>
            <p style={{ color: '#94a3b8', fontSize: 14, maxWidth: 600 }}>
              {info.desc}
            </p>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div style={{
        padding: '12px 40px',
        background: 'rgba(255,255,255,0.02)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        fontSize: 13, color: '#64748b',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <Link to="/" style={{ color: '#6366f1', textDecoration: 'none' }}>Home</Link>
        <span>›</span>
        <span style={{ color: '#94a3b8' }}>{decodedCategory}</span>
        <span style={{ marginLeft: 'auto', color: '#64748b' }}>
          {total} conferences found
        </span>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '24px 24px 80px', display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24 }}>

        {/* LEFT */}
        <div>
          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>🔍</span>
            <input
              type="text"
              placeholder={`Search ${decodedCategory} conferences...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '12px 16px 12px 42px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12, color: '#f1f5f9', fontSize: 14,
                outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = '#6366f1'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>

          {/* Calendar */}
          <div style={{
            background: '#131b2e',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16, padding: 20, marginBottom: 24,
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 14,
            }}>
              <h3 style={{ color: '#f1f5f9', fontSize: 15, fontWeight: 700 }}>
                📅 Conference Calendar {currentYear}
              </h3>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => setMonthOffset(Math.max(0, monthOffset - 1))} style={{
                  padding: '4px 10px', background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 6, color: '#94a3b8', cursor: 'pointer', fontSize: 14,
                }}>‹</button>
                <button onClick={() => setMonthOffset(Math.min(7, monthOffset + 1))} style={{
                  padding: '4px 10px', background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 6, color: '#94a3b8', cursor: 'pointer', fontSize: 14,
                }}>›</button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {visibleMonths.map(m => (
                <button key={m} onClick={() => setSelectedMonth(selectedMonth === m ? null : m)} style={{
                  flex: 1, padding: '12px 8px', textAlign: 'center',
                  background: selectedMonth === m
                    ? `linear-gradient(135deg, ${info.color}, ${info.color}99)`
                    : monthCounts[m] > 0
                      ? 'rgba(99,102,241,0.08)'
                      : 'rgba(255,255,255,0.03)',
                  border: selectedMonth === m
                    ? `1px solid ${info.color}`
                    : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s',
                }}>
                  <div style={{
                    fontSize: 12, fontWeight: 700,
                    color: selectedMonth === m ? 'white' : '#94a3b8',
                  }}>{MONTHS[m]}</div>
                  {monthCounts[m] > 0 && (
                    <div style={{
                      fontSize: 11,
                      color: selectedMonth === m ? 'rgba(255,255,255,0.8)' : '#6366f1',
                      marginTop: 2, fontWeight: 600,
                    }}>{monthCounts[m]}</div>
                  )}
                </button>
              ))}
            </div>
            {selectedMonth !== null && (
              <div style={{ marginTop: 10, fontSize: 12, color: '#64748b', textAlign: 'center' }}>
                Showing {filteredConferences.length} conferences in {MONTHS[selectedMonth]} ·{' '}
                <button onClick={() => setSelectedMonth(null)} style={{
                  background: 'none', border: 'none', color: '#6366f1',
                  cursor: 'pointer', fontSize: 12, fontWeight: 600,
                }}>Show all</button>
              </div>
            )}
          </div>

          {/* Results title */}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 16,
          }}>
            <h2 style={{ color: '#f1f5f9', fontSize: 18, fontWeight: 700 }}>
              Upcoming {decodedCategory} Conferences {selectedMonth !== null ? `in ${MONTHS[selectedMonth]}` : `${currentYear}`}
            </h2>
            <span style={{ color: '#64748b', fontSize: 13 }}>
              {filteredConferences.length} events
            </span>
          </div>

          {/* Conference list */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{
                  height: 240, borderRadius: 16,
                  background: 'rgba(255,255,255,0.04)',
                  animation: 'pulse 2s infinite',
                }} />
              ))}
            </div>
          ) : filteredConferences.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '4rem', marginBottom: 12 }}>🔍</div>
              <h3 style={{ color: '#f1f5f9', marginBottom: 8 }}>No conferences found</h3>
              <p style={{ color: '#64748b' }}>Try a different month or search term</p>
            </div>
          ) : (
            <motion.div
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
            >
              {filteredConferences.map((conf, i) => (
                <motion.div
                  key={conf.id}
                  variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                >
                  <ConferenceCard
                    conference={conf}
                    canEdit={user && (user.role === 'admin' || user.id === conf.owner_id)}
                    onDelete={handleDelete}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Stats */}
          <div style={{
            background: '#131b2e',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16, padding: 20,
          }}>
            <h3 style={{ color: '#f1f5f9', fontSize: 14, fontWeight: 700, marginBottom: 14 }}>
              📊 Statistics
            </h3>
            {[
              { label: 'Total Conferences', value: total, icon: '🎓' },
              { label: 'This Year', value: conferences.filter(c => new Date(c.start_date).getFullYear() === currentYear).length, icon: '📅' },
              { label: 'With Open CFP', value: conferences.filter(c => c.cfp_deadline && new Date(c.cfp_deadline) > new Date()).length, icon: '📝' },
              { label: 'Virtual Events', value: conferences.filter(c => c.location?.toLowerCase().includes('virtual') || c.location?.toLowerCase().includes('online')).length, icon: '🌐' },
            ].map(item => (
              <div key={item.label} style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', padding: '9px 0',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}>
                <span style={{ color: '#64748b', fontSize: 13 }}>{item.icon} {item.label}</span>
                <span style={{
                  color: '#a5b4fc', fontSize: 14, fontWeight: 700,
                  background: 'rgba(99,102,241,0.1)',
                  padding: '2px 10px', borderRadius: 100,
                }}>{item.value}</span>
              </div>
            ))}
          </div>

          {/* Browse Topics */}
          <div style={{
            background: '#131b2e',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16, padding: 20,
          }}>
            <h3 style={{ color: '#f1f5f9', fontSize: 14, fontWeight: 700, marginBottom: 14 }}>
              Browse Topics
            </h3>
            {BROWSE_TOPICS.map(topic => (
              <div key={topic.label} style={{ marginBottom: 4 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 12px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  cursor: 'pointer',
                }}>
                  <span>{topic.icon}</span>
                  <span style={{ color: '#cbd5e1', fontSize: 13, fontWeight: 500, flex: 1 }}>{topic.label}</span>
                  <span style={{ color: '#64748b', fontSize: 12 }}>›</span>
                </div>
                <div style={{ paddingLeft: 12, marginTop: 4 }}>
                  {topic.cats.map(cat => (
                    <Link key={cat} to={`/category/${encodeURIComponent(cat)}`} style={{
                      display: 'block', padding: '5px 10px',
                      color: cat === decodedCategory ? '#a5b4fc' : '#64748b',
                      fontSize: 12, textDecoration: 'none',
                      borderLeft: cat === decodedCategory ? '2px solid #6366f1' : '2px solid transparent',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => e.target.style.color = '#94a3b8'}
                    onMouseLeave={e => e.target.style.color = cat === decodedCategory ? '#a5b4fc' : '#64748b'}
                    >
                      {cat}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Add conference CTA */}
          {user && (
            <Link to="/create" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '14px',
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              color: 'white', textDecoration: 'none',
              borderRadius: 14, fontSize: 14, fontWeight: 700,
              boxShadow: '0 4px 20px rgba(99,102,241,0.3)',
            }}>
              + Add {decodedCategory} Conference
            </Link>
          )}
        </div>
      </div>

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  )
}