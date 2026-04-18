import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { conferencesAPI, authAPI } from '../api'
import ConferenceCard from '../components/ConferenceCard'

export default function Profile() {
  const { user, checkAuth } = useAuth()
  const [myConferences, setMyConferences] = useState([])
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '', newPassword: '', confirmPassword: '',
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [conferencesLoading, setConferencesLoading] = useState(true)

  useEffect(() => { loadMyConferences() }, [])

  const loadMyConferences = async () => {
    try {
      setConferencesLoading(true)
      const response = await conferencesAPI.getUserConferences()
      setMyConferences(response.data.items || [])
    } catch (err) {
      console.error(err)
    } finally {
      setConferencesLoading(false)
    }
  }

  const validatePassword = (p) => {
    const e = []
    if (p.length < 8) e.push('8+ chars')
    if (!/[A-Z]/.test(p)) e.push('uppercase')
    if (!/[a-z]/.test(p)) e.push('lowercase')
    if (!/\d/.test(p)) e.push('number')
    return e
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setError(''); setMessage('')
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return setError('Passwords do not match')
    }
    const errs = validatePassword(passwordForm.newPassword)
    if (errs.length > 0) return setError(`Need: ${errs.join(', ')}`)
    setLoading(true)
    try {
      await authAPI.changePassword({
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword,
      })
      setMessage('Password updated! ✅')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      await checkAuth()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this conference?')) return
    try {
      await conferencesAPI.deleteConference(id)
      loadMyConferences()
    } catch { alert('Failed to delete') }
  }

  const passErrors = validatePassword(passwordForm.newPassword)
  const passMatch = passwordForm.newPassword && passwordForm.confirmPassword &&
    passwordForm.newPassword === passwordForm.confirmPassword

  const s = {
    section: {
      background: '#131b2e',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 20,
      padding: 32,
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 20, fontWeight: 700, color: '#f1f5f9',
      marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10,
    },
    label: {
      display: 'block', marginBottom: 8,
      fontSize: 12, fontWeight: 600, color: '#64748b',
      textTransform: 'uppercase', letterSpacing: 0.5,
    },
    field: {
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 10, padding: '10px 14px',
      color: '#f1f5f9', fontSize: 15,
    },
    input: {
      width: '100%', padding: '12px 16px',
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 12, color: '#f1f5f9', fontSize: 14,
      outline: 'none', fontFamily: 'Inter, sans-serif',
      transition: 'all 0.2s', marginBottom: 16,
    },
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', padding: '80px 24px 48px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 32, animation: 'fadeInUp 0.5s ease' }}>
          <h1 style={{
            fontSize: 32, fontWeight: 800,
            background: 'linear-gradient(135deg, #a5b4fc, #7dd3fc)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            marginBottom: 8,
          }}>My Profile</h1>
          <p style={{ color: '#64748b' }}>Manage your account and conferences</p>
        </div>

        {/* Profile Info */}
        <div style={s.section}>
          <div style={s.sectionTitle}>
            <span style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
            }}>👤</span>
            Account Information
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div>
              <div style={{ marginBottom: 20 }}>
                <label style={s.label}>✉️ Email Address</label>
                <div style={s.field}>{user?.email}</div>
              </div>
              <div>
                <label style={s.label}>🛡️ Role</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={s.field}>{user?.role}</div>
                  {user?.role === 'admin' && (
                    <span style={{
                      background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                      fontSize: 12, fontWeight: 700,
                    }}>ADMIN</span>
                  )}
                </div>
              </div>
            </div>

            {/* Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 80, height: 80,
                  background: 'linear-gradient(135deg, #6366f1, #0ea5e9)',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 12px',
                  fontSize: 32, fontWeight: 800, color: 'white',
                  boxShadow: '0 0 30px rgba(99,102,241,0.4)',
                }}>
                  {user?.email?.[0]?.toUpperCase() || '?'}
                </div>
                <div style={{ color: '#64748b', fontSize: 13 }}>
                  {user?.email?.split('@')[0]}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div style={s.section}>
          <div style={s.sectionTitle}>
            <span style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
            }}>🔑</span>
            Change Password
          </div>

          <form onSubmit={handlePasswordSubmit} style={{ maxWidth: 420 }}>
            <label style={s.label}>Current Password</label>
            <input
              type="password" name="currentPassword" required
              value={passwordForm.currentPassword}
              onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
              placeholder="Enter current password"
              style={s.input}
              onFocus={e => { e.target.style.borderColor='#6366f1'; e.target.style.boxShadow='0 0 0 3px rgba(99,102,241,0.2)' }}
              onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.1)'; e.target.style.boxShadow='none' }}
            />

            <label style={s.label}>New Password</label>
            <input
              type="password" name="newPassword" required
              value={passwordForm.newPassword}
              onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})}
              placeholder="Min 8 chars, uppercase, number"
              style={s.input}
              onFocus={e => { e.target.style.borderColor='#6366f1'; e.target.style.boxShadow='0 0 0 3px rgba(99,102,241,0.2)' }}
              onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.1)'; e.target.style.boxShadow='none' }}
            />

            {/* Password strength */}
            {passwordForm.newPassword && (
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: 6,
                marginBottom: 16, marginTop: -8,
              }}>
                {[
                  { label: '8+ chars', ok: passwordForm.newPassword.length >= 8 },
                  { label: 'Uppercase', ok: /[A-Z]/.test(passwordForm.newPassword) },
                  { label: 'Lowercase', ok: /[a-z]/.test(passwordForm.newPassword) },
                  { label: 'Number', ok: /\d/.test(passwordForm.newPassword) },
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

            <label style={s.label}>Confirm New Password</label>
            <input
              type="password" name="confirmPassword" required
              value={passwordForm.confirmPassword}
              onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
              placeholder="Repeat new password"
              style={{
                ...s.input,
                borderColor: passwordForm.confirmPassword
                  ? passMatch ? 'rgba(16,185,129,0.5)' : 'rgba(239,68,68,0.5)'
                  : 'rgba(255,255,255,0.1)',
              }}
              onFocus={e => { e.target.style.boxShadow='0 0 0 3px rgba(99,102,241,0.2)' }}
              onBlur={e => { e.target.style.boxShadow='none' }}
            />

            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 10, padding: '10px 14px', color: '#fca5a5',
                fontSize: 13, marginBottom: 16,
              }}>⚠️ {error}</div>
            )}
            {message && (
              <div style={{
                background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
                borderRadius: 10, padding: '10px 14px', color: '#34d399',
                fontSize: 13, marginBottom: 16,
              }}>✅ {message}</div>
            )}

            <button type="submit"
              disabled={loading || !passMatch || passErrors.length > 0}
              style={{
                width: '100%', padding: '12px',
                background: (loading || !passMatch || passErrors.length > 0)
                  ? 'rgba(99,102,241,0.3)'
                  : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                border: 'none', borderRadius: 12,
                color: 'white', fontSize: 14, fontWeight: 700,
                cursor: (loading || !passMatch || passErrors.length > 0) ? 'not-allowed' : 'pointer',
                fontFamily: 'Inter, sans-serif',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
              {loading ? '⏳ Updating...' : '🔑 Update Password'}
            </button>
          </form>
        </div>

        {/* My Conferences */}
        <div style={s.section}>
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', marginBottom: 24,
          }}>
            <div style={s.sectionTitle}>
              <span style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
              }}>📋</span>
              My Conferences
            </div>
            <Link to="/create" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '9px 18px',
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              border: 'none', borderRadius: 10,
              color: 'white', fontSize: 13, fontWeight: 600,
              textDecoration: 'none',
              boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
            }}>+ Create New</Link>
          </div>

          {conferencesLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{
                width: 36, height: 36,
                border: '3px solid rgba(99,102,241,0.3)',
                borderTopColor: '#6366f1',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto',
              }}/>
            </div>
          ) : myConferences.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
              <p style={{ color: '#64748b', marginBottom: 20 }}>
                No conferences yet
              </p>
              <Link to="/create" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '11px 22px',
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                borderRadius: 12, color: 'white', fontSize: 14,
                fontWeight: 600, textDecoration: 'none',
              }}>+ Create Your First Conference</Link>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 20,
            }}>
              {myConferences.map(conf => (
                <ConferenceCard
                  key={conf.id}
                  conference={conf}
                  canEdit={true}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}