import { useState, useEffect } from 'react'
import axios from 'axios'

export default function Finance() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalFees: 0,
    financial: null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await axios.get('/api/dashboard/stats')
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
      minimumFractionDigits: 2
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kenyan-blue"></div>
      </div>
    )
  }

  const { totalStudents, totalFees, financial } = stats
  const expectedFees = financial ? financial.expectedFees : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Financial Management</h1>
        <p className="text-gray-500">CBC Capitation and fee tracking</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-kenyan-blue to-blue-800 text-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-blue-200">Total Fees Collected</p>
              <p className="text-2xl font-bold">{formatCurrency(totalFees)}</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-kenyan-green to-green-800 text-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-green-200">Expected (Capitation)</p>
              <p className="text-2xl font-bold">{formatCurrency(expectedFees)}</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-amber-500 to-amber-700 text-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <p className="text-amber-200">Collection Rate</p>
              <p className="text-2xl font-bold">
                {expectedFees > 0 ? ((totalFees / expectedFees) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {financial && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">CBC Capitation Structure</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-kenyan-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-800">Tuition Account</h4>
              </div>
              <p className="text-3xl font-bold text-kenyan-blue mb-2">{formatCurrency(financial.tuitionAccount)}</p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>60% allocation</span>
                <span>KES {financial.capitationRate * 0.6}/learner</span>
              </div>
              <div className="mt-4 bg-gray-100 rounded-full h-2">
                <div className="bg-kenyan-blue h-2 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-kenyan-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-800">Operations Account</h4>
              </div>
              <p className="text-3xl font-bold text-kenyan-green mb-2">{formatCurrency(financial.operationsAccount)}</p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>25% allocation</span>
                <span>KES {financial.capitationRate * 0.25}/learner</span>
              </div>
              <div className="mt-4 bg-gray-100 rounded-full h-2">
                <div className="bg-kenyan-green h-2 rounded-full" style={{ width: '25%' }}></div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-800">Infrastructure Account</h4>
              </div>
              <p className="text-3xl font-bold text-purple-600 mb-2">{formatCurrency(financial.infrastructureAccount)}</p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>15% allocation</span>
                <span>KES {financial.capitationRate * 0.15}/learner</span>
              </div>
              <div className="mt-4 bg-gray-100 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{ width: '15%' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Capitation Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-3 text-gray-600">Total Enrolled Learners</td>
                <td className="py-3 text-right font-medium">{totalStudents}</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 text-gray-600">Capitation Rate per Learner</td>
                <td className="py-3 text-right font-medium">
                  {financial ? formatCurrency(financial.capitationRate) : formatCurrency(0)}
                </td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 text-gray-600">Total Expected (3 Terms)</td>
                <td className="py-3 text-right font-medium">{formatCurrency(expectedFees * 3)}</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 text-gray-600">Total Collected (All Time)</td>
                <td className="py-3 text-right font-medium text-kenyan-green">{formatCurrency(totalFees)}</td>
              </tr>
              <tr>
                <td className="py-3 text-gray-600">Balance Expected</td>
                <td className="py-3 text-right font-medium text-amber-600">
                  {formatCurrency((expectedFees * 3) - totalFees)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
