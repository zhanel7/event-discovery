import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { conferencesAPI } from '../api'

export default function ConferenceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [conference, setConference] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadConference()
  }, [id])

  const loadConference = async () => {
    try {
      setLoading(true)
      const response = await conferencesAPI.getConference(id)
      setConference(response.data)
    } catch (err) {
      setError('Conference not found')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this conference?')) return
    try {
      await conferencesAPI.deleteConference(id)
      navigate('/')
    } catch {
      alert('Failed to delete')
    }
  }

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  }) : '—'

  const getDeadlineInfo = (deadline) => {
    if (!deadline) return null
    const days = Math.ceil((new Date(deadline) - new Date()) / 86400000)
    if (days < 0) return { text: 'Deadline passed', cls: 'deadline-passed' }
    if (days === 0) return { text: 'Due today!', cls: 'deadline-urgent' }
    if (days <= 7) return { text: `${days} days left`, cls: 'deadline-urgent' }
    if (days <= 30) return { text: `${days} days left`, cls: 'deadline-soon' }
    return { text: `${days} days left`, cls: 'deadline-ok' }
  }

  const canEdit = user && conference && (
    user.role === 'admin' || user.id === conference.owner_id
  )

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh'}}>
      <div style={{width:48,height:48,border:'3px solid rgba(99,102,241,0.3)',borderTopColor:'#6366f1',borderRadius:'50%',animation:'spin 1s linear infinite'}}/>
    </div>
  )

  if (error || !conference) return (
    <div style={{textAlign:'center',padding:'80px 24px'}}>
      <div style={{fontSize:'4rem',marginBottom:16}}>😔</div>
      <h2 style={{color:'#f1f5f9',marginBottom:8}}>Conference not found</h2>
      <Link to="/" className="btn btn-primary" style={{marginTop:16}}>← Back to list</Link>
    </div>
  )

  const deadline = getDeadlineInfo(conference.cfp_deadline)

  return (
    <div style={{minHeight:'100vh',padding:'80px 24px 48px'}}>
      <div style={{maxWidth:900,margin:'0 auto'}}>

        {/* Back button */}
        <Link to="/" style={{
          display:'inline-flex',alignItems:'center',gap:8,
          color:'#94a3b8',fontSize:14,marginBottom:32,
          transition:'color 0.2s'
        }}
        onMouseEnter={e=>e.currentTarget.style.color='#f1f5f9'}
        onMouseLeave={e=>e.currentTarget.style.color='#94a3b8'}>
          ← Back to conferences
        </Link>

        {/* Hero */}
        <div style={{
          background:'linear-gradient(135deg, #131b2e 0%, #1a1f3a 100%)',
          border:'1px solid rgba(99,102,241,0.2)',
          borderRadius:24,padding:'40px 48px',marginBottom:24,
          position:'relative',overflow:'hidden'
        }}>
          <div style={{
            position:'absolute',top:-60,right:-60,
            width:200,height:200,
            background:'radial-gradient(circle, rgba(99,102,241,0.15), transparent)',
            borderRadius:'50%'
          }}/>
          
          {/* Category & deadline */}
          <div style={{display:'flex',gap:10,marginBottom:20,flexWrap:'wrap'}}>
            {conference.category && (
              <span className="badge badge-purple">{conference.category}</span>
            )}
            {deadline && (
              <span className={deadline.cls} style={{fontSize:13,fontWeight:600}}>
                ⏰ CFP: {deadline.text}
              </span>
            )}
          </div>

          <h1 style={{
            fontSize:'clamp(1.6rem,4vw,2.4rem)',
            fontWeight:800,color:'#f1f5f9',
            lineHeight:1.2,marginBottom:16
          }}>
            {conference.title}
          </h1>

          {conference.description && (
            <p style={{color:'#94a3b8',fontSize:16,lineHeight:1.7,marginBottom:24}}>
              {conference.description}
            </p>
          )}

          {/* Action buttons */}
          {canEdit && (
            <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
              <Link
                to={`/edit/${conference.id}`}
                className="btn btn-secondary"
              >
                ✏️ Edit
              </Link>
              <button onClick={handleDelete} className="btn btn-danger">
                🗑️ Delete
              </button>
            </div>
          )}
        </div>

        {/* Info grid */}
        <div style={{
          display:'grid',
          gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))',
          gap:16,marginBottom:24
        }}>
          {/* Dates */}
          <div style={{
            background:'#131b2e',border:'1px solid rgba(255,255,255,0.08)',
            borderRadius:16,padding:24
          }}>
            <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',
              letterSpacing:1,color:'#6366f1',marginBottom:12}}>
              📅 Conference Dates
            </div>
            <div style={{color:'#f1f5f9',fontWeight:600,fontSize:15}}>
              {formatDate(conference.start_date)}
            </div>
            <div style={{color:'#64748b',fontSize:13,margin:'4px 0'}}>to</div>
            <div style={{color:'#f1f5f9',fontWeight:600,fontSize:15}}>
              {formatDate(conference.end_date)}
            </div>
          </div>

          {/* Location */}
          {conference.location && (
            <div style={{
              background:'#131b2e',border:'1px solid rgba(255,255,255,0.08)',
              borderRadius:16,padding:24
            }}>
              <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',
                letterSpacing:1,color:'#0ea5e9',marginBottom:12}}>
                📍 Location
              </div>
              <div style={{color:'#f1f5f9',fontWeight:600,fontSize:15}}>
                {conference.location}
              </div>
            </div>
          )}

          {/* CFP Deadline */}
          {conference.cfp_deadline && (
            <div style={{
              background:'#131b2e',border:'1px solid rgba(255,255,255,0.08)',
              borderRadius:16,padding:24
            }}>
              <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',
                letterSpacing:1,color:'#f59e0b',marginBottom:12}}>
                ⏰ CFP Deadline
              </div>
              <div style={{color:'#f1f5f9',fontWeight:600,fontSize:15}}>
                {formatDate(conference.cfp_deadline)}
              </div>
              {deadline && (
                <div className={deadline.cls} style={{fontSize:13,marginTop:6}}>
                  {deadline.text}
                </div>
              )}
            </div>
          )}

          {/* Website */}
          {conference.url && (
            <div style={{
              background:'#131b2e',border:'1px solid rgba(255,255,255,0.08)',
              borderRadius:16,padding:24
            }}>
              <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',
                letterSpacing:1,color:'#10b981',marginBottom:12}}>
                🔗 Website
              </div>
              <a href={conference.url} target="_blank" rel="noopener noreferrer"
                style={{color:'#6ee7b7',fontSize:14,wordBreak:'break-all'}}>
                {conference.url}
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          background:'#131b2e',border:'1px solid rgba(255,255,255,0.06)',
          borderRadius:16,padding:'16px 24px',
          display:'flex',justifyContent:'space-between',
          alignItems:'center',flexWrap:'wrap',gap:8
        }}>
          <span style={{color:'#64748b',fontSize:13}}>
            Added by: <span style={{color:'#94a3b8'}}>
              {conference.owner_email || 'Unknown'}
            </span>
          </span>
          <span style={{color:'#64748b',fontSize:13}}>
            Created: {formatDate(conference.created_at)}
          </span>
        </div>

      </div>
    </div>
  )
}