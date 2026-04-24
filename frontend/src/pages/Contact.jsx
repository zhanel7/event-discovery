import { useState } from 'react'
import { useLang } from '../context/LanguageContext'

export default function Contact() {
  const { lang } = useLang()
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sent, setSent] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSent(true)
    setTimeout(() => setSent(false), 4000)
    setForm({ name: '', email: '', subject: '', message: '' })
  }

  const inp = {
    width: '100%', padding: '12px 16px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12, color: '#f1f5f9', fontSize: 14,
    outline: 'none', fontFamily: 'Inter, sans-serif',
    transition: 'all 0.2s', marginBottom: 16,
  }

  const lbl = {
    display: 'block', marginBottom: 8,
    fontSize: 12, fontWeight: 600, color: '#94a3b8',
    textTransform: 'uppercase', letterSpacing: 0.5,
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', paddingTop: 80, padding: '80px 24px 60px' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{
            fontSize: 40, fontWeight: 900, marginBottom: 16,
            background: 'linear-gradient(135deg, #a5b4fc, #7dd3fc)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            {lang === 'en' ? 'Contact Us' : 'Связаться с нами'}
          </h1>
          <p style={{ color: '#64748b', fontSize: 16 }}>
            {lang === 'en' ? 'We\'d love to hear from you!' : 'Мы рады вашим сообщениям!'}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          {[
            { icon: '📧', title: 'Email', value: 'support@eventdiscovery.io' },
            { icon: '🐦', title: 'Twitter', value: '@EventDiscovery' },
            { icon: '💼', title: 'LinkedIn', value: 'EventDiscovery' },
            { icon: '📍', title: lang === 'en' ? 'Location' : 'Адрес', value: 'Almaty, Kazakhstan' },
          ].map(item => (
            <div key={item.title} style={{
              background: '#131b2e', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 14, padding: '16px 18px',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span style={{ fontSize: 24 }}>{item.icon}</span>
              <div>
                <div style={{ color: '#64748b', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>{item.title}</div>
                <div style={{ color: '#f1f5f9', fontSize: 13, marginTop: 2 }}>{item.value}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{
          background: '#131b2e', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20, padding: 32,
        }}>
          <h2 style={{ color: '#f1f5f9', fontSize: 20, fontWeight: 700, marginBottom: 24 }}>
            {lang === 'en' ? '💬 Send a Message' : '💬 Написать сообщение'}
          </h2>

          {sent && (
            <div style={{
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
              borderRadius: 12, padding: '12px 16px', color: '#34d399',
              marginBottom: 20, textAlign: 'center', fontWeight: 600,
            }}>
              ✅ {lang === 'en' ? 'Message sent! We\'ll reply soon.' : 'Сообщение отправлено!'}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={lbl}>{lang === 'en' ? 'Your Name' : 'Ваше имя'}</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder={lang === 'en' ? 'John Doe' : 'Иван Иванов'}
                  style={inp}
                  onFocus={e => e.target.style.borderColor = '#6366f1'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>
              <div>
                <label style={lbl}>Email</label>
                <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="your@email.com" style={inp}
                  onFocus={e => e.target.style.borderColor = '#6366f1'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>
            </div>

            <label style={lbl}>{lang === 'en' ? 'Subject' : 'Тема'}</label>
            <input required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
              placeholder={lang === 'en' ? 'How can we help?' : 'Как мы можем помочь?'}
              style={inp}
              onFocus={e => e.target.style.borderColor = '#6366f1'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />

            <label style={lbl}>{lang === 'en' ? 'Message' : 'Сообщение'}</label>
            <textarea required rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
              placeholder={lang === 'en' ? 'Tell us more...' : 'Расскажите подробнее...'}
              style={{ ...inp, resize: 'vertical', minHeight: 120 }}
              onFocus={e => e.target.style.borderColor = '#6366f1'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />

            <button type="submit" style={{
              width: '100%', padding: '13px',
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              border: 'none', borderRadius: 12,
              color: 'white', fontSize: 15, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              boxShadow: '0 4px 20px rgba(99,102,241,0.3)',
            }}>
              {lang === 'en' ? '📨 Send Message' : '📨 Отправить'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}