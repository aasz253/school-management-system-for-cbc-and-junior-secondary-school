import { useState, useEffect } from 'react'
import api from '../api'

const grades = ['1', '2', '3', '4', '5', '6', '7', '8']
const subjects = ['English', 'Kiswahili', 'Mathematics', 'Science', 'Social Studies', 'Religious Education', 'Creative Arts', 'Physical & Health Education', 'Agriculture', 'Life Skills']

export default function Assignments() {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [filterGrade, setFilterGrade] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    grade: '1',
    subject: 'Mathematics',
    due_date: '',
    file: null,
    file_preview: '',
    is_published: true
  })

  useEffect(() => {
    fetchAssignments()
  }, [filterGrade])

  const fetchAssignments = async () => {
    try {
      const url = filterGrade ? `/api/assignments?grade=${filterGrade}` : '/api/assignments'
      const res = await api.get(url)
      setAssignments(res.data)
    } catch (error) {
      console.error('Error fetching assignments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData({ ...formData, file: file, file_preview: reader.result })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      let file_data = null
      let file_name = null
      
      if (formData.file) {
        const reader = new FileReader()
        file_data = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result)
          reader.readAsDataURL(formData.file)
        })
        file_name = formData.file.name
      }
      
      const data = {
        title: formData.title,
        description: formData.description,
        grade: formData.grade,
        subject: formData.subject,
        due_date: formData.due_date || null,
        file_data: file_data,
        file_name: file_name,
        is_published: formData.is_published
      }
      
      if (editingId) {
        await api.put(`/api/assignments/${editingId}`, data)
      } else {
        await api.post('/api/assignments', data)
      }
      
      fetchAssignments()
      resetForm()
    } catch (error) {
      console.error('Error saving assignment:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (item) => {
    setFormData({
      title: item.title || '',
      description: item.description || '',
      grade: item.grade || '1',
      subject: item.subject || 'Mathematics',
      due_date: item.due_date ? item.due_date.split('T')[0] : '',
      file: null,
      file_preview: item.file_data || '',
      is_published: item.is_published
    })
    setEditingId(item.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return
    
    try {
      await api.delete(`/api/assignments/${id}`)
      fetchAssignments()
    } catch (error) {
      console.error('Error deleting assignment:', error)
    }
  }

  const handleTogglePublish = async (item) => {
    try {
      await api.put(`/api/assignments/${item.id}`, { is_published: !item.is_published })
      fetchAssignments()
    } catch (error) {
      console.error('Error toggling publish:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      grade: '1',
      subject: 'Mathematics',
      due_date: '',
      file: null,
      file_preview: '',
      is_published: true
    })
    setEditingId(null)
    setShowForm(false)
  }

  const formatDate = (date) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
  }

  const isOverdue = (dueDate) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
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
          <h1 className="text-2xl font-bold text-gray-800">Assignments</h1>
          <p className="text-gray-500">Create and manage class assignments</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary">
          + Add Assignment
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Class</label>
            <select value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)} className="select">
              <option value="">All Classes</option>
              {grades.map(g => <option key={g} value={g}>Grade {g}</option>)}
            </select>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {editingId ? 'Edit Assignment' : 'Add New Assignment'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="input w-full" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                <select value={formData.grade} onChange={(e) => setFormData({ ...formData, grade: e.target.value })} className="input w-full">
                  {grades.map(g => <option key={g} value={g}>Grade {g}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                <select value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} className="input w-full">
                  {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} className="input w-full" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input w-full h-24" placeholder="Assignment instructions..." />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Attachment (PDF/Image)</label>
              <input type="file" accept=".pdf,.doc,.docx,image/*" onChange={handleFileChange} className="input w-full" />
              {formData.file_preview && (
                <div className="mt-2">
                  {formData.file_preview.startsWith('data:application/pdf') ? (
                    <span className="text-sm text-red-600">📄 {formData.file?.name || 'PDF File'}</span>
                  ) : (
                    <img src={formData.file_preview} alt="Preview" className="h-20 w-20 object-cover rounded" />
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_published_assign" checked={formData.is_published} onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })} className="w-4 h-4" />
              <label htmlFor="is_published_assign" className="text-sm text-gray-700">Publish immediately</label>
            </div>

            <div className="flex gap-2 justify-end">
              <button type="button" onClick={resetForm} className="btn bg-gray-200 text-gray-700">Cancel</button>
              <button type="submit" disabled={saving} className="btn btn-primary">
                {saving ? 'Saving...' : editingId ? 'Update' : 'Publish'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {assignments.length === 0 ? (
          <div className="card text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500">No assignments posted yet</p>
          </div>
        ) : (
          assignments.map(item => (
            <div key={item.id} className="card">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-medium">Grade {item.grade}</span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded font-medium">{item.subject}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${item.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {item.is_published ? 'Published' : 'Draft'}
                    </span>
                    {item.due_date && (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${isOverdue(item.due_date) ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {isOverdue(item.due_date) ? 'Overdue' : `Due: ${formatDate(item.due_date)}`}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">{item.title}</h3>
                  <p className="text-gray-600 mt-1">{item.description}</p>
                  {item.file_name && (
                    <p className="text-sm text-blue-600 mt-2">📎 Attachment: {item.file_name}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    Posted: {new Date(item.created_at).toLocaleDateString('en-GB')}
                  </p>
                </div>
                <div className="flex gap-2 md:flex-col">
                  <button onClick={() => handleEdit(item)} className="text-sm text-kenyan-blue hover:underline">Edit</button>
                  <button onClick={() => handleTogglePublish(item)} className="text-sm text-gray-500 hover:underline">
                    {item.is_published ? 'Unpublish' : 'Publish'}
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="text-sm text-red-500 hover:underline">Delete</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
