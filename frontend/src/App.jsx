import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Login from './components/Login'
import StudentLogin from './components/StudentLogin'
import WelcomePage from './components/WelcomePage'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import Students from './components/Students'
import Academic from './components/Academic'
import Timetable from './components/Timetable'
import Messages from './components/Messages'
import News from './components/News'
import Sports from './components/Sports'
import Assignments from './components/Assignments'
import Finance from './components/Finance'
import StudentPortal from './components/StudentPortal'

function AdminRoute({ children }) {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
  const navigate = useNavigate()
  
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])
  
  if (isAuthenticated) return null
  
  return children
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true'
  })
  const [showWelcome, setShowWelcome] = useState(() => {
    return localStorage.getItem('schoolInfo') === null
  })
  const [studentUser, setStudentUser] = useState(() => {
    const saved = localStorage.getItem('studentUser')
    return saved ? JSON.parse(saved) : null
  })

  useEffect(() => {
    localStorage.setItem('isAuthenticated', isAuthenticated)
  }, [isAuthenticated])

  const handleLogin = () => {
    setIsAuthenticated(true)
    if (!localStorage.getItem('schoolInfo')) {
      setShowWelcome(true)
    }
  }

  const handleWelcomeContinue = () => {
    setShowWelcome(false)
  }

  const handleStudentLogin = (user) => {
    setStudentUser(user)
  }

  const handleStudentLogout = () => {
    setStudentUser(null)
    localStorage.removeItem('studentUser')
  }

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('user')
    setIsAuthenticated(false)
    window.location.href = '/login'
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Student routes */}
        <Route path="/" element={
          isAuthenticated ? <Navigate to="/dashboard" /> : (
            studentUser ? <Navigate to="/student-portal" /> : <StudentLogin onLogin={handleStudentLogin} />
          )
        } />
        <Route path="/student-login" element={
          studentUser ? <Navigate to="/student-portal" /> : <StudentLogin onLogin={handleStudentLogin} />
        } />
        <Route path="/student-portal" element={
          studentUser ? <StudentPortal student={studentUser} onLogout={handleStudentLogout} /> : <Navigate to="/" />
        } />
        <Route path="/login" element={
          <AdminRoute><Login onLogin={handleLogin} /></AdminRoute>
        } />
        <Route path="/admin" element={
          <AdminRoute><Login onLogin={handleLogin} /></AdminRoute>
        } />
        {showWelcome && isAuthenticated && (
          <Route path="/welcome" element={<WelcomePage onContinue={handleWelcomeContinue} />} />
        )}
        {isAuthenticated && !showWelcome && (
          <Route path="/dashboard" element={<Layout onLogout={handleLogout}><Dashboard /></Layout>} />
        )}
        {isAuthenticated && !showWelcome && (
          <Route path="/students" element={<Layout onLogout={handleLogout}><Students /></Layout>} />
        )}
        {isAuthenticated && !showWelcome && (
          <Route path="/academic" element={<Layout onLogout={handleLogout}><Academic /></Layout>} />
        )}
        {isAuthenticated && !showWelcome && (
          <Route path="/timetable" element={<Layout onLogout={handleLogout}><Timetable /></Layout>} />
        )}
        {isAuthenticated && !showWelcome && (
          <Route path="/messages" element={<Layout onLogout={handleLogout}><Messages /></Layout>} />
        )}
        {isAuthenticated && !showWelcome && (
          <Route path="/news" element={<Layout onLogout={handleLogout}><News /></Layout>} />
        )}
        {isAuthenticated && !showWelcome && (
          <Route path="/sports" element={<Layout onLogout={handleLogout}><Sports /></Layout>} />
        )}
        {isAuthenticated && !showWelcome && (
          <Route path="/assignments" element={<Layout onLogout={handleLogout}><Assignments /></Layout>} />
        )}
        {isAuthenticated && !showWelcome && (
          <Route path="/finance" element={<Layout onLogout={handleLogout}><Finance /></Layout>} />
        )}
        <Route path="/*" element={
          isAuthenticated ? (
            showWelcome ? (
              <Navigate to="/welcome" />
            ) : (
              <Navigate to="/dashboard" />
            )
          ) : (
            studentUser ? <Navigate to="/student-portal" /> : <Navigate to="/login" />
          )
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App
