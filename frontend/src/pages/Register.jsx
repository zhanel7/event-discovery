import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'

export default function Register() {
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const { t, lang } = useLang()
  const [formData, setFormData] = useState({ email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  if (user) return <Navigate to="/" replace />

  const validate = (p) => ({
    length: p.length >= 8,
    upper: /[A-Z]/.test(p),
    lower: /[a-z]/.test(p),
    digit: /\d/.test(p),
  })

  const checks = validate(formData.password)
  const allValid = Object.values(checks).every(Boolean)
  const passMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!passMatch) return setError('Passwords do not match')
    if (!allValid) return setError('Password requirements not met')
    setLoading(true)
    try {
      await register(formData.email, formData.password)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const inp = {
    width: '100%', padding: '12px 16px 12px 44px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12, color: '#f1f5f9', fontSize: 14,
    outline: 'none', fontFamily: 'Inter, sans-serif', transition: 'all 0.2s',
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0f0f1a',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
      backgroundImage: `radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.15) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 20%, rgba(14,165,233,0.1) 0%, transparent 50%)`,
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64,
            background: 'linear-gradient(135deg, #6366f1, #0ea5e9)',
            borderRadius: 18, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: 28, fontWeight: 800, color: 'white',
            boxShadow: '0 0 40px rgba(99,102,241,0.4)',
          }}>E</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#f1f5f9', marginBottom: 6 }}>
            {lang === 'en' ? 'Create Account' : 'Регистрация'}
          </h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>
            {lang === 'en' ? 'Join 10,000+ researchers worldwide' : 'Присоединяйтесь к 10,000+ исследователям'}
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: '#131b2e',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 24, padding: 32,
          boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
        }}>
          <form onSubmit={handleSubmit}>

            {/* Email */}
            <div style={{ marginBottom: 18 }}>
              <label style={{
                display: 'block', marginBottom: 8,
                fontSize: 12, fontWeight: 600, color: '#94a3b8',
                textTransform: 'uppercase', letterSpacing: 0.5,
              }}>
                {lang === 'en' ? 'Email Address' : 'Email адрес'}
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>✉️</span>
                <input
                  type="email" required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your@email.com"
                  style={inp}
                  onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.2)' }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none' }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 18 }}>
              <label style={{
                display: 'block', marginBottom: 8,
                fontSize: 12, fontWeight: 600, color: '#94a3b8',
                textTransform: 'uppercase', letterSpacing: 0.5,
              }}>
                {lang === 'en' ? 'Password' : 'Пароль'}
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>🔒</span>
                <input
                  type={showPass ? 'text' : 'password'} required
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Min 8 chars, A-z, 0-9"
                  style={{ ...inp, paddingRight: 44 }}
                  onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.2)' }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none' }}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: 16,
                }}>{showPass ? '🙈' : '👁️'}</button>
              </div>

              {formData.password && (
                <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                  {[
                    { label: '8+ chars', ok: checks.length },
                    { label: 'A-Z', ok: checks.upper },
                    { label: 'a-z', ok: checks.lower },
                    { label: '0-9', ok: checks.digit },
                  ].map(({ label, ok }) => (
                    <span key={label} style={{
                      padding: '2px 8px', borderRadius: 100, fontSize: 11, fontWeight: 600,
                      background: ok ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.1)',
                      color: ok ? '#34d399' : '#f87171',
                      border: `1px solid ${ok ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.2)'}`,
                    }}>
                      {ok ? '✓' : '✗'} {label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: 'block', marginBottom: 8,
                fontSize: 12, fontWeight: 600, color: '#94a3b8',
                textTransform: 'uppercase', letterSpacing: 0.5,
              }}>
                {lang === 'en' ? 'Confirm Password' : 'Подтвердите пароль'}
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>
                  {passMatch ? '✅' : '🔒'}
                </span>
                <input
                  type="password" required
                  value={formData.confirmPassword}
                  onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder={lang === 'en' ? 'Repeat password' : 'Повторите пароль'}
                  style={{
                    ...inp,
                    borderColor: formData.confirmPassword
                      ? passMatch ? 'rgba(16,185,129,0.5)' : 'rgba(239,68,68,0.5)'
                      : 'rgba(255,255,255,0.1)',
                  }}
                  onFocus={e => e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.2)'}
                  onBlur={e => e.target.style.boxShadow = 'none'}
                />
              </div>
            </div>

            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 10, padding: '10px 14px',
                color: '#fca5a5', fontSize: 13, marginBottom: 20,
              }}>⚠️ {error}</div>
            )}

            <button type="submit" disabled={loading || !passMatch || !allValid} style={{
              width: '100%', padding: '13px',
              background: (loading || !passMatch || !allValid)
                ? 'rgba(99,102,241,0.3)'
                : 'linear-gradient(135deg, #6366f1, #4f46e5)',
              border: 'none', borderRadius: 12,
              color: 'white', fontSize: 15, fontWeight: 700,
              cursor: (loading || !passMatch || !allValid) ? 'not-allowed' : 'pointer',
              fontFamily: 'Inter, sans-serif',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 4px 20px rgba(99,102,241,0.3)',
              transition: 'all 0.2s',
            }}>
              {loading ? (
                <>
                  <div style={{
                    width: 18, height: 18,
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white', borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }} />
                  {lang === 'en' ? 'Creating...' : 'Создаём...'}
                </>
              ) : `🚀 ${lang === 'en' ? 'Create Account' : 'Создать аккаунт'}`}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 20, color: '#64748b', fontSize: 14 }}>
            {lang === 'en' ? 'Already have an account?' : 'Уже есть аккаунт?'}{' '}
            <Link to="/login" style={{ color: '#a5b4fc', fontWeight: 600, textDecoration: 'none' }}>
              {lang === 'en' ? 'Sign in →' : 'Войти →'}
            </Link>
          </div>
        </div>

        {/* Benefits */}
        <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { icon: '🎓', text: '500+ Conferences' },
            { icon: '🌍', text: '100+ Countries' },
            { icon: '🔔', text: 'Deadline alerts' },
            { icon: '🆓', text: 'Free forever' },
          ].map(item => (
            <div key={item.text} style={{
              padding: '10px 14px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', gap: 8,
              color: '#64748b', fontSize: 12,
            }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.text}
            </div>
          ))}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}