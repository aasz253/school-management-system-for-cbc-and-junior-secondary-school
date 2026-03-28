import { useState, useEffect } from 'react'
import api from '../api'

const grades = ['1', '2', '3', '4', '5', '6', '7', '8']
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const times = [
  '7:30 - 8:00',
  '8:00 - 8:40',
  '8:40 - 9:20',
  '9:20 - 9:40',
  '9:40 - 10:20',
  '10:20 - 11:00',
  '11:00 - 11:40',
  '11:40 - 12:20',
  '12:20 - 1:00',
  '1:00 - 1:40'
]

const defaultSubjects = [
  'English',
  'Kiswahili',
  'Mathematics',
  'Science',
  'Social Studies',
  'Religious Education',
  'Creative Arts',
  'Physical & Health Education',
  'Agriculture',
  'Life Skills'
]

export default function Timetable() {
  const [selectedGrade, setSelectedGrade] = useState('1')
  const [schedule, setSchedule] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchTimetable()
  }, [selectedGrade])

  const fetchTimetable = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/api/timetable/${selectedGrade}`)
      if (res.data.schedule && Object.keys(res.data.schedule).length > 0) {
        setSchedule(res.data.schedule)
      } else {
        const emptySchedule = {}
        days.forEach(day => {
          emptySchedule[day] = {}
          times.forEach(time => {
            emptySchedule[day][time] = ''
          })
        })
        setSchedule(emptySchedule)
      }
    } catch (error) {
      console.error('Error fetching timetable:', error)
      const emptySchedule = {}
      days.forEach(day => {
        emptySchedule[day] = {}
        times.forEach(time => {
          emptySchedule[day][time] = ''
        })
      })
      setSchedule(emptySchedule)
    } finally {
      setLoading(false)
    }
  }

  const handleCellChange = (day, time, value) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [time]: value
      }
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    try {
      await api.post('/api/timetable', {
        grade: selectedGrade,
        schedule
      })
      setMessage('Timetable saved successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Error saving timetable:', error)
      setMessage(error.response?.data?.message || 'Failed to save timetable')
    } finally {
      setSaving(false)
    }
  }

  const clearTimetable = () => {
    const emptySchedule = {}
    days.forEach(day => {
      emptySchedule[day] = {}
      times.forEach(time => {
        emptySchedule[day][time] = ''
      })
    })
    setSchedule(emptySchedule)
  }

  const getUniqueSubjects = () => {
    const subjects = new Set(defaultSubjects)
    Object.values(schedule).forEach(daySchedule => {
      Object.values(daySchedule).forEach(subject => {
        if (subject) subjects.add(subject)
      })
    })
    return Array.from(subjects).sort()
  }

  const getSubjectColor = (subject) => {
    if (!subject) return ''
    const colors = {
      'English': 'bg-blue-100 text-blue-800',
      'Kiswahili': 'bg-blue-100 text-blue-800',
      'Mathematics': 'bg-red-100 text-red-800',
      'Science': 'bg-green-100 text-green-800',
      'Social Studies': 'bg-yellow-100 text-yellow-800',
      'Religious Education': 'bg-purple-100 text-purple-800',
      'Creative Arts': 'bg-pink-100 text-pink-800',
      'Physical & Health Education': 'bg-orange-100 text-orange-800',
      'Agriculture': 'bg-emerald-100 text-emerald-800',
      'Life Skills': 'bg-cyan-100 text-cyan-800'
    }
    return colors[subject] || 'bg-gray-100 text-gray-800'
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
          <h1 className="text-2xl font-bold text-gray-800">Class Timetable</h1>
          <p className="text-gray-500">Create and manage class schedules</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={clearTimetable}
            className="btn bg-gray-200 text-gray-700 hover:bg-gray-300"
          >
            Clear All
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? 'Saving...' : 'Save Timetable'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Class (Grade)</label>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="select"
            >
              {grades.map(g => (
                <option key={g} value={g}>Grade {g}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Weekly Timetable - Grade {selectedGrade}
          </h3>
          <p className="text-sm text-gray-500">Click on a cell to select a subject</p>
        </div>

        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="py-2 px-2 font-bold text-gray-700 w-24 bg-gray-100 text-center">Time</th>
                {days.map(day => (
                  <th key={day} className="py-2 px-2 font-bold text-gray-700 w-32 text-center bg-gray-100">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {times.map((time, timeIdx) => (
                <tr key={time} className="border-b border-gray-100">
                  <td className="py-2 px-2 text-sm font-medium text-gray-600 bg-gray-50 text-center">
                    {timeIdx === 0 ? (
                      <span className="text-xs">Break/Assembly</span>
                    ) : (
                      <span className="text-xs">{time}</span>
                    )}
                  </td>
                  {days.map(day => (
                    <td key={`${day}-${time}`} className="py-1 px-1 border-l border-gray-100">
                      <select
                        value={schedule[day]?.[time] || ''}
                        onChange={(e) => handleCellChange(day, time, e.target.value)}
                        className={`input text-sm w-full py-1 px-2 ${schedule[day]?.[time] ? getSubjectColor(schedule[day][time]) : 'bg-white'}`}
                      >
                        <option value="">-</option>
                        {getUniqueSubjects().map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                        <option value="BREAK">BREAK</option>
                        <option value="LUNCH">LUNCH</option>
                        <option value="ASSEMBLY">ASSEMBLY</option>
                        <option value=" Games">GAMES</option>
                      </select>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Subject Legend</h3>
        <div className="flex flex-wrap gap-2">
          {defaultSubjects.map(subject => (
            <span
              key={subject}
              className={`px-3 py-1 rounded-full text-sm font-medium ${getSubjectColor(subject)}`}
            >
              {subject}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
