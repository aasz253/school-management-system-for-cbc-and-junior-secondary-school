import { useState } from 'react'
import api from '../api'
import { Link } from 'react-router-dom'

export default function StudentLogin({ onLogin }) {
  const [admission_no, setAdmissionNo] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await api.post('/api/auth/student-login', { admission_no, password })
      if (res.data.success) {
        localStorage.setItem('studentUser', JSON.stringify(res.data.user))
        onLogin(res.data.user)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative flex flex-col">
      {/* Background with blurred campus effect */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          background: `
            linear-gradient(135deg, 
              #1e5faa 0%, 
              #3b82d6 25%, 
              #6ba3e0 40%,
              #87ceeb 50%,
              #a8d8a8 60%,
              #7cb87c 75%,
              #4a9e4a 100%
            )
          `,
        }}
      >
        {/* Decorative campus-like shapes */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Sky gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-600/30 via-transparent to-green-800/30"></div>
          
          {/* Building silhouettes */}
          <div className="absolute bottom-0 left-0 right-0 h-1/2">
            <svg className="w-full h-full opacity-20" viewBox="0 0 1440 400" preserveAspectRatio="none">
              {/* Building shapes */}
              <rect x="50" y="200" width="120" height="200" fill="#1a365d" rx="4"/>
              <rect x="55" y="180" width="110" height="20" fill="#2c5282" rx="2"/>
              <rect x="70" y="210" width="25" height="30" fill="#90cdf4" opacity="0.5"/>
              <rect x="105" y="210" width="25" height="30" fill="#90cdf4" opacity="0.5"/>
              <rect x="140" y="210" width="25" height="30" fill="#90cdf4" opacity="0.5"/>
              <rect x="70" y="260" width="25" height="30" fill="#90cdf4" opacity="0.5"/>
              <rect x="105" y="260" width="25" height="30" fill="#90cdf4" opacity="0.5"/>
              <rect x="140" y="260" width="25" height="30" fill="#90cdf4" opacity="0.5"/>
              
              <rect x="200" y="250" width="180" height="150" fill="#2d3748" rx="4"/>
              <rect x="210" y="260" width="30" height="25" fill="#fbb6ce" opacity="0.4"/>
              <rect x="250" y="260" width="30" height="25" fill="#fbb6ce" opacity="0.4"/>
              <rect x="290" y="260" width="30" height="25" fill="#fbb6ce" opacity="0.4"/>
              <rect x="330" y="260" width="30" height="25" fill="#fbb6ce" opacity="0.4"/>
              
              <polygon points="500,150 620,150 620,350 500,350" fill="#4a5568"/>
              <polygon points="500,150 560,100 620,150" fill="#2d3748"/>
              
              <rect x="700" y="180" width="200" height="220" fill="#1a365d" rx="4"/>
              <rect x="785" y="140" width="30" height="40" fill="#2c5282"/>
              <circle cx="800" cy="130" r="15" fill="#e53e3e" opacity="0.7"/>
              
              <rect x="950" y="220" width="150" height="180" fill="#2d3748" rx="4"/>
              <rect x="1130" y="260" width="120" height="140" fill="#4a5568" rx="4"/>
              <rect x="1280" y="200" width="160" height="200" fill="#1a365d" rx="4"/>
            </svg>
          </div>
          
          {/* Trees/foliage */}
          <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-green-700/40 to-transparent"></div>
        </div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-4">
            {/* University Logo */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-full flex items-center justify-center shadow-lg flex-shrink-0 border-4 border-yellow-400">
              <svg viewBox="0 0 100 100" className="w-16 h-16 sm:w-20 sm:h-20">
                {/* Outer ring */}
                <circle cx="50" cy="50" r="48" fill="none" stroke="#1e3a5f" strokeWidth="3"/>
                
                {/* Laurel wreath - left */}
                <path d="M15 55 Q20 40, 30 35 Q25 45, 28 55" fill="#2d5a27" stroke="#1a4a17" strokeWidth="1"/>
                <path d="M18 62 Q25 48, 35 42 Q28 52, 30 62" fill="#2d5a27" stroke="#1a4a17" strokeWidth="1"/>
                <path d="M22 68 Q30 55, 40 50 Q32 60, 33 68" fill="#2d5a27" stroke="#1a4a17" strokeWidth="1"/>
                
                {/* Laurel wreath - right */}
                <path d="M85 55 Q80 40, 70 35 Q75 45, 72 55" fill="#2d5a27" stroke="#1a4a17" strokeWidth="1"/>
                <path d="M82 62 Q75 48, 65 42 Q72 52, 70 62" fill="#2d5a27" stroke="#1a4a17" strokeWidth="1"/>
                <path d="M78 68 Q70 55, 60 50 Q68 60, 67 68" fill="#2d5a27" stroke="#1a4a17" strokeWidth="1"/>
                
                {/* Center circle */}
                <circle cx="50" cy="50" r="28" fill="#1e3a5f"/>
                <circle cx="50" cy="50" r="26" fill="none" stroke="#ffd700" strokeWidth="2"/>
                
                {/* Book */}
                <path d="M35 45 L50 42 L65 45 L65 62 L50 65 L35 62 Z" fill="white"/>
                <line x1="50" y1="42" x2="50" y2="65" stroke="#1e3a5f" strokeWidth="1.5"/>
                <line x1="38" y1="50" x2="48" y2="49" stroke="#1e3a5f" strokeWidth="1"/>
                <line x1="38" y1="54" x2="48" y2="53" stroke="#1e3a5f" strokeWidth="1"/>
                <line x1="38" y1="58" x2="48" y2="57" stroke="#1e3a5f" strokeWidth="1"/>
                <line x1="52" y1="49" x2="62" y2="50" stroke="#1e3a5f" strokeWidth="1"/>
                <line x1="52" y1="53" x2="62" y2="54" stroke="#1e3a5f" strokeWidth="1"/>
                <line x1="52" y1="57" x2="62" y2="58" stroke="#1e3a5f" strokeWidth="1"/>
                
                {/* Torch/flame above book */}
                <rect x="47" y="28" width="6" height="12" fill="#ffd700"/>
                <ellipse cx="50" cy="26" rx="5" ry="7" fill="#ff6b35"/>
                <ellipse cx="50" cy="25" rx="3" ry="5" fill="#ffd700"/>
                
                {/* Banner */}
                <path d="M25 75 Q50 85, 75 75" fill="none" stroke="#1e3a5f" strokeWidth="3"/>
                <text x="50" y="82" textAnchor="middle" fontSize="6" fill="#1e3a5f" fontWeight="bold">MAGNUS NECTO MANCERIAM</text>
              </svg>
            </div>
            
            {/* University Name */}
            <div className="text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-tight tracking-wide">
                MASINDE MULIRO UNIVERSITY
              </h1>
              <h2 className="text-base sm:text-lg md:text-xl font-semibold text-white/90 mt-1">
                OF SCIENCE & TECHNOLOGY
              </h2>
              <p className="text-blue-200 italic mt-2 text-sm sm:text-base">
                Fountain of Knowledge
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-slate-100 to-white px-6 sm:px-8 pt-6 sm:pt-8 pb-4 border-b border-gray-200">
            <h2 className="text-xl sm:text-2xl font-bold text-blue-900 text-center">
              Student Portal Login
            </h2>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 sm:px-8 py-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-5 text-sm flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                </svg>
                {error}
              </div>
            )}

            {/* Registration Number */}
            <div className="mb-5">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <svg className="w-5 h-5 text-blue-800" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                </svg>
                Registration Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                  </svg>
                </div>
                <input
                  type="text"
                  value={admission_no}
                  onChange={(e) => setAdmissionNo(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all text-gray-700"
                  placeholder="Enter Registration Number"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="mb-6">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <svg className="w-5 h-5 text-blue-800" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                </svg>
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                  </svg>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all text-gray-700"
                  placeholder="Enter Password"
                  required
                />
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white font-bold text-lg rounded-lg hover:from-blue-800 hover:via-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'LOGIN'
              )}
            </button>

            {/* Forgot Password */}
            <div className="mt-4 text-center">
              <Link 
                to="/forgot-password" 
                className="text-blue-700 hover:text-blue-900 underline text-sm font-medium"
              >
                Forgot Password?
              </Link>
            </div>
          </form>

          {/* Admin Login Link */}
          <div className="px-6 sm:px-8 pb-6">
            <div className="border-t border-gray-200 pt-4">
              <Link 
                to="/login" 
                className="block text-center text-blue-800 hover:text-blue-600 font-medium text-sm"
              >
                Login as Admin - Click Here
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-black/60 backdrop-blur-sm text-white py-4 sm:py-5">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm sm:text-base mb-2">
            &copy; {new Date().getFullYear()} Masinde Muliro University of Science and Technology. All Rights Reserved.
          </p>
          <p className="text-sm text-gray-300">
            Contact: <a href="mailto:info@mmust.ac.ke" className="text-blue-300 hover:text-white">info@mmust.ac.ke</a> | Tel: +254 57 2505222
          </p>
        </div>
      </footer>
    </div>
  )
}
