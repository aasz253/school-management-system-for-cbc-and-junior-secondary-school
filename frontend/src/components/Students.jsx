import { useState, useEffect } from 'react'
import axios from 'axios'
import StudentForm from './StudentForm'
import EditStudentModal from './EditStudentModal'
import ClassFeesModal from './ClassFeesModal'
import { exportToPDF, exportToKEMIS } from '../utils/export'

export default function Students() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [showClassFees, setShowClassFees] = useState(false)

  useEffect(() => {
    fetchStudents()
  }, [searchQuery])

  const fetchStudents = async () => {
    try {
      const url = searchQuery 
        ? `/api/students/search?q=${encodeURIComponent(searchQuery)}`
        : '/api/students'
      const res = await axios.get(url)
      setStudents(res.data)
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddStudent = async (studentData) => {
    try {
      await axios.post('/api/students', studentData)
      fetchStudents()
      setShowForm(false)
    } catch (error) {
      console.error('Error adding student:', error)
      const message = error.response?.data?.message || error.message || 'Failed to add student'
      alert('Error: ' + message)
    }
  }

  const handleUpdateStudent = async (id, studentData) => {
    try {
      await axios.put(`/api/students/${id}`, studentData)
      fetchStudents()
      setEditingStudent(null)
    } catch (error) {
      console.error('Error updating student:', error)
      alert('Failed to update student')
    }
  }

  const handleDeleteStudent = async (id) => {
    try {
      await axios.delete(`/api/students/${id}`)
      fetchStudents()
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Error deleting student:', error)
      alert('Failed to delete student')
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const handleExportPDF = () => {
    exportToPDF(students)
  }

  const handleExportKEMIS = (format) => {
    exportToKEMIS(students, format)
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
          <h1 className="text-2xl font-bold text-gray-800">Student Management</h1>
          <p className="text-gray-500">Manage student records</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary flex items-center gap-1 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add
          </button>
          
          <button
            onClick={handleExportPDF}
            className="btn btn-secondary flex items-center gap-1 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            PDF
          </button>
          
          <button
            onClick={() => handleExportKEMIS('csv')}
            className="btn bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-1 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            CSV
          </button>

          <button
            onClick={() => setShowClassFees(true)}
            className="btn bg-orange-500 text-white hover:bg-orange-600 flex items-center gap-1 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Class Fees
          </button>
        </div>
      </div>

      <div className="card">
        <div className="mb-4">
          <div className="relative">
            <svg className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name or admission number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Admission No.</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Grade</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Gender</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Guardian</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600">Fees (KES)</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-gray-500">
                    No students found
                  </td>
                </tr>
              ) : (
                students.map((student, index) => (
                  <tr key={student.id} className={`border-b border-gray-100 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-800">{student.full_name}</p>
                        <p className="text-xs text-gray-500">{student.date_of_birth || 'No DOB'}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-blue-100 text-kenyan-blue px-2 py-1 rounded text-sm font-medium">
                        {student.admission_no}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium">Grade {student.grade}</span>
                    </td>
                    <td className="py-3 px-4 capitalize">{student.gender}</td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-sm">{student.guardian_name}</p>
                        <p className="text-xs text-gray-500">{student.guardian_contact || 'No contact'}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-kenyan-green">
                      {formatCurrency(student.fee_paid)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setEditingStudent(student)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(student)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 text-sm text-gray-500">
          Total: {students.length} student{students.length !== 1 ? 's' : ''}
        </div>
      </div>

      {showForm && (
        <StudentForm 
          onSubmit={handleAddStudent}
          onClose={() => setShowForm(false)}
        />
      )}

      {editingStudent && (
        <EditStudentModal
          student={editingStudent}
          onSubmit={(data) => handleUpdateStudent(editingStudent.id, data)}
          onClose={() => setEditingStudent(null)}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Delete Student</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{deleteConfirm.full_name}</strong> (Admission: {deleteConfirm.admission_no})?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="btn bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteStudent(deleteConfirm.id)}
                className="btn btn-danger"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showClassFees && (
        <ClassFeesModal onClose={() => setShowClassFees(false)} />
      )}
    </div>
  )
}
