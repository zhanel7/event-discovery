import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { conferencesAPI } from '../api'

export default function CreateConference() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '', description: '', start_date: '',
    end_date: '', location: '', category: '', cfp_deadline: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (new Date(formData.end_date) <= new Date(formData.start_date)) {
      return setError('End date must be after start date')
    }
    if (formData.cfp_deadline && new Date(formData.cfp_deadline) >= new Date(formData.start_date)) {
      return setError('CFP deadline must be before start date')
    }
    setLoading(true)
    try {
      const data = {
        ...formData,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
        cfp_deadline: formData.cfp_deadline ? new Date(formData.cfp_deadline).toISOString() : null,
      }
      const response = await conferencesAPI.createConference(data)
      navigate(`/conferences/${response.data.id}`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create conference')
    } finally {
      setLoading(false)
    }
  }

  const inp = {
    width: '100%', padding: '12px 16px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12, color: '#f1f5f9', fontSize: 14,
    outline: 'none', fontFamily: 'Inter, sans-serif',
    transition: 'all 0.2s', marginTop: 8,
    colorScheme: 'dark',
  }
  const lbl = {
    fontSize: 12, fontWeight: 600, color: '#94a3b8',
    textTransform: 'uppercase', letterSpacing: 0.5,
  }
  const focus = (e) => {
    e.target.style.borderColor = '#6366f1'
    e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.2)'
    e.target.style.background = 'rgba(99,102,241,0.06)'
  }
  const blur = (e) => {
    e.target.style.borderColor = 'rgba(255,255,255,0.1)'
    e.target.style.boxShadow = 'none'
    e.target.style.background = 'rgba(255,255,255,0.05)'
  }

  const filled = Object.values(formData).filter(v => v).length
  const total = Object.keys(formData).length
  const progress = Math.round((filled / total) * 100)

  return (
    <div style={{
      minHeight: '100vh', background: '#0f0f1a',
      padding: '80px 24px 48px',
      backgroundImage: `radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.12) 0%, transparent 50%)`,
    }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 32, animation: 'fadeInUp 0.5s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, boxShadow: '0 0 20px rgba(99,102,241,0.4)',
            }}>✨</div>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: '#f1f5f9', margin: 0 }}>
                Create New Conference
              </h1>
              <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
                Share a scientific conference with the world
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: 16 }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: 12, color: '#64748b', marginBottom: 6,
            }}>
              <span>Form completion</span>
              <span style={{ color: '#a5b4fc' }}>{progress}%</span>
            </div>
            <div style={{
              height: 4, background: 'rgba(255,255,255,0.08)',
              borderRadius: 100, overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', width: `${progress}%`,
                background: 'linear-gradient(90deg, #6366f1, #0ea5e9)',
                borderRadius: 100, transition: 'width 0.4s ease',
              }}/>
            </div>
          </div>
        </div>

        {/* Form card */}
        <div style={{
          background: '#131b2e',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 24, padding: 36,
          boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
          animation: 'fadeInUp 0.5s ease 0.1s both',
        }}>
          <form onSubmit={handleSubmit}>

            {/* Title */}
            <div style={{ marginBottom: 24 }}>
              <label style={lbl}>📌 Conference Title *</label>
              <input name="title" type="text" required
                value={formData.title} onChange={handleChange}
                placeholder="e.g., ICML 2026 — International Conference on Machine Learning"
                style={inp} onFocus={focus} onBlur={blur}
              />
            </div>

            {/* Description */}
            <div style={{ marginBottom: 24 }}>
              <label style={lbl}>📝 Description</label>
              <textarea name="description" rows={4}
                value={formData.description} onChange={handleChange}
                placeholder="Describe the conference topics, audience, and goals..."
                style={{ ...inp, resize: 'vertical', minHeight: 100 }}
                onFocus={focus} onBlur={blur}
              />
            </div>

            {/* Dates */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              gap: 16, marginBottom: 24,
            }}>
              <div>
                <label style={lbl}>📅 Start Date & Time *</label>
                <input name="start_date" type="datetime-local" required
                  value={formData.start_date} onChange={handleChange}
                  style={inp} onFocus={focus} onBlur={blur}
                />
              </div>
              <div>
                <label style={lbl}>📅 End Date & Time *</label>
                <input name="end_date" type="datetime-local" required
                  value={formData.end_date} onChange={handleChange}
                  style={inp} onFocus={focus} onBlur={blur}
                />
              </div>
            </div>

            {/* Location */}
            <div style={{ marginBottom: 24 }}>
              <label style={lbl}>📍 Location</label>
              <input name="location" type="text"
                value={formData.location} onChange={handleChange}
                placeholder="City, Country or Virtual"
                style={inp} onFocus={focus} onBlur={blur}
              />
            </div>

            {/* Category */}
            <div style={{ marginBottom: 24 }}>
              <label style={lbl}>🏷️ Category</label>
              <input name="category" type="text"
                value={formData.category} onChange={handleChange}
                placeholder="e.g., AI, Computer Science, Physics, Biology"
                style={inp} onFocus={focus} onBlur={blur}
              />
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                {['AI', 'Computer Science', 'Physics', 'Biology', 'Mathematics', 'Medicine'].map(cat => (
                  <button key={cat} type="button"
                    onClick={() => setFormData({ ...formData, category: cat })}
                    style={{
                      padding: '3px 10px', borderRadius: 100, fontSize: 11,
                      fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                      background: formData.category === cat
                        ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${formData.category === cat
                        ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)'}`,
                      color: formData.category === cat ? '#a5b4fc' : '#64748b',
                    }}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* CFP Deadline */}
            <div style={{ marginBottom: 32 }}>
              <label style={lbl}>⏰ CFP Deadline <span style={{ color: '#64748b', textTransform: 'none', fontSize: 11 }}>(optional)</span></label>
              <input name="cfp_deadline" type="datetime-local"
                value={formData.cfp_deadline} onChange={handleChange}
                style={inp} onFocus={focus} onBlur={blur}
              />
              <p style={{ color: '#64748b', fontSize: 12, marginTop: 6 }}>
                Deadline for paper/abstract submissions
              </p>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 12, padding: '12px 16px',
                color: '#fca5a5', fontSize: 14, marginBottom: 24,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                ⚠️ {error}
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" disabled={loading} style={{
                flex: 1, padding: '14px',
                background: loading
                  ? 'rgba(99,102,241,0.4)'
                  : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                border: 'none', borderRadius: 12,
                color: 'white', fontSize: 15, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'Inter, sans-serif',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
                transition: 'all 0.3s',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                {loading ? (
                  <>
                    <div style={{
                      width: 18, height: 18,
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: 'white', borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                    }}/>
                    Creating...
                  </>
                ) : '✨ Create Conference'}
              </button>

              <button type="button" onClick={() => navigate('/')} style={{
                padding: '14px 24px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12, color: '#94a3b8',
                fontSize: 15, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        input[type="datetime-local"]::-webkit-calendar-picker-indicator {
          filter: invert(1) opacity(0.5);
          cursor: pointer;
        }
      `}</style>
    </div>
  )
}