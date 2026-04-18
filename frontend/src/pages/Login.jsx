import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  if (user) return <Navigate to="/" replace />

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(formData.email, formData.password)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f0f1a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      backgroundImage: `
        radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.15) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 20%, rgba(14,165,233,0.1) 0%, transparent 50%)
      `,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 420,
        animation: 'fadeInUp 0.5s ease forwards',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 64, height: 64,
            background: 'linear-gradient(135deg, #6366f1, #0ea5e9)',
            borderRadius: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: 28, fontWeight: 800, color: 'white',
            boxShadow: '0 0 40px rgba(99,102,241,0.4)',
          }}>E</div>
          <h1 style={{
            fontSize: 28, fontWeight: 800, color: '#f1f5f9', marginBottom: 8,
          }}>Welcome back</h1>
          <p style={{ color: '#64748b', fontSize: 15 }}>
            Sign in to your EventDiscovery account
          </p>
        </div>

        {/* Form card */}
        <div style={{
          background: '#131b2e',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 24,
          padding: 32,
          boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
        }}>
          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: 'block', marginBottom: 8,
                fontSize: 13, fontWeight: 600,
                color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5,
              }}>Email address</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 14, top: '50%',
                  transform: 'translateY(-50%)', fontSize: 16,
                }}>✉️</span>
                <input
                  name="email" type="email" required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  style={{
                    width: '100%', padding: '12px 16px 12px 44px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12, color: '#f1f5f9', fontSize: 15,
                    outline: 'none', transition: 'all 0.2s',
                    fontFamily: 'Inter, sans-serif',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = '#6366f1'
                    e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.2)'
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.1)'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: 'block', marginBottom: 8,
                fontSize: 13, fontWeight: 600,
                color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5,
              }}>Password</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 14, top: '50%',
                  transform: 'translateY(-50%)', fontSize: 16,
                }}>🔒</span>
                <input
                  name="password" type={showPass ? 'text' : 'password'}
                  required minLength={8}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  style={{
                    width: '100%', padding: '12px 44px 12px 44px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12, color: '#f1f5f9', fontSize: 15,
                    outline: 'none', transition: 'all 0.2s',
                    fontFamily: 'Inter, sans-serif',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = '#6366f1'
                    e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.2)'
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.1)'
                    e.target.style.boxShadow = 'none'
                  }}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: 14, top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none',
                    cursor: 'pointer', fontSize: 16, color: '#64748b',
                  }}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 10, padding: '10px 14px',
                color: '#fca5a5', fontSize: 14,
                marginBottom: 20,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                ⚠️ {error}
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '14px',
              background: loading
                ? 'rgba(99,102,241,0.5)'
                : 'linear-gradient(135deg, #6366f1, #4f46e5)',
              border: 'none', borderRadius: 12,
              color: 'white', fontSize: 15, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
              boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 8,
              fontFamily: 'Inter, sans-serif',
            }}
            onMouseEnter={e => {
              if (!loading) e.target.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
            >
              {loading ? (
                <>
                  <div style={{
                    width: 18, height: 18,
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }}/>
                  Signing in...
                </>
              ) : '→ Sign in'}
            </button>
          </form>

          {/* Register link */}
          <div style={{
            textAlign: 'center', marginTop: 24,
            color: '#64748b', fontSize: 14,
          }}>
            Don't have an account?{' '}
            <Link to="/register" style={{
              color: '#a5b4fc', fontWeight: 600,
              textDecoration: 'none',
            }}>
              Create one →
            </Link>
          </div>
        </div>

        {/* Demo credentials */}
        <div style={{
          marginTop: 20,
          background: 'rgba(99,102,241,0.08)',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 12, padding: '12px 16px',
          textAlign: 'center',
        }}>
          <div style={{ color: '#a5b4fc', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
            DEMO CREDENTIALS
          </div>
          <div style={{ color: '#64748b', fontSize: 13 }}>
            admin@example.com / Admin12345
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}