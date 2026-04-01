import { useState, useEffect } from 'react'
import api from '../api'

const mediaTypes = [
  { value: 'none', label: 'No Media' },
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' }
]

export default function News() {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    event_date: '',
    event_time: '',
    media_type: 'none',
    media_file: null,
    media_preview: '',
    is_published: true
  })

  useEffect(() => {
    fetchNews()
  }, [])

  const fetchNews = async () => {
    try {
      const res = await api.get('/api/news')
      setNews(res.data)
    } catch (error) {
      console.error('Error fetching news:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData({ ...formData, media_file: file, media_preview: reader.result })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      let media_data = null
      if (formData.media_file) {
        const reader = new FileReader()
        media_data = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result)
          reader.readAsDataURL(formData.media_file)
        })
      }
      
      const data = {
        title: formData.title,
        content: formData.content,
        event_date: formData.event_date || null,
        event_time: formData.event_time || null,
        media_type: formData.media_type === 'none' ? null : formData.media_type,
        media_data: media_data,
        is_published: formData.is_published
      }
      
      if (editingId) {
        await api.put(`/api/news/${editingId}`, data)
      } else {
        await api.post('/api/news', data)
      }
      
      fetchNews()
      resetForm()
    } catch (error) {
      console.error('Error saving news:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (item) => {
    setFormData({
      title: item.title || '',
      content: item.content || '',
      event_date: item.event_date ? item.event_date.split('T')[0] : '',
      event_time: item.event_time || '',
      media_type: item.media_type || 'none',
      media_file: null,
      media_preview: item.media_data || '',
      is_published: item.is_published
    })
    setEditingId(item.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this news?')) return
    
    try {
      await api.delete(`/api/news/${id}`)
      fetchNews()
    } catch (error) {
      console.error('Error deleting news:', error)
    }
  }

  const handleTogglePublish = async (item) => {
    try {
      await api.put(`/api/news/${item.id}`, { is_published: !item.is_published })
      fetchNews()
    } catch (error) {
      console.error('Error toggling publish:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      event_date: '',
      event_time: '',
      media_type: 'none',
      media_file: null,
      media_preview: '',
      is_published: true
    })
    setEditingId(null)
    setShowForm(false)
  }

  const formatDate = (date) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">School News & Events</h1>
          <p className="text-gray-500">Post news and upcoming events</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary"
        >
          + Add News
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {editingId ? 'Edit News' : 'Add New News'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="input w-full h-32"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Date</label>
                <input
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  className="input w-full"
                  min="2020-01-01"
                  max="2030-12-31"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Time</label>
                <input
                  type="time"
                  value={formData.event_time}
                  onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                  className="input w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Media Type</label>
                <select
                  value={formData.media_type}
                  onChange={(e) => setFormData({ ...formData, media_type: e.target.value })}
                  className="input w-full"
                >
                  {mediaTypes.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {formData.media_type === 'video' ? 'Video File' : 'Image File'}
                </label>
                <input
                  type="file"
                  accept={formData.media_type === 'video' ? 'video/*' : 'image/*'}
                  onChange={handleFileChange}
                  className="input w-full"
                  disabled={formData.media_type === 'none'}
                />
                {formData.media_preview && (
                  <div className="mt-2">
                    {formData.media_type === 'image' ? (
                      <img src={formData.media_preview} alt="Preview" className="h-20 w-20 object-cover rounded" />
                    ) : (
                      <video src={formData.media_preview} className="h-20 w-20 object-cover rounded" />
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_published"
                checked={formData.is_published}
                onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="is_published" className="text-sm text-gray-700">Publish immediately</label>
            </div>

            <div className="flex gap-2 justify-end">
              <button type="button" onClick={resetForm} className="btn bg-gray-200 text-gray-700">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="btn btn-primary">
                {saving ? 'Saving...' : editingId ? 'Update' : 'Publish'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {news.length === 0 ? (
          <div className="card text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <p className="text-gray-500">No news posted yet</p>
          </div>
        ) : (
          news.map(item => (
            <div key={item.id} className="card">
              <div className="flex flex-col md:flex-row gap-4">
                {item.media_type === 'image' && item.media_data && (
                  <div className="w-full md:w-48 h-32 flex-shrink-0">
                    <img src={item.media_data} alt={item.title} className="w-full h-full object-cover rounded-lg" />
                  </div>
                )}
                {item.media_type === 'video' && item.media_data && (
                  <div className="w-full md:w-48 flex-shrink-0">
                    <video src={item.media_data} controls className="w-full h-32 rounded-lg" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{item.title}</h3>
                      {item.event_date && (
                        <p className="text-sm text-kenyan-blue font-medium">
                          📅 {formatDate(item.event_date)}
                          {item.event_time && ` at ${item.event_time}`}
                        </p>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      item.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {item.is_published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-2 line-clamp-2">{item.content}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    Posted: {new Date(item.created_at).toLocaleDateString('en-GB')}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => handleEdit(item)} className="text-sm text-kenyan-blue hover:underline">
                      Edit
                    </button>
                    <button onClick={() => handleTogglePublish(item)} className="text-sm text-gray-500 hover:underline">
                      {item.is_published ? 'Unpublish' : 'Publish'}
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="text-sm text-red-500 hover:underline">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
