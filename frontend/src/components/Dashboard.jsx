import { useState, useEffect } from 'react'
import api from '../api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalFees: 0,
    gradeStats: [],
    financial: null
  })
  const [loading, setLoading] = useState(true)
  const [schoolInfo, setSchoolInfo] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem('schoolInfo')
    if (saved) {
      setSchoolInfo(JSON.parse(saved))
    }
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await api.get('/api/dashboard/stats')
      setStats(res.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kenyan-blue"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {schoolInfo && (
        <div className="bg-gradient-to-r from-kenyan-blue to-blue-800 rounded-xl shadow-lg p-6 text-white">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {schoolInfo.badge && (
              <img src={schoolInfo.badge} alt="School Badge" className="w-24 h-24 rounded-full border-4 border-white/30 object-cover" />
            )}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold">CBC Smart School</h1>
              {schoolInfo.motto && <p className="text-blue-200 mt-1 italic">"{schoolInfo.motto}"</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              {schoolInfo.headmaster && (
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-xs text-blue-200">Head Teacher</p>
                  <p className="font-semibold">{schoolInfo.headmaster}</p>
                </div>
              )}
              {schoolInfo.hod && (
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-xs text-blue-200">HOD</p>
                  <p className="font-semibold">{schoolInfo.hod}</p>
                </div>
              )}
              {schoolInfo.adminName && (
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-xs text-blue-200">Administrator</p>
                  <p className="font-semibold">{schoolInfo.adminName}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-kenyan-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Students</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalStudents}</p>
            </div>
          </div>
        </div>

        <div className="card hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-kenyan-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Fees Collected</p>
              <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.totalFees)}</p>
            </div>
          </div>
        </div>

        <div className="card hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Students by Grade</p>
              <p className="text-2xl font-bold text-gray-800">{stats.gradeStats.length}</p>
            </div>
          </div>
        </div>
      </div>

      {stats.gradeStats.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Students per Grade</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bar Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.gradeStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="grade" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3B82F6" name="Students" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Pie Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.gradeStats}
                    dataKey="count"
                    nameKey="grade"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {stats.gradeStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {stats.financial && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">CBC Capitation Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Capitation Rate</p>
              <p className="text-lg font-bold text-kenyan-blue">
                {formatCurrency(stats.financial.capitationRate)}
              </p>
              <p className="text-xs text-gray-500">per learner/term</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Tuition Account</p>
              <p className="text-lg font-bold text-kenyan-green">
                {formatCurrency(stats.financial.tuitionAccount)}
              </p>
              <p className="text-xs text-gray-500">60%</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Operations</p>
              <p className="text-lg font-bold text-amber-600">
                {formatCurrency(stats.financial.operationsAccount)}
              </p>
              <p className="text-xs text-gray-500">25%</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Infrastructure</p>
              <p className="text-lg font-bold text-purple-600">
                {formatCurrency(stats.financial.infrastructureAccount)}
              </p>
              <p className="text-xs text-gray-500">15%</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
