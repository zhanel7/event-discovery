import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { useState, useEffect, useRef } from 'react'

const CATEGORIES = [
  { label: 'AI Conferences', icon: '🤖', cat: 'AI' },
  { label: 'Machine Learning', icon: '🧠', cat: 'Machine Learning' },
  { label: 'Computer Science', icon: '💻', cat: 'Computer Science' },
  { label: 'Data Science', icon: '📊', cat: 'Data Science' },
  { label: 'Security', icon: '🔒', cat: 'Security' },
  { label: 'Web Development', icon: '🌍', cat: 'Web Development' },
  { label: 'Physics', icon: '⚛️', cat: 'Physics' },
  { label: 'Biology', icon: '🧬', cat: 'Biology' },
  { label: 'Mathematics', icon: '📐', cat: 'Mathematics' },
  { label: 'Medicine', icon: '🏥', cat: 'Medicine' },
  { label: 'Engineering', icon: '⚙️', cat: 'Engineering' },
  { label: 'Chemistry', icon: '⚗️', cat: 'Chemistry' },
  { label: 'Python', icon: '🐍', cat: 'Python' },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const { lang, toggleLang, t } = useLang()
  const location = useLocation()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogout = async () => { await logout(); navigate('/login') }
  const isActive = (path) => location.pathname === path

  const navLink = (path, label) => (
    <Link key={path} to={path} style={{
      padding: '8px 14px', borderRadius: 10,
      textDecoration: 'none', fontSize: 14, fontWeight: 500,
      color: isActive(path) ? '#a5b4fc' : '#94a3b8',
      background: isActive(path) ? 'rgba(99,102,241,0.15)' : 'transparent',
      border: isActive(path) ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
      transition: 'all 0.2s', whiteSpace: 'nowrap',
    }}
    onMouseEnter={e => { if (!isActive(path)) { e.currentTarget.style.color = '#f1f5f9'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}}
    onMouseLeave={e => { if (!isActive(path)) { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'transparent' }}}>
      {label}
    </Link>
  )

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      padding: '0 20px',
      background: scrolled ? 'rgba(15,15,26,0.97)' : 'rgba(15,15,26,0.85)',
      backdropFilter: 'blur(20px)',
      borderBottom: scrolled ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
      transition: 'all 0.3s', height: 64,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 12,
    }}>

      {/* Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
        <div style={{
          width: 34, height: 34,
          background: 'linear-gradient(135deg, #6366f1, #0ea5e9)',
          borderRadius: 9, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 17, fontWeight: 800,
          color: 'white', boxShadow: '0 0 15px rgba(99,102,241,0.4)',
        }}>E</div>
        <span style={{
          fontSize: 16, fontWeight: 700,
          background: 'linear-gradient(135deg, #a5b4fc, #7dd3fc)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          whiteSpace: 'nowrap',
        }}>EventDiscovery</span>
      </Link>

      {/* Center nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, justifyContent: 'center', flexWrap: 'nowrap' }}>

        {/* Home */}
        {navLink('/', `🏠 ${t.home}`)}

        {/* Conferences dropdown */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button onClick={() => setDropdownOpen(!dropdownOpen)} style={{
            padding: '8px 14px', borderRadius: 10,
            background: dropdownOpen ? 'rgba(99,102,241,0.15)' : 'transparent',
            border: dropdownOpen ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
            color: dropdownOpen ? '#a5b4fc' : '#94a3b8',
            cursor: 'pointer', fontSize: 14, fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: 5,
            transition: 'all 0.2s', whiteSpace: 'nowrap',
          }}>
            🔭 {t.conferences}
            <span style={{
              fontSize: 9, display: 'inline-block',
              transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)',
              transition: 'transform 0.2s',
            }}>▼</span>
          </button>

          {dropdownOpen && (
            <div style={{
              position: 'absolute', top: '100%', left: 0,
              marginTop: 8, width: 240,
              background: '#1a2035',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 16, overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)', zIndex: 1000,
            }}>
              <div style={{
                padding: '10px 14px',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(14,165,233,0.1))',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                fontSize: 11, fontWeight: 700, color: '#a5b4fc',
                textTransform: 'uppercase', letterSpacing: 0.5,
              }}>Browse by Category</div>

              <Link to="/" onClick={() => setDropdownOpen(false)} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px', textDecoration: 'none',
                color: '#f1f5f9', fontSize: 13, fontWeight: 600,
                background: 'rgba(99,102,241,0.08)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}>
                <span>🌍</span> All Conferences
              </Link>

              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {CATEGORIES.map(cat => (
                  <Link key={cat.cat}
                    to={`/category/${encodeURIComponent(cat.cat)}`}
                    onClick={() => setDropdownOpen(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '9px 14px', textDecoration: 'none',
                      color: '#94a3b8', fontSize: 13,
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#f1f5f9' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8' }}
                  >
                    <span style={{ fontSize: 15 }}>{cat.icon}</span>
                    {cat.label}
                    <span style={{ marginLeft: 'auto', color: '#475569', fontSize: 11 }}>›</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Static pages */}
        {navLink('/about', `ℹ️ ${t.about}`)}
        {navLink('/faq', `❓ ${t.faq}`)}
        {navLink('/contact', `📧 ${t.contact}`)}

        {/* Auth nav links */}
        {user && navLink('/create', `✨ ${t.create}`)}
        {user && navLink('/profile', `👤 ${t.profile}`)}
        {user?.role === 'admin' && navLink('/admin', `⚡ ${t.admin}`)}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>

        {/* Language toggle */}
        <button onClick={toggleLang} style={{
          padding: '6px 12px',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 100, cursor: 'pointer',
          fontSize: 12, fontWeight: 700,
          color: '#a5b4fc', transition: 'all 0.2s',
          display: 'flex', alignItems: 'center', gap: 4,
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.15)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
        >
          {lang === 'en' ? '🇷🇺 RU' : '🇬🇧 EN'}
        </button>

        {/* Auth buttons */}
        {user ? (
          <>
            <div style={{
              padding: '5px 12px',
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 100, fontSize: 12, color: '#a5b4fc',
            }}>
              {user.email?.split('@')[0]}
              {user.role === 'admin' && (
                <span style={{
                  marginLeft: 5, fontSize: 9,
                  background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  fontWeight: 700,
                }}>ADMIN</span>
              )}
            </div>
            <button onClick={handleLogout} style={{
              padding: '7px 14px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 10, color: '#fca5a5',
              cursor: 'pointer', fontSize: 12, fontWeight: 500,
              transition: 'all 0.2s', whiteSpace: 'nowrap',
            }}>
              {t.logout}
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={{
              padding: '7px 14px', borderRadius: 10,
              textDecoration: 'none', fontSize: 13,
              color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)',
              whiteSpace: 'nowrap',
            }}>{t.login}</Link>
            <Link to="/register" style={{
              padding: '7px 14px', borderRadius: 10,
              textDecoration: 'none', fontSize: 13,
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              color: 'white', fontWeight: 600,
              boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
              whiteSpace: 'nowrap',
            }}>{t.getStarted}</Link>
          </>
        )}
      </div>
    </nav>
  )
}