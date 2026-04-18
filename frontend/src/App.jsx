import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import CreateConference from './pages/CreateConference'
import EditConference from './pages/EditConference'
import Profile from './pages/Profile'
import AdminPanel from './pages/AdminPanel'
import ConferenceDetail from './pages/ConferenceDetail'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{display:'flex',minHeight:'100vh',alignItems:'center',justifyContent:'center',background:'#0f0f1a'}}>
      <div style={{width:40,height:40,border:'3px solid rgba(99,102,241,0.3)',borderTopColor:'#6366f1',borderRadius:'50%',animation:'spin 1s linear infinite'}}/>
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{display:'flex',minHeight:'100vh',alignItems:'center',justifyContent:'center',background:'#0f0f1a'}}>
      <div style={{width:40,height:40,border:'3px solid rgba(99,102,241,0.3)',borderTopColor:'#6366f1',borderRadius:'50%',animation:'spin 1s linear infinite'}}/>
    </div>
  )
  return user && user.role === 'admin' ? children : <Navigate to="/" replace />
}

function App() {
  return (
    <div style={{minHeight:'100vh',background:'#0f0f1a',color:'#f1f5f9'}}>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/conferences/:id" element={<ConferenceDetail />} />
          <Route path="/create" element={<PrivateRoute><CreateConference /></PrivateRoute>} />
          <Route path="/edit/:id" element={<PrivateRoute><EditConference /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App