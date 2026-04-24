import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { conferencesAPI } from '../api'
import { motion } from 'framer-motion'

const CATEGORY_IMAGES = {
  'AI': 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=1200&q=80',
  'Machine Learning': 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=1200&q=80',
  'Computer Science': 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=1200&q=80',
  'Data Science': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80',
  'Web Development': 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=1200&q=80',
  'Security': 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=1200&q=80',
  'Physics': 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=1200&q=80',
  'Biology': 'https://images.unsplash.com/photo-1530026186672-2cd00ffc50fe?w=1200&q=80',
  'Mathematics': 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&q=80',
  'Medicine': 'https://images.unsplash.com/photo-1576671081837-49000212a370?w=1200&q=80',
  'Chemistry': 'https://images.unsplash.com/photo-1532634922-8fe0b757fb13?w=1200&q=80',
  'Engineering': 'https://images.unsplash.com/photo-1537462715879-360eeb61a0ad?w=1200&q=80',
  'Python': 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=1200&q=80',
  'default': 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200&q=80',
}

const CATEGORY_COLORS = {
  'AI': { from: '#7c3aed', to: '#4f46e5' },
  'Machine Learning': { from: '#4f46e5', to: '#0ea5e9' },
  'Computer Science': { from: '#0ea5e9', to: '#06b6d4' },
  'Data Science': { from: '#059669', to: '#0ea5e9' },
  'Web Development': { from: '#0284c7', to: '#7c3aed' },
  'Security': { from: '#dc2626', to: '#9333ea' },
  'Physics': { from: '#db2777', to: '#9333ea' },
  'Biology': { from: '#16a34a', to: '#0ea5e9' },
  'Mathematics': { from: '#ea580c', to: '#dc2626' },
  'Medicine': { from: '#e11d48', to: '#9333ea' },
  'default': { from: '#6366f1', to: '#4f46e5' },
}

const COUNTRY_FLAGS = {
  'USA': '🇺🇸', 'United States': '🇺🇸', 'UK': '🇬🇧', 'United Kingdom': '🇬🇧',
  'Germany': '🇩🇪', 'France': '🇫🇷', 'Canada': '🇨🇦', 'Australia': '🇦🇺',
  'Japan': '🇯🇵', 'China': '🇨🇳', 'India': '🇮🇳', 'Brazil': '🇧🇷',
  'Austria': '🇦🇹', 'Netherlands': '🇳🇱', 'Switzerland': '🇨🇭',
  'Singapore': '🇸🇬', 'Spain': '🇪🇸', 'Italy': '🇮🇹', 'Korea': '🇰🇷',
  'Virtual': '🌐', 'Online': '🌐',
}

function getFlag(location) {
  if (!location) return '📍'
  for (const [country, flag] of Object.entries(COUNTRY_FLAGS)) {
    if (location.includes(country)) return flag
  }
  return '📍'
}

