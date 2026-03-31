import { useState, useEffect } from 'react'
import api from '../../api'

export default function StudentNews({ student, refreshKey }) {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchNews()
  }, [refreshKey])

  const fetchNews = async () => {
    try {
      setLoading(true)
      const res = await api.get('/api/news')
      console.log('News API response:', res.data)
      // Filter for published news only - check for both true and undefined (default to published)
      const publishedNews = (res.data || []).filter(n => n.is_published === true || n.is_published === undefined)
      console.log('Published news:', publishedNews)
      setNews(publishedNews)
    } catch (error) {
      console.error('Error fetching news:', error)
      setError('Failed to load news')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'long', 
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
          <span className="text-3xl">📢</span> Announcements & News
        </h2>
        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
          {news.length} Post{news.length !== 1 ? 's' : ''}
        </span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {news.length > 0 ? (
        <div className="grid gap-6">
          {news.map(item => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
              {item.media_type === 'image' && item.media_data && (
                <div className="w-full h-48 sm:h-64 overflow-hidden">
                  <img 
                    src={item.media_data} 
                    alt={item.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="p-5">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                    Announcement
                  </span>
                  {item.event_date && (
                    <span className="flex items-center gap-1 text-sm text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(item.event_date)}
                      {item.event_time && ` at ${item.event_time}`}
                    </span>
                  )}
                </div>
                
                <h3 className="text-xl font-bold text-gray-800 mb-3">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.content}</p>
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <span className="text-sm text-gray-400">
                    Posted: {formatDate(item.created_at)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-6xl mb-4">📰</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Announcements</h3>
          <p className="text-gray-500">There are no announcements or news at the moment. Check back later!</p>
        </div>
      )}
    </div>
  )
}
