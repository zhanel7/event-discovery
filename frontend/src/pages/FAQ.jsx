import { useState } from 'react'
import { useLang } from '../context/LanguageContext'

const faqs = {
  en: [
    { q: 'What is EventDiscovery?', a: 'EventDiscovery is a platform to find scientific conferences worldwide. You can search by category, location, date and track CFP deadlines.' },
    { q: 'Is it free to use?', a: 'Yes! EventDiscovery is completely free for researchers and academics to browse and find conferences.' },
    { q: 'How do I add a conference?', a: 'Register an account, log in, and click "Create" in the navigation menu. Fill in the conference details and submit.' },
    { q: 'What is CFP?', a: 'CFP stands for "Call for Papers". It is the period when conferences accept paper submissions from researchers.' },
    { q: 'Can I save conferences?', a: 'Yes! Click the heart icon ❤️ on any conference card to save it to your favorites.' },
    { q: 'How do I add to calendar?', a: 'On the conference detail page, click "Add to Calendar" and choose Google Calendar, Outlook, or Yahoo Calendar.' },
    { q: 'Who can edit a conference?', a: 'Only the conference creator or an administrator can edit or delete a conference listing.' },
    { q: 'How do I share a conference?', a: 'On the conference detail page, use the Share buttons to share via WhatsApp, Telegram, Twitter, LinkedIn or copy the link.' },
  ],
  ru: [
    { q: 'Что такое EventDiscovery?', a: 'EventDiscovery — платформа для поиска научных конференций по всему миру. Ищите по категории, месту, дате и отслеживайте дедлайны CFP.' },
    { q: 'Это бесплатно?', a: 'Да! EventDiscovery полностью бесплатен для исследователей и учёных.' },
    { q: 'Как добавить конференцию?', a: 'Зарегистрируйтесь, войдите в систему и нажмите "Создать" в меню навигации.' },
    { q: 'Что такое CFP?', a: 'CFP (Call for Papers) — период приёма статей для конференции.' },
    { q: 'Можно сохранять конференции?', a: 'Да! Нажмите на сердечко ❤️ на карточке конференции чтобы сохранить её.' },
    { q: 'Как добавить в календарь?', a: 'На странице деталей нажмите "В календарь" и выберите Google Calendar, Outlook или Yahoo.' },
    { q: 'Кто может редактировать конференцию?', a: 'Только создатель конференции или администратор могут редактировать или удалять.' },
    { q: 'Как поделиться конференцией?', a: 'Используйте кнопки Share на странице деталей для WhatsApp, Telegram, Twitter, LinkedIn.' },
  ]
}

export default function FAQ() {
  const { lang } = useLang()
  const [open, setOpen] = useState(null)
  const items = faqs[lang]

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', paddingTop: 80, padding: '80px 24px 60px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{
            fontSize: 40, fontWeight: 900, marginBottom: 16,
            background: 'linear-gradient(135deg, #a5b4fc, #7dd3fc)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            {lang === 'en' ? 'Frequently Asked Questions' : 'Частые вопросы'}
          </h1>
          <p style={{ color: '#64748b', fontSize: 16 }}>
            {lang === 'en' ? 'Everything you need to know' : 'Всё что нужно знать'}
          </p>
        </div>

        {items.map((item, i) => (
          <div key={i} style={{
            background: '#131b2e', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14, marginBottom: 10, overflow: 'hidden',
            transition: 'all 0.2s',
          }}>
            <button onClick={() => setOpen(open === i ? null : i)} style={{
              width: '100%', padding: '18px 20px',
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              color: '#f1f5f9', fontSize: 15, fontWeight: 600, textAlign: 'left',
            }}>
              <span>❓ {item.q}</span>
              <span style={{
                fontSize: 18, color: '#6366f1',
                transform: open === i ? 'rotate(45deg)' : 'rotate(0)',
                transition: 'transform 0.2s', flexShrink: 0,
              }}>+</span>
            </button>
            {open === i && (
              <div style={{
                padding: '0 20px 18px',
                color: '#94a3b8', fontSize: 14, lineHeight: 1.7,
                borderTop: '1px solid rgba(255,255,255,0.06)',
                paddingTop: 14,
              }}>{item.a}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}