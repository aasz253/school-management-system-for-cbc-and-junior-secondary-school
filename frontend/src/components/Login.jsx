import { useState, useEffect } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const [resetUsername, setResetUsername] = useState('')
  const [resetMessage, setResetMessage] = useState('')
  const [resetLoading, setResetLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await axios.post('/api/auth/login', { username, password })
      if (res.data.success) {
        localStorage.setItem('user', JSON.stringify(res.data.user))
        onLogin()
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setResetMessage('')
    setResetLoading(true)

    try {
      const res = await axios.post('/api/auth/reset-password', { username: resetUsername })
      if (res.data.success) {
        setResetMessage('Password has been reset to: ' + res.data.newPassword)
      }
    } catch (err) {
      setResetMessage(err.response?.data?.message || 'Reset failed')
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-kenyan-blue via-blue-900 to-kenyan-green flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-kenyan-blue p-8 text-center">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-16 h-16 text-kenyan-blue" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
            </svg>
          </div>
          <div className="h-10 flex items-center justify-center overflow-hidden">
            <h1 className="text-2xl font-bold text-white animate-pulse">
              SMART SCHOOL ACADEMY
            </h1>
          </div>
          <p className="text-blue-200 mt-2 text-sm">Kenyan Education Management System</p>
        </div>

        {!showReset ? (
          <>
            <form onSubmit={handleSubmit} className="p-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">Admin Login</h2>
              
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input"
                  placeholder="Enter username"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="Enter password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full py-3"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>

              <button
                type="button"
                onClick={() => setShowReset(true)}
                className="block w-full text-center text-kenyan-blue hover:text-kenyan-green text-sm mt-4"
              >
                Forgot Password? Reset Here
              </button>
            </form>

            <div className="px-8 pb-6">
              <Link 
                to="/" 
                className="block text-center text-kenyan-blue hover:text-kenyan-green font-medium"
              >
                Student Login - Click Here
              </Link>
            </div>
          </>
        ) : (
          <form onSubmit={handleResetPassword} className="p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">Reset Password</h2>
            
            {resetMessage && (
              <div className={`p-3 rounded-lg mb-4 text-sm ${resetMessage.includes('reset') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                {resetMessage}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Enter Username</label>
              <input
                type="text"
                value={resetUsername}
                onChange={(e) => setResetUsername(e.target.value)}
                className="input"
                placeholder="Enter admin username"
                required
              />
            </div>

            <button
              type="submit"
              disabled={resetLoading}
              className="btn btn-primary w-full py-3"
            >
              {resetLoading ? 'Resetting...' : 'Reset Password'}
            </button>

            <button
              type="button"
              onClick={() => { setShowReset(false); setResetMessage(''); }}
              className="block w-full text-center text-gray-500 hover:text-gray-700 text-sm mt-4"
            >
              Back to Login
            </button>
          </form>
        )}

        <footer className="bg-gray-50 border-t border-gray-200 py-3 text-center">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} SIFUNA CODEX COMPANY
          </p>
        </footer>
      </div>
    </div>
  )
}
