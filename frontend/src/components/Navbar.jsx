import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      padding: '0 24px',
      background: scrolled
        ? 'rgba(15, 15, 26, 0.95)'
        : 'rgba(15, 15, 26, 0.7)',
      backdropFilter: 'blur(20px)',
      borderBottom: scrolled ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
      transition: 'all 0.3s ease',
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>

      {/* Logo */}
      <Link to="/" style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        textDecoration: 'none',
      }}>
        <div style={{
          width: 36, height: 36,
          background: 'linear-gradient(135deg, #6366f1, #0ea5e9)',
          borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontWeight: 800, color: 'white',
          boxShadow: '0 0 20px rgba(99,102,241,0.5)',
        }}>E</div>
        <span style={{
          fontSize: 18, fontWeight: 700, color: '#f1f5f9',
          background: 'linear-gradient(135deg, #a5b4fc, #7dd3fc)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>EventDiscovery</span>
      </Link>

      {/* Nav links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {[
          { path: '/', label: '🔭 Conferences' },
          ...(user ? [{ path: '/create', label: '✨ Create' }] : []),
          ...(user ? [{ path: '/profile', label: '👤 Profile' }] : []),
          ...(user?.role === 'admin' ? [{ path: '/admin', label: '⚡ Admin' }] : []),
        ].map(({ path, label }) => (
          <Link key={path} to={path} style={{
            padding: '8px 16px',
            borderRadius: 10,
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 500,
            color: isActive(path) ? '#a5b4fc' : '#94a3b8',
            background: isActive(path)
              ? 'rgba(99,102,241,0.15)'
              : 'transparent',
            border: isActive(path)
              ? '1px solid rgba(99,102,241,0.3)'
              : '1px solid transparent',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            if (!isActive(path)) {
              e.target.style.color = '#f1f5f9';
              e.target.style.background = 'rgba(255,255,255,0.05)';
            }
          }}
          onMouseLeave={e => {
            if (!isActive(path)) {
              e.target.style.color = '#94a3b8';
              e.target.style.background = 'transparent';
            }
          }}>
            {label}
          </Link>
        ))}
      </div>

      {/* Auth */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {user ? (
          <>
            <div style={{
              padding: '6px 14px',
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 100,
              fontSize: 13,
              color: '#a5b4fc',
            }}>
              {user.email?.split('@')[0]}
              {user.role === 'admin' && (
                <span style={{
                  marginLeft: 6, fontSize: 11,
                  background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 700,
                }}>ADMIN</span>
              )}
            </div>
            <button onClick={handleLogout} style={{
              padding: '8px 18px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 10,
              color: '#fca5a5',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.target.style.background = 'rgba(239,68,68,0.2)';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              e.target.style.background = 'rgba(239,68,68,0.1)';
              e.target.style.transform = 'translateY(0)';
            }}>
              Sign Out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={{
              padding: '8px 18px', borderRadius: 10,
              textDecoration: 'none', fontSize: 14,
              color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)',
              transition: 'all 0.2s',
            }}>Login</Link>
            <Link to="/register" className="btn-primary" style={{
              padding: '8px 18px', borderRadius: 10,
              textDecoration: 'none', fontSize: 14,
            }}>Get Started</Link>
          </>
        )}
      </div>
    </nav>
  );
}
