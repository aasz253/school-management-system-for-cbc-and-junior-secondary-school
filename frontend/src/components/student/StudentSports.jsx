import { useState, useEffect } from 'react'
import api from '../../api'

export default function StudentSports({ student, refreshKey }) {
  const [sports, setSports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchSports()
  }, [refreshKey])

  const fetchSports = async () => {
    try {
      setLoading(true)
      const res = await api.get('/api/sports')
      console.log('Sports API response:', res.data)
      // Filter for published sports only
      const publishedSports = (res.data || []).filter(s => s.is_published === true)
      console.log('Published sports:', publishedSports)
      setSports(publishedSports)
    } catch (error) {
      console.error('Error fetching sports:', error)
      setError('Failed to load sports activities')
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type) => {
    switch(type?.toLowerCase()) {
      case 'football': return '⚽'
      case 'basketball': return '🏀'
      case 'volleyball': return '🏐'
      case 'athletics': return '🏃'
      case 'swimming': return '🏊'
      case 'tennis': return '🎾'
      case 'cricket': return '🏏'
      case 'handball': return '🤾'
      case 'badminton': return '🏸'
      case 'table tennis': return '🏓'
      default: return '🏆'
    }
  }

  const getActivityColor = (type) => {
    const colors = {
      'Football': 'bg-green-100 text-green-800',
      'Volleyball': 'bg-purple-100 text-purple-800',
      'Basketball': 'bg-orange-100 text-orange-800',
      'Athletics': 'bg-red-100 text-red-800',
      'Swimming': 'bg-cyan-100 text-cyan-800',
      'Tennis': 'bg-yellow-100 text-yellow-800',
      'Badminton': 'bg-pink-100 text-pink-800',
      'Handball': 'bg-indigo-100 text-indigo-800',
      'Table Tennis': 'bg-teal-100 text-teal-800',
      'General': 'bg-gray-100 text-gray-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const formatDate = (date) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
          <span className="text-3xl">🏅</span> Games & Sports
        </h2>
        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
          {sports.length} Activit{sports.length !== 1 ? 'ies' : 'y'}
        </span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {sports.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sports.map(item => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
              {item.image_data && (
                <div className="w-full h-40 overflow-hidden">
                  <img 
                    src={item.image_data} 
                    alt={item.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{getActivityIcon(item.activity_type)}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getActivityColor(item.activity_type)}`}>
                    {item.activity_type || 'General'}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-gray-800 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{item.description}</p>
                
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                  {item.event_date && (
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(item.event_date)}
                    </span>
                  )}
                  {item.location && (
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {item.location}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-6xl mb-4">🏃</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Sports Activities</h3>
          <p className="text-gray-500">There are no sports activities posted yet. Check back later!</p>
        </div>
      )}
    </div>
  )
}