// ⏱️ Live Countdown Timer
function Countdown({ targetDate }) {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [passed, setPassed] = useState(false)

  useEffect(() => {
    const calc = () => {
      const diff = new Date(targetDate) - new Date()
      if (diff <= 0) { setPassed(true); return }
      setTime({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      })
    }
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [targetDate])

  if (passed) return (
    <div style={{
      background: 'rgba(100,116,139,0.1)',
      border: '1px solid rgba(100,116,139,0.2)',
      borderRadius: 16, padding: '20px',
      textAlign: 'center', color: '#64748b',
    }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>🔒</div>
      <div style={{ fontWeight: 700 }}>CFP Closed</div>
    </div>
  )

  return (
    <div style={{
      background: 'rgba(99,102,241,0.08)',
      border: '1px solid rgba(99,102,241,0.2)',
      borderRadius: 16, padding: '20px',
    }}>
      <div style={{
        fontSize: 11, fontWeight: 700, color: '#6366f1',
        textTransform: 'uppercase', letterSpacing: 1,
        marginBottom: 14, textAlign: 'center',
      }}>⏰ CFP Deadline Countdown</div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        {[
          { val: time.days, label: 'Days' },
          { val: time.hours, label: 'Hours' },
          { val: time.minutes, label: 'Min' },
          { val: time.seconds, label: 'Sec' },
        ].map(({ val, label }) => (
          <div key={label} style={{
            flex: 1, textAlign: 'center',
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            borderRadius: 12, padding: '14px 8px',
            boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
          }}>
            <div style={{
              fontSize: 28, fontWeight: 900, color: 'white',
              lineHeight: 1, fontVariantNumeric: 'tabular-nums',
            }}>
              {String(val).padStart(2, '0')}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 4, fontWeight: 600 }}>
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 📅 Add to Calendar
function AddToCalendar({ conference }) {
  const [open, setOpen] = useState(false)

  const makeDate = (d) => new Date(d).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const title = encodeURIComponent(conference.title)
  const location = encodeURIComponent(conference.location || '')
  const details = encodeURIComponent(conference.description || '')
  const start = makeDate(conference.start_date)
  const end = makeDate(conference.end_date)

  const links = [
    {
      name: 'Google Calendar', icon: '📅', color: '#4285f4',
      url: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`,
    },
    {
      name: 'Outlook', icon: '📧', color: '#0078d4',
      url: `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${conference.start_date}&enddt=${conference.end_date}&body=${details}&location=${location}`,
    },
    {
      name: 'Yahoo Calendar', icon: '🟣', color: '#6001d2',
      url: `https://calendar.yahoo.com/?v=60&title=${title}&st=${start}&et=${end}&desc=${details}&in_loc=${location}`,
    },
  ]

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', padding: '12px',
        background: 'rgba(99,102,241,0.1)',
        border: '1px solid rgba(99,102,241,0.25)',
        borderRadius: 12, color: '#a5b4fc',
        cursor: 'pointer', fontSize: 13, fontWeight: 600,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        transition: 'all 0.2s',
      }}>
        📅 Add to Calendar ▾
      </button>
      {open && (
        <div style={{
          position: 'absolute', bottom: '100%', left: 0, right: 0,
          marginBottom: 8,
          background: '#1a2035',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12, overflow: 'hidden',
          zIndex: 100,
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        }}>
          {links.map(link => (
            <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 16px', textDecoration: 'none',
                color: '#f1f5f9', fontSize: 13, fontWeight: 500,
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontSize: 18 }}>{link.icon}</span>
              {link.name}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

// 🔗 Share buttons
function ShareButtons({ conference }) {
  const [copied, setCopied] = useState(false)
  const url = encodeURIComponent(window.location.href)
  const text = encodeURIComponent(`Check out: ${conference.title}`)

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shares = [
    { name: 'WhatsApp', icon: '💬', color: '#25d366', url: `https://wa.me/?text=${text}%20${url}` },
    { name: 'Telegram', icon: '✈️', color: '#0088cc', url: `https://t.me/share/url?url=${url}&text=${text}` },
    { name: 'Twitter', icon: '🐦', color: '#1da1f2', url: `https://twitter.com/intent/tweet?text=${text}&url=${url}` },
    { name: 'LinkedIn', icon: '💼', color: '#0077b5', url: `https://www.linkedin.com/sharing/share-offsite/?url=${url}` },
  ]

  return (
    <div style={{
      background: '#131b2e',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 20, padding: 20,
    }}>
      <div style={{
        fontSize: 13, fontWeight: 700, color: '#f1f5f9',
        marginBottom: 14,
      }}>🔗 Share Conference</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        {shares.map(s => (
          <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '9px 12px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10, textDecoration: 'none',
            color: '#94a3b8', fontSize: 12, fontWeight: 500,
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = `${s.color}20`
            e.currentTarget.style.borderColor = `${s.color}50`
            e.currentTarget.style.color = '#f1f5f9'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
            e.currentTarget.style.color = '#94a3b8'
          }}>
            <span style={{ fontSize: 16 }}>{s.icon}</span> {s.name}
          </a>
        ))}
      </div>
      <button onClick={copyLink} style={{
        width: '100%', padding: '9px',
        background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 10, color: copied ? '#34d399' : '#94a3b8',
        cursor: 'pointer', fontSize: 12, fontWeight: 600,
        transition: 'all 0.2s',
      }}>
        {copied ? '✅ Link Copied!' : '🔗 Copy Link'}
      </button>
    </div>
  )
}

// 📋 Agenda
function Agenda({ conference }) {
  const generateAgenda = () => {
    const start = new Date(conference.start_date)
    const items = [
      { time: '09:00 – 09:30', session: 'Registration & Welcome Coffee' },
      { time: '09:30 – 10:00', session: 'Opening Ceremony & Keynote Introduction' },
      { time: '10:00 – 11:30', session: 'Keynote Speaker Session I' },
      { time: '11:30 – 12:30', session: 'Paper Presentations — Track A' },
      { time: '12:30 – 13:30', session: '🍽️ Lunch Break & Networking' },
      { time: '13:30 – 15:00', session: 'Paper Presentations — Track B' },
      { time: '15:00 – 15:30', session: '☕ Coffee Break' },
      { time: '15:30 – 17:00', session: 'Panel Discussion & Q&A' },
      { time: '17:00 – 17:30', session: '🏆 Awards & Closing Ceremony' },
    ]
    return items
  }

  return (
    <div style={{
      background: '#131b2e',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 20, padding: 28, marginBottom: 20,
    }}>
      <h2 style={{ color: '#f1f5f9', fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
        📋 Event Agenda
      </h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid rgba(99,102,241,0.3)' }}>
              <th style={{
                padding: '10px 16px', textAlign: 'left',
                color: '#6366f1', fontSize: 12, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: 0.5,
                width: '35%',
              }}>Timing</th>
              <th style={{
                padding: '10px 16px', textAlign: 'left',
                color: '#6366f1', fontSize: 12, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: 0.5,
              }}>Session</th>
            </tr>
          </thead>
          <tbody>
            {generateAgenda().map((item, i) => (
              <tr key={i} style={{
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent'}
              >
                <td style={{
                  padding: '12px 16px',
                  color: '#a5b4fc', fontSize: 13, fontWeight: 600,
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {item.time}
                </td>
                <td style={{ padding: '12px 16px', color: '#cbd5e1', fontSize: 14 }}>
                  {item.session}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{
        marginTop: 16, padding: '10px 14px',
        background: 'rgba(99,102,241,0.06)',
        border: '1px solid rgba(99,102,241,0.15)',
        borderRadius: 10, fontSize: 12, color: '#64748b',
      }}>
        ℹ️ Agenda is indicative and subject to change by organizers
      </div>
    </div>
  )
}

export default function ConferenceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [conference, setConference] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [liked, setLiked] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => { loadConference() }, [id])
  useEffect(() => {
    if (id) {
      const saved = JSON.parse(localStorage.getItem('liked_conferences') || '[]')
      setLiked(saved.includes(id))
    }
  }, [id])

  const loadConference = async () => {
    try {
      setLoading(true)
      const response = await conferencesAPI.getConference(id)
      setConference(response.data)
    } catch { setError('Conference not found') }
    finally { setLoading(false) }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this conference?')) return
    try { await conferencesAPI.deleteConference(id); navigate('/') }
    catch { alert('Failed to delete') }
  }

  const toggleLike = () => {
    const saved = JSON.parse(localStorage.getItem('liked_conferences') || '[]')
    const newSaved = liked ? saved.filter(x => x !== id) : [...saved, id]
    localStorage.setItem('liked_conferences', JSON.stringify(newSaved))
    setLiked(!liked)
  }

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  }) : '—'

  const formatShort = (d) => d ? new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  }) : '—'

  const getDaysLeft = (deadline) => {
    if (!deadline) return null
    const days = Math.ceil((new Date(deadline) - new Date()) / 86400000)
    if (days < 0) return { text: 'Passed', color: '#64748b', bg: 'rgba(100,116,139,0.1)', passed: true }
    if (days === 0) return { text: 'Due today!', color: '#ef4444', bg: 'rgba(239,68,68,0.15)', urgent: true }
    if (days <= 7) return { text: `${days}d left`, color: '#ef4444', bg: 'rgba(239,68,68,0.15)', urgent: true }
    if (days <= 30) return { text: `${days}d left`, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' }
    return { text: `${days}d left`, color: '#10b981', bg: 'rgba(16,185,129,0.15)' }
  }

  const getDuration = () => {
    if (!conference?.start_date || !conference?.end_date) return null
    const days = Math.ceil((new Date(conference.end_date) - new Date(conference.start_date)) / 86400000)
    return days > 0 ? `${days} day${days > 1 ? 's' : ''}` : '1 day'
  }

  const canEdit = user && conference && (user.role === 'admin' || user.id === conference.owner_id)
  const deadline = conference ? getDaysLeft(conference.cfp_deadline) : null
  const catColors = conference ? (CATEGORY_COLORS[conference.category] || CATEGORY_COLORS.default) : CATEGORY_COLORS.default
  const coverImg = conference ? (CATEGORY_IMAGES[conference.category] || CATEGORY_IMAGES.default) : CATEGORY_IMAGES.default
  const flag = conference ? getFlag(conference.location) : '📍'

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0f0f1a' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 56, height: 56, margin: '0 auto 16px',
          border: '3px solid rgba(99,102,241,0.2)',
          borderTopColor: '#6366f1', borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <p style={{ color: '#64748b' }}>Loading conference...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (error || !conference) return (
    <div style={{ textAlign: 'center', padding: '120px 24px', background: '#0f0f1a', minHeight: '100vh' }}>
      <div style={{ fontSize: '5rem', marginBottom: 16 }}>😔</div>
      <h2 style={{ color: '#f1f5f9', marginBottom: 24 }}>Conference not found</h2>
      <Link to="#" onClick={(e) => { e.preventDefault(); window.history.back(); }} style={{
        padding: '12px 28px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
        color: 'white', textDecoration: 'none', borderRadius: 12, fontWeight: 600,
      }}>← Back to Conferences</Link>
    </div>
  )

  const TABS = [
    { id: 'overview', label: '📋 Overview' },
    { id: 'agenda', label: '📅 Agenda' },
    { id: 'details', label: '📍 Venue' },
    { id: 'submit', label: '📝 Submit Paper' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', paddingTop: 64 }}>

      {/* ═══ HERO ═══ */}
      <div style={{ position: 'relative', height: 400, overflow: 'hidden' }}>
        <img src={coverImg} alt="" style={{
          width: '100%', height: '100%', objectFit: 'cover',
          filter: 'brightness(0.3)',
        }} onError={e => e.target.src = CATEGORY_IMAGES.default} />
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(135deg, ${catColors.from}50, ${catColors.to}30, #0f0f1a)`,
        }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 150,
          background: 'linear-gradient(to top, #0f0f1a, transparent)',
        }} />

        {/* Back */}
        <Link to="#" onClick={(e) => { e.preventDefault(); window.history.back(); }} style={{
          position: 'absolute', top: 24, left: 24,
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '8px 16px',
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 100, color: '#f1f5f9',
          textDecoration: 'none', fontSize: 13, fontWeight: 500,
        }}>← Back</Link>

        {/* Top right actions */}
        <div style={{ position: 'absolute', top: 24, right: 24, display: 'flex', gap: 8 }}>
          <button onClick={toggleLike} style={{
            padding: '8px 16px',
            background: liked ? 'rgba(239,68,68,0.3)' : 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${liked ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.15)'}`,
            borderRadius: 100, color: liked ? '#fca5a5' : '#f1f5f9',
            cursor: 'pointer', fontSize: 13, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {liked ? '❤️ Saved' : '🤍 Save'}
          </button>
        </div>

        {/* Hero content */}
        <div style={{
          position: 'absolute', bottom: 24, left: 0, right: 0,
          padding: '0 32px', maxWidth: 1100, margin: '0 auto',
        }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            <span style={{
              padding: '4px 14px', borderRadius: 100,
              background: `linear-gradient(135deg, ${catColors.from}, ${catColors.to})`,
              color: 'white', fontSize: 12, fontWeight: 700,
            }}>{conference.category || 'General'}</span>
            {deadline && !deadline.passed && (
              <span style={{
                padding: '4px 14px', borderRadius: 100,
                background: deadline.bg, color: deadline.color,
                fontSize: 12, fontWeight: 700,
                animation: deadline.urgent ? 'pulse 2s infinite' : 'none',
              }}>⏰ CFP: {deadline.text}</span>
            )}
            {deadline?.passed && (
              <span style={{
                padding: '4px 14px', borderRadius: 100,
                background: 'rgba(100,116,139,0.2)', color: '#94a3b8',
                fontSize: 12, fontWeight: 700,
              }}>🔒 CFP Closed</span>
            )}
          </div>

          <h1 style={{
            fontSize: 'clamp(1.6rem, 3.5vw, 2.6rem)',
            fontWeight: 900, color: '#f1f5f9',
            lineHeight: 1.15, marginBottom: 12,
            textShadow: '0 2px 20px rgba(0,0,0,0.5)',
          }}>{conference.title}</h1>

          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <span style={{ color: '#94a3b8', fontSize: 14 }}>{flag} {conference.location || 'TBD'}</span>
            <span style={{ color: '#64748b', fontSize: 14 }}>📅 {formatShort(conference.start_date)} — {formatShort(conference.end_date)}</span>
            {getDuration() && <span style={{ color: '#64748b', fontSize: 14 }}>⏱️ {getDuration()}</span>}
          </div>
        </div>
      </div>

      {/* ═══ TABS ═══ */}
      <div style={{
        background: 'rgba(15,15,26,0.95)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        position: 'sticky', top: 64, zIndex: 50,
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', display: 'flex', gap: 0 }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: '16px 20px', border: 'none', cursor: 'pointer',
              background: 'transparent',
              color: activeTab === tab.id ? '#a5b4fc' : '#64748b',
              fontSize: 13, fontWeight: 600,
              borderBottom: activeTab === tab.id
                ? `2px solid #6366f1`
                : '2px solid transparent',
              transition: 'all 0.2s',
            }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ MAIN ═══ */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>

          {/* LEFT */}
          <div>
            {activeTab === 'overview' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {/* About */}
                <div style={{
                  background: '#131b2e', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 20, padding: 28, marginBottom: 20,
                }}>
                  <h2 style={{ color: '#f1f5f9', fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
                    About this Conference
                  </h2>
                  <p style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.8 }}>
                    {conference.description || 'No description available.'}
                  </p>
                </div>

                {/* Topics */}
                <div style={{
                  background: '#131b2e', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 20, padding: 28, marginBottom: 20,
                }}>
                  <h2 style={{ color: '#f1f5f9', fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
                    🎯 Topics of Interest
                  </h2>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {[
                      conference.category,
                      'Research Papers', 'Workshops', 'Keynote Speakers',
                      'Poster Sessions', 'Industry Talks', 'Networking',
                      'Best Paper Award', 'Demo Sessions', 'Tutorials',
                    ].filter(Boolean).map(topic => (
                      <span key={topic} style={{
                        padding: '6px 14px', borderRadius: 100,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#94a3b8', fontSize: 13,
                      }}>{topic}</span>
                    ))}
                  </div>
                </div>

                {/* What to expect */}
                <div style={{
                  background: '#131b2e', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 20, padding: 28,
                }}>
                  <h2 style={{ color: '#f1f5f9', fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
                    ✨ What to Expect
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { icon: '🎤', title: 'Keynote Speakers', desc: 'World-renowned experts sharing cutting-edge research and industry insights' },
                      { icon: '📄', title: 'Paper Presentations', desc: 'Peer-reviewed research from leading institutions worldwide' },
                      { icon: '🤝', title: 'Networking', desc: 'Connect with researchers, academics and industry professionals' },
                      { icon: '🏆', title: 'Awards', desc: 'Best paper, best poster and outstanding contribution awards' },
                      { icon: '🎓', title: 'Workshops & Tutorials', desc: 'Hands-on sessions for deep learning and skill development' },
                    ].map(item => (
                      <div key={item.title} style={{
                        display: 'flex', gap: 14, alignItems: 'flex-start',
                        padding: '14px 16px',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)',
                      }}>
                        <span style={{ fontSize: 24, flexShrink: 0 }}>{item.icon}</span>
                        <div>
                          <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{item.title}</div>
                          <div style={{ color: '#64748b', fontSize: 13, lineHeight: 1.5 }}>{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'agenda' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Agenda conference={conference} />
              </motion.div>
            )}

            {activeTab === 'details' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {/* Important Dates */}
                <div style={{
                  background: '#131b2e', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 20, padding: 28, marginBottom: 20,
                }}>
                  <h2 style={{ color: '#f1f5f9', fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
                    📅 Important Dates
                  </h2>
                  {[
                    { label: 'Conference Start', date: conference.start_date, color: '#6366f1', icon: '🚀' },
                    { label: 'Conference End', date: conference.end_date, color: '#0ea5e9', icon: '🏁' },
                    { label: 'CFP Deadline', date: conference.cfp_deadline, color: '#f59e0b', icon: '⏰' },
                  ].filter(d => d.date).map((item, i, arr) => (
                    <div key={item.label} style={{
                      display: 'flex', gap: 16, alignItems: 'center',
                      padding: '16px 0',
                      borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                    }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: `${item.color}20`, border: `1px solid ${item.color}40`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 20, flexShrink: 0,
                      }}>{item.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: '#64748b', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>{item.label}</div>
                        <div style={{ color: '#f1f5f9', fontSize: 16, fontWeight: 700 }}>{formatDate(item.date)}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Location */}
                <div style={{
                  background: '#131b2e', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 20, padding: 28,
                }}>
                  <h2 style={{ color: '#f1f5f9', fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
                    📍 Conference Location
                  </h2>
                  <div style={{
                    display: 'flex', gap: 16, alignItems: 'center',
                    padding: 20, background: 'rgba(255,255,255,0.03)',
                    borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)',
                    marginBottom: 16,
                  }}>
                    <span style={{ fontSize: 48 }}>{flag}</span>
                    <div>
                      <div style={{ color: '#f1f5f9', fontSize: 20, fontWeight: 700 }}>
                        {conference.location || 'Location TBD'}
                      </div>
                      <div style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
                        {conference.location?.toLowerCase().includes('virtual')
                          ? '🌐 Online — accessible worldwide'
                          : '🏨 In-person venue'}
                      </div>
                    </div>
                  </div>
                  {conference.url && (
                    <a href={conference.url} target="_blank" rel="noopener noreferrer" style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '14px 18px',
                      background: 'rgba(99,102,241,0.08)',
                      border: '1px solid rgba(99,102,241,0.2)',
                      borderRadius: 12, textDecoration: 'none',
                      color: '#a5b4fc', fontSize: 14, fontWeight: 500,
                    }}>🔗 {conference.url}</a>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'submit' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div style={{
                  background: '#131b2e', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 20, padding: 28,
                }}>
                  <h2 style={{ color: '#f1f5f9', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
                    📝 Call for Papers
                  </h2>
                  {deadline && !deadline.passed ? (
                    <>
                      <div style={{
                        padding: '16px 20px', borderRadius: 14,
                        background: deadline.bg, border: `1px solid ${deadline.color}40`,
                        marginBottom: 20, marginTop: 16,
                      }}>
                        <div style={{ color: deadline.color, fontWeight: 700, fontSize: 16 }}>
                          ⏰ Deadline: {formatDate(conference.cfp_deadline)}
                        </div>
                        <div style={{ color: deadline.color, fontSize: 13, marginTop: 4, opacity: 0.8 }}>
                          {deadline.text} — Don't miss it!
                        </div>
                      </div>
                      <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
                        We invite researchers to submit original, unpublished work. All submissions will be peer-reviewed.
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {[
                          { icon: '📄', text: 'Full Papers (8–12 pages)' },
                          { icon: '📋', text: 'Short Papers (4–6 pages)' },
                          { icon: '🖼️', text: 'Poster Abstracts (1–2 pages)' },
                          { icon: '💡', text: 'Workshop Proposals' },
                          { icon: '🎓', text: 'PhD Consortium Papers' },
                        ].map(item => (
                          <div key={item.text} style={{
                            display: 'flex', gap: 10, alignItems: 'center',
                            padding: '10px 14px',
                            background: 'rgba(255,255,255,0.02)',
                            borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)',
                            color: '#cbd5e1', fontSize: 14,
                          }}>
                            <span>{item.icon}</span> {item.text}
                          </div>
                        ))}
                      </div>
                      {conference.url && (
                        <a href={conference.url} target="_blank" rel="noopener noreferrer" style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          marginTop: 24, padding: '14px',
                          background: `linear-gradient(135deg, ${catColors.from}, ${catColors.to})`,
                          color: 'white', textDecoration: 'none',
                          borderRadius: 12, fontSize: 15, fontWeight: 700,
                          boxShadow: `0 4px 20px ${catColors.from}50`,
                        }}>Submit Your Paper →</a>
                      )}
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                      <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔒</div>
                      <div style={{ color: '#94a3b8', fontWeight: 600, fontSize: 16 }}>CFP Closed</div>
                      <div style={{ fontSize: 13, marginTop: 8 }}>Submissions are now closed</div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* RIGHT SIDEBAR */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Countdown */}
            {conference.cfp_deadline && (
              <Countdown targetDate={conference.cfp_deadline} />
            )}

            {/* Quick Info */}
            <div style={{
              background: '#131b2e', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 20, overflow: 'hidden',
            }}>
              <div style={{ height: 3, background: `linear-gradient(90deg, ${catColors.from}, ${catColors.to})` }} />
              <div style={{ padding: 20 }}>
                <h3 style={{ color: '#f1f5f9', fontSize: 14, fontWeight: 700, marginBottom: 14 }}>
                  Conference Details
                </h3>
                {[
                  { label: 'Status', value: 'Verified ✅', icon: '🟢' },
                  { label: 'Category', value: conference.category || 'General', icon: '🏷️' },
                  { label: 'Location', value: conference.location || 'TBD', icon: flag },
                  { label: 'Start', value: formatShort(conference.start_date), icon: '📅' },
                  { label: 'End', value: formatShort(conference.end_date), icon: '🏁' },
                  { label: 'Duration', value: getDuration() || 'TBD', icon: '⏱️' },
                  ...(conference.cfp_deadline ? [{ label: 'CFP Deadline', value: formatShort(conference.cfp_deadline), icon: '⏰' }] : []),
                ].map(item => (
                  <div key={item.label} style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', padding: '9px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                  }}>
                    <span style={{ color: '#64748b', fontSize: 12 }}>{item.icon} {item.label}</span>
                    <span style={{ color: '#cbd5e1', fontSize: 12, fontWeight: 500, textAlign: 'right', maxWidth: '55%' }}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Add to Calendar */}
            <AddToCalendar conference={conference} />

            {/* Share */}
            <ShareButtons conference={conference} />

            {/* Website */}
            {conference.url && (
              <a href={conference.url} target="_blank" rel="noopener noreferrer" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '13px',
                background: `linear-gradient(135deg, ${catColors.from}, ${catColors.to})`,
                color: 'white', textDecoration: 'none',
                borderRadius: 14, fontSize: 14, fontWeight: 700,
                boxShadow: `0 4px 20px ${catColors.from}40`,
              }}>🌐 Visit Official Website</a>
            )}

            {/* Manage */}
            {canEdit && (
              <div style={{
                background: '#131b2e', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 20, padding: 16,
              }}>
                <div style={{ color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                  Manage
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Link to={`/edit/${conference.id}`} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '10px', background: 'rgba(99,102,241,0.1)',
                    border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10,
                    color: '#a5b4fc', textDecoration: 'none', fontSize: 13, fontWeight: 600,
                  }}>✏️ Edit Conference</Link>
                  <button onClick={handleDelete} style={{
                    padding: '10px', background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10,
                    color: '#fca5a5', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  }}>🗑️ Delete Conference</button>
                </div>
              </div>
            )}

            {/* Meta */}
            <div style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 14, padding: '12px 14px',
            }}>
              <div style={{ color: '#64748b', fontSize: 12, marginBottom: 4 }}>
                Added by: <span style={{ color: '#94a3b8' }}>{conference.owner_email || 'Unknown'}</span>
              </div>
              <div style={{ color: '#64748b', fontSize: 12 }}>
                Created: {formatDate(conference.created_at)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        @media (max-width: 768px) {
          .detail-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}