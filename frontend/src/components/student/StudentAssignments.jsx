import { useState, useEffect } from 'react'
import api from '../../api'

export default function StudentAssignments({ student, refreshKey }) {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAssignments()
  }, [student.grade, refreshKey])

  const fetchAssignments = async () => {
    try {
      const res = await api.get(`/api/assignments?grade=${student.grade}`)
      setAssignments((res.data || []).filter(a => a.is_published))
    } catch (error) {
      console.error('Error fetching assignments:', error)
    } finally {
      setLoading(false)
    }
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
          <span className="text-3xl">📚</span> My Assignments
        </h2>
        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
          {assignments.length} Assignment{assignments.length !== 1 ? 's' : ''}
        </span>
      </div>

      {assignments.length > 0 ? (
        <div className="grid gap-4">
          {assignments.map(item => {
            const isOverdue = item.due_date && new Date(item.due_date) < new Date()
            const daysUntilDue = item.due_date ? Math.ceil((new Date(item.due_date) - new Date()) / (1000 * 60 * 60 * 24)) : null
            
            return (
              <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">
                        {item.subject}
                      </span>
                      {item.due_date && (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          isOverdue ? 'bg-red-100 text-red-800' : 
                          daysUntilDue <= 2 ? 'bg-orange-100 text-orange-800' : 
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {isOverdue ? 'Overdue' : `Due: ${new Date(item.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">{item.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{item.description || 'No description provided.'}</p>
                  </div>
                  
                  {item.file_data && (
                    <div className="flex-shrink-0">
                      {item.file_data.startsWith('data:application/pdf') ? (
                        <a href={item.file_data} download={item.file_name || 'assignment.pdf'} 
                           className="inline-flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download PDF
                        </a>
                      ) : (
                        <a href={item.file_data} download={item.file_name || 'attachment.jpg'} target="_blank" rel="noopener noreferrer"
                           className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          View Attachment
                        </a>
                      )}
                    </div>
                  )}
                </div>
                
                {item.due_date && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 pt-3 border-t border-gray-100">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {isOverdue ? (
                      <span className="text-red-600 font-medium">This assignment is overdue</span>
                    ) : daysUntilDue === 0 ? (
                      <span className="text-orange-600 font-medium">Due today!</span>
                    ) : daysUntilDue === 1 ? (
                      <span className="text-orange-600 font-medium">Due tomorrow</span>
                    ) : (
                      <span>{daysUntilDue} days remaining</span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Assignments Yet</h3>
          <p className="text-gray-500">There are no assignments for your class at the moment.</p>
        </div>
      )}
    </div>
  )
}
