import { useState, useEffect } from 'react'
import api from '../api'

const activityTypes = [
  'Football',
  'Volleyball',
  'Basketball',
  'Athletics',
  'Swimming',
  'Tennis',
  'Badminton',
  'Handball',
  'Table Tennis',
  'General'
]

export default function Sports() {
  const [sports, setSports] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    activity_type: 'General',
    event_date: '',
    location: '',
    image_file: null,
    image_preview: '',
    is_published: true
  })

  useEffect(() => {
    fetchSports()
  }, [])

  const fetchSports = async () => {
    try {
      const res = await api.get('/api/sports')
      setSports(res.data)
    } catch (error) {
      console.error('Error fetching sports:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData({ ...formData, image_file: file, image_preview: reader.result })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      let image_data = null
      if (formData.image_file) {
        const reader = new FileReader()
        image_data = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result)
          reader.readAsDataURL(formData.image_file)
        })
      }
      
      const data = {
        title: formData.title,
        description: formData.description,
        activity_type: formData.activity_type,
        event_date: formData.event_date || null,
        location: formData.location || null,
        image_data: image_data,
        is_published: formData.is_published
      }
      
      if (editingId) {
        await api.put(`/api/sports/${editingId}`, data)
      } else {
        await api.post('/api/sports', data)
      }
      
      fetchSports()
      resetForm()
    } catch (error) {
      console.error('Error saving sport:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (item) => {
    setFormData({
      title: item.title || '',
      description: item.description || '',
      activity_type: item.activity_type || 'General',
      event_date: item.event_date ? item.event_date.split('T')[0] : '',
      location: item.location || '',
      image_file: null,
      image_preview: item.image_data || '',
      is_published: item.is_published
    })
    setEditingId(item.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this sports activity?')) return
    
    try {
      await api.delete(`/api/sports/${id}`)
      fetchSports()
    } catch (error) {
      console.error('Error deleting sport:', error)
    }
  }

  const handleTogglePublish = async (item) => {
    try {
      await api.put(`/api/sports/${item.id}`, { is_published: !item.is_published })
      fetchSports()
    } catch (error) {
      console.error('Error toggling publish:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      activity_type: 'General',
      event_date: '',
      location: '',
      image_file: null,
      image_preview: '',
      is_published: true
    })
    setEditingId(null)
    setShowForm(false)
  }

  const formatDate = (date) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
  }

  const getActivityColor = (type) => {
    const colors = {
      'Football': 'bg-green-600',
      'Volleyball': 'bg-purple-600',
      'Basketball': 'bg-orange-600',
      'Athletics': 'bg-red-600',
      'Swimming': 'bg-blue-600',
      'Tennis': 'bg-yellow-600',
      'Badminton': 'bg-pink-600',
      'Handball': 'bg-indigo-600',
      'Table Tennis': 'bg-cyan-600',
      'General': 'bg-gray-600'
    }
    return colors[type] || 'bg-gray-600'
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
          <h1 className="text-2xl font-bold text-gray-800">Sports & Activities</h1>
          <p className="text-gray-500">Manage sports activities and events</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary"
        >
          + Add Activity
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {editingId ? 'Edit Activity' : 'Add New Activity'}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Activity Type</label>
              <select
                value={formData.activity_type}
                onChange={(e) => setFormData({ ...formData, activity_type: e.target.value })}
                className="input w-full"
              >
                {activityTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="input w-full"
                  placeholder="e.g., School Field"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image File</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="input w-full"
              />
              {formData.image_preview && (
                <div className="mt-2">
                  <img src={formData.image_preview} alt="Preview" className="h-20 w-20 object-cover rounded" />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_published_sports"
                checked={formData.is_published}
                onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="is_published_sports" className="text-sm text-gray-700">Publish immediately</label>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sports.length === 0 ? (
          <div className="col-span-full card text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-500">No sports activities posted yet</p>
          </div>
        ) : (
          sports.map(item => (
            <div key={item.id} className="card overflow-hidden">
              {item.image_data && (
                <div className="h-40 -mx-6 -mt-6 mb-4">
                  <img src={item.image_data} alt={item.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-1 rounded text-xs text-white font-medium ${getActivityColor(item.activity_type)}`}>
                  {item.activity_type}
                </span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  item.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  {item.is_published ? 'Published' : 'Draft'}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">{item.title}</h3>
              <p className="text-gray-600 text-sm mt-1 line-clamp-2">{item.description}</p>
              <div className="mt-3 space-y-1">
                {item.event_date && (
                  <p className="text-sm text-kenyan-blue font-medium">📅 {formatDate(item.event_date)}</p>
                )}
                {item.location && (
                  <p className="text-sm text-gray-500">📍 {item.location}</p>
                )}
              </div>
              <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
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
          ))
        )}
      </div>
    </div>
  )
}
