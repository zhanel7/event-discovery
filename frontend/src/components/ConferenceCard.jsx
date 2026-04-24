import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';

const CATEGORY_STYLES = {
  'AI': { color: '#a78bfa', bg: 'rgba(167,139,250,0.15)', icon: '🤖' },
  'Machine Learning': { color: '#818cf8', bg: 'rgba(129,140,248,0.15)', icon: '🧠' },
  'Computer Science': { color: '#60a5fa', bg: 'rgba(96,165,250,0.15)', icon: '💻' },
  'Data Science': { color: '#34d399', bg: 'rgba(52,211,153,0.15)', icon: '📊' },
  'Physics': { color: '#f472b6', bg: 'rgba(244,114,182,0.15)', icon: '⚛️' },
  'Biology': { color: '#4ade80', bg: 'rgba(74,222,128,0.15)', icon: '🧬' },
  'Mathematics': { color: '#fb923c', bg: 'rgba(251,146,60,0.15)', icon: '📐' },
  'Medicine': { color: '#f87171', bg: 'rgba(248,113,113,0.15)', icon: '🏥' },
  'Chemistry': { color: '#fbbf24', bg: 'rgba(251,191,36,0.15)', icon: '⚗️' },
  'Engineering': { color: '#38bdf8', bg: 'rgba(56,189,248,0.15)', icon: '⚙️' },
  'Security': { color: '#ef4444', bg: 'rgba(239,68,68,0.15)', icon: '🔒' },
  'Web Development': { color: '#06b6d4', bg: 'rgba(6,182,212,0.15)', icon: '🌐' },
  'Python': { color: '#facc15', bg: 'rgba(250,204,21,0.15)', icon: '🐍' },
  'default': { color: '#94a3b8', bg: 'rgba(148,163,184,0.15)', icon: '🎓' },
};

const COUNTRY_FLAGS = {
  'USA': '🇺🇸', 'United States': '🇺🇸', 'UK': '🇬🇧', 'United Kingdom': '🇬🇧',
  'Germany': '🇩🇪', 'France': '🇫🇷', 'Canada': '🇨🇦', 'Australia': '🇦🇺',
  'Japan': '🇯🇵', 'China': '🇨🇳', 'India': '🇮🇳', 'Brazil': '🇧🇷',
  'Austria': '🇦🇹', 'Netherlands': '🇳🇱', 'Switzerland': '🇨🇭',
  'Singapore': '🇸🇬', 'Spain': '🇪🇸', 'Italy': '🇮🇹', 'Korea': '🇰🇷',
  'Virtual': '🌐', 'Online': '🌐',
};

function getFlag(location) {
  if (!location) return '📍';
  for (const [country, flag] of Object.entries(COUNTRY_FLAGS)) {
    if (location.includes(country)) return flag;
  }
  return '📍';
}

export default function ConferenceCard({ conference, canEdit, onDelete }) {
  const [liked, setLiked] = useState(() => {
    const saved = localStorage.getItem('liked_conferences');
    return saved ? JSON.parse(saved).includes(conference.id) : false;
  });

  const toggleLike = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const saved = JSON.parse(localStorage.getItem('liked_conferences') || '[]');
    const newSaved = liked
      ? saved.filter(id => id !== conference.id)
      : [...saved, conference.id];
    localStorage.setItem('liked_conferences', JSON.stringify(newSaved));
    setLiked(!liked);
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  }) : 'TBD';

  const getDeadline = () => {
    if (!conference.cfp_deadline) return null;
    const days = Math.ceil((new Date(conference.cfp_deadline) - new Date()) / 86400000);
    if (days < 0) return { text: 'Closed', color: '#64748b', bg: 'rgba(100,116,139,0.1)' };
    if (days === 0) return { text: 'Due today!', color: '#ef4444', bg: 'rgba(239,68,68,0.15)', urgent: true };
    if (days <= 7) return { text: `${days}d left`, color: '#ef4444', bg: 'rgba(239,68,68,0.15)', urgent: true };
    if (days <= 30) return { text: `${days}d left`, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' };
    return { text: `${days}d left`, color: '#10b981', bg: 'rgba(16,185,129,0.15)' };
  };

  const deadline = getDeadline();
  const catStyle = CATEGORY_STYLES[conference.category] || CATEGORY_STYLES.default;
  const flag = getFlag(conference.location);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      style={{
        background: '#131b2e',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 20,
        overflow: 'hidden',
        position: 'relative',
        transition: 'box-shadow 0.3s',
        cursor: 'pointer',
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,0.5)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      {/* Top gradient bar */}
      <div style={{
        height: 4,
        background: `linear-gradient(90deg, ${catStyle.color}, transparent)`,
      }} />

      {/* Like button */}
      <button onClick={toggleLike} style={{
        position: 'absolute', top: 16, right: 16,
        background: liked ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${liked ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '50%', width: 36, height: 36,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', fontSize: 16, zIndex: 2,
        transition: 'all 0.2s',
      }}>
        {liked ? '❤️' : '🤍'}
      </button>

      <div style={{ padding: '20px 20px 0' }}>
        {/* Category + Deadline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <span style={{
            padding: '3px 10px', borderRadius: 100,
            fontSize: 11, fontWeight: 700,
            color: catStyle.color, background: catStyle.bg,
            border: `1px solid ${catStyle.color}40`,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            {catStyle.icon} {conference.category || 'General'}
          </span>
          {deadline && (
            <span style={{
              padding: '3px 10px', borderRadius: 100,
              fontSize: 11, fontWeight: 700,
              color: deadline.color, background: deadline.bg,
              animation: deadline.urgent ? 'pulse 2s infinite' : 'none',
            }}>
              ⏰ CFP: {deadline.text}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 style={{
          fontSize: 17, fontWeight: 700, color: '#f1f5f9',
          marginBottom: 8, lineHeight: 1.3,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {conference.title}
        </h3>

        {/* Description */}
        <p style={{
          fontSize: 13, color: '#64748b', marginBottom: 16,
          lineHeight: 1.5, display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {conference.description || 'No description available'}
        </p>

        {/* Location + Dates */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 12, padding: '12px 14px',
          marginBottom: 16,
          border: '1px solid rgba(255,255,255,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 16 }}>{flag}</span>
            <span style={{ fontSize: 13, color: '#cbd5e1', fontWeight: 500 }}>
              {conference.location || 'Location TBD'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14 }}>📅</span>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              {formatDate(conference.start_date)} — {formatDate(conference.end_date)}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding: '0 20px 20px', display: 'flex', gap: 8 }}>
        <Link
          to={`/conferences/${conference.id}`}
          style={{
            flex: 1, padding: '10px',
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            color: 'white', textDecoration: 'none',
            borderRadius: 10, fontSize: 13, fontWeight: 600,
            textAlign: 'center', transition: 'all 0.2s',
            boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          View Details →
        </Link>
        {canEdit && (
          <button
            onClick={() => onDelete(conference.id)}
            style={{
              padding: '10px 14px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 10, color: '#fca5a5',
              cursor: 'pointer', fontSize: 13,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
          >
            🗑️
          </button>
        )}
      </div>
    </motion.div>
  );
}