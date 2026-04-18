import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function ConferenceCard({ conference, canEdit, onDelete }) {
  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getCategoryBadge = (category) => {
    const badges = {
      'Computer Science': 'badge-cs',
      'AI': 'badge-ai',
      'Physics': 'badge-physics',
      'Biology': 'badge-bio',
      'Mathematics': 'badge-math',
    };
    return badges[category] || 'badge-default';
  };

  const getDeadlineStatus = () => {
    if (!conference.cfp_deadline) return null;
    const deadline = new Date(conference.cfp_deadline);
    const now = new Date();
    const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return { text: 'Closed', color: '#ef4444' };
    if (daysLeft <= 7) return { text: `${daysLeft}d left`, color: '#ef4444', urgent: true };
    if (daysLeft <= 30) return { text: `${daysLeft}d left`, color: '#f59e0b' };
    return { text: `${daysLeft}d left`, color: '#10b981' };
  };

  const deadlineStatus = getDeadlineStatus();

  return (
    <motion.div
      className="card animate-in"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -4 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className={`badge ${getCategoryBadge(conference.category)}`}>
            {conference.category || 'General'}
          </span>
          {deadlineStatus && (
            <span style={{
              fontSize: '11px',
              color: deadlineStatus.color,
              fontWeight: 600,
              animation: deadlineStatus.urgent ? 'pulse-glow 2s infinite' : 'none',
            }}>
              {deadlineStatus.text}
            </span>
          )}
        </div>
      </div>

      <h3 style={{
        fontSize: '18px',
        fontWeight: 700,
        color: '#f1f5f9',
        marginBottom: '8px',
        lineHeight: 1.3,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {conference.title}
      </h3>

      <p style={{
        fontSize: '14px',
        color: '#94a3b8',
        marginBottom: '16px',
        lineHeight: 1.4,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {conference.description || 'No description available'}
      </p>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span style={{ fontSize: '13px', color: '#94a3b8' }}>📍</span>
          <span style={{ fontSize: '13px', color: '#f1f5f9' }}>
            {conference.location || 'Location TBD'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: '#94a3b8' }}>📅</span>
          <span style={{ fontSize: '13px', color: '#f1f5f9' }}>
            {formatDate(conference.start_date)} - {formatDate(conference.end_date)}
          </span>
        </div>
      </div>

      <Link
        to={`/conferences/${conference.id}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          padding: '10px 20px',
          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '10px',
          fontSize: '14px',
          fontWeight: 600,
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 15px rgba(99,102,241,0.4)',
        }}
        onMouseEnter={e => {
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0 8px 25px rgba(99,102,241,0.6)';
        }}
        onMouseLeave={e => {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = '0 4px 15px rgba(99,102,241,0.4)';
        }}
      >
        View Details →
      </Link>
    </motion.div>
  );
}
