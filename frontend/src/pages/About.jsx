import { useLang } from '../context/LanguageContext'

export default function About() {
  const { lang } = useLang()
  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', paddingTop: 80, padding: '80px 24px 60px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{
            fontSize: 40, fontWeight: 900, marginBottom: 16,
            background: 'linear-gradient(135deg, #a5b4fc, #7dd3fc)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            {lang === 'en' ? 'About EventDiscovery' : 'О нас'}
          </h1>
          <p style={{ color: '#64748b', fontSize: 18, lineHeight: 1.7 }}>
            {lang === 'en'
              ? 'The world\'s leading platform for discovering scientific conferences'
              : 'Ведущая платформа для поиска научных конференций'}
          </p>
        </div>

        {[
          {
            icon: '🎯',
            title: lang === 'en' ? 'Our Mission' : 'Наша миссия',
            text: lang === 'en'
              ? 'EventDiscovery connects researchers, academics and professionals with the most relevant scientific conferences worldwide. We believe knowledge sharing drives progress.'
              : 'EventDiscovery соединяет исследователей, академиков и профессионалов с наиболее актуальными научными конференциями по всему миру.',
          },
          {
            icon: '🌍',
            title: lang === 'en' ? 'Global Reach' : 'Глобальный охват',
            text: lang === 'en'
              ? 'We cover 500+ conferences from 100+ countries across 50+ academic disciplines, from AI and Machine Learning to Medicine and Mathematics.'
              : 'Мы охватываем 500+ конференций из 100+ стран по 50+ академическим дисциплинам.',
          },
          {
            icon: '⚡',
            title: lang === 'en' ? 'Built with Modern Tech' : 'Современные технологии',
            text: lang === 'en'
              ? 'Built with FastAPI, React, PostgreSQL, Redis, Docker and deployed on cloud infrastructure with 99.9% uptime guarantee.'
              : 'Построен на FastAPI, React, PostgreSQL, Redis, Docker с гарантией доступности 99.9%.',
          },
        ].map(item => (
          <div key={item.title} style={{
            background: '#131b2e', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 20, padding: 28, marginBottom: 16,
            display: 'flex', gap: 20,
          }}>
            <span style={{ fontSize: 36, flexShrink: 0 }}>{item.icon}</span>
            <div>
              <h2 style={{ color: '#f1f5f9', fontSize: 20, fontWeight: 700, marginBottom: 10 }}>{item.title}</h2>
              <p style={{ color: '#94a3b8', lineHeight: 1.7 }}>{item.text}</p>
            </div>
          </div>
        ))}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 32 }}>
          {[
            { n: '500+', l: lang === 'en' ? 'Conferences' : 'Конференций' },
            { n: '100+', l: lang === 'en' ? 'Countries' : 'Стран' },
            { n: '50+', l: lang === 'en' ? 'Categories' : 'Категорий' },
            { n: '10K+', l: lang === 'en' ? 'Researchers' : 'Исследователей' },
          ].map(s => (
            <div key={s.l} style={{
              background: '#131b2e', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16, padding: '20px 16px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#a5b4fc' }}>{s.n}</div>
              <div style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}