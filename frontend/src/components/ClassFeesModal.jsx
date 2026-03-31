import { useState, useEffect } from 'react'
import api from '../api'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const grades = ['1', '2', '3', '4', '5', '6', '7', '8']
const feePerGrade = 5000

export default function ClassFeesModal({ onClose }) {
  const [students, setStudents] = useState([])
  const [selectedGrade, setSelectedGrade] = useState('1')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStudents()
  }, [selectedGrade])

  const fetchStudents = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/students')
      setStudents(res.data)
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoading(false)
    }
  }

  const gradeStudents = students.filter(s => s.grade === selectedGrade)
  const totalFees = gradeStudents.length * feePerGrade
  const totalPaid = gradeStudents.reduce((sum, s) => sum + (s.fee_paid || 0), 0)
  const totalRemaining = totalFees - totalPaid

  const downloadPDF = () => {
    const doc = new jsPDF()
    
    const schoolInfo = JSON.parse(localStorage.getItem('schoolInfo') || '{}')
    const currentDate = new Date()
    const formattedDate = currentDate.toLocaleDateString('en-GB', { 
      day: '2-digit', month: 'long', year: 'numeric' 
    })
    const formattedTime = currentDate.toLocaleTimeString('en-GB', { 
      hour: '2-digit', minute: '2-digit' 
    })
    
    doc.setFontSize(18)
    doc.setTextColor(0, 51, 102)
    doc.text(schoolInfo.motto ? 'Smart School Academy' : 'School', 105, 15, { align: 'center' })
    
    doc.setFontSize(14)
    doc.setTextColor(50)
    doc.text(`Class Fees Report - Grade ${selectedGrade}`, 105, 25, { align: 'center' })
    
    doc.setFontSize(11)
    doc.setTextColor(100)
    doc.text(`Total Students: ${gradeStudents.length} | Total Fees: KES ${totalFees.toLocaleString()} | Paid: KES ${totalPaid.toLocaleString()} | Balance: KES ${totalRemaining.toLocaleString()}`, 105, 33, { align: 'center' })
    doc.text(`Generated: ${formattedDate} at ${formattedTime}`, 105, 40, { align: 'center' })

    const tableData = gradeStudents
      .sort((a, b) => a.full_name.localeCompare(b.full_name))
      .map((s, idx) => {
        const paid = s.fee_paid || 0
        const balance = Math.max(0, feePerGrade - paid)
        return [
          idx + 1,
          s.full_name,
          s.admission_no,
          `KES ${paid.toLocaleString()}`,
          `KES ${balance.toLocaleString()}`,
          paid >= feePerGrade ? 'PAID' : balance > 0 ? 'PARTIAL' : 'NONE'
        ]
      })

    autoTable(doc, {
      head: [['#', 'Student Name', 'Adm. No.', 'Paid (KES)', 'Balance (KES)', 'Status']],
      body: tableData,
      startY: 48,
      theme: 'grid',
      headStyles: {
        fillColor: [0, 51, 102],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      styles: {
        fontSize: 9,
        cellPadding: 3
      }
    })

    const finalY = doc.lastAutoTable.finalY + 10
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(`Class Summary: Total Students: ${gradeStudents.length} | Total Required: KES ${totalFees.toLocaleString()} | Total Paid: KES ${totalPaid.toLocaleString()} | Total Balance: KES ${totalRemaining.toLocaleString()}`, 14, finalY)

    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(`Report Generated: ${formattedDate} at ${formattedTime} - SIFUNA CODEX COMPANY`, 105, 285, { align: 'center' })

    const today = new Date()
    const dateStr = `${today.getFullYear()}${String(today.getMonth()+1).padStart(2,'0')}${String(today.getDate()).padStart(2,'0')}`
    doc.save(`Grade${selectedGrade}_Fees_Report_${dateStr}.pdf`)
  }

  const downloadCSV = () => {
    const headers = ['#', 'Student Name', 'Admission No.', 'Gender', 'Guardian', 'Phone', 'Paid (KES)', 'Balance (KES)', 'Status']
    
    const rows = gradeStudents
      .sort((a, b) => a.full_name.localeCompare(b.full_name))
      .map((s, idx) => {
        const paid = s.fee_paid || 0
        const balance = Math.max(0, feePerGrade - paid)
        return [
          idx + 1,
          s.full_name,
          s.admission_no,
          s.gender,
          s.guardian_name,
          s.guardian_contact || '',
          paid,
          balance,
          paid >= feePerGrade ? 'PAID' : balance > 0 ? 'PARTIAL' : 'NONE'
        ]
      })
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Grade${selectedGrade}_Fees_Report.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 bg-kenyan-blue">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Class Fees Report</h2>
              <p className="text-blue-200 text-sm">View fees by class</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-4 bg-gray-50 border-b">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Select Class:</label>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="select w-40"
              >
                {grades.map(g => (
                  <option key={g} value={g}>Grade {g}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={downloadPDF}
                className="btn bg-red-600 text-white hover:bg-red-700 flex items-center gap-1 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                PDF
              </button>
              <button
                onClick={downloadCSV}
                className="btn bg-green-600 text-white hover:bg-green-700 flex items-center gap-1 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                CSV
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50">
          <div className="bg-white rounded-lg p-4 shadow-sm text-center">
            <p className="text-2xl font-bold text-kenyan-blue">{gradeStudents.length}</p>
            <p className="text-sm text-gray-500">Students</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm text-center">
            <p className="text-2xl font-bold text-kenyan-blue">KES {totalFees.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Total Required</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm text-center">
            <p className="text-2xl font-bold text-green-600">KES {totalPaid.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Total Paid</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm text-center">
            <p className="text-2xl font-bold text-red-600">KES {totalRemaining.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Total Balance</p>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kenyan-blue"></div>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-300 bg-gray-100">
                  <th className="text-center py-2 px-2 font-bold text-gray-700 w-12">#</th>
                  <th className="text-left py-2 px-2 font-bold text-gray-700">Student Name</th>
                  <th className="text-left py-2 px-2 font-bold text-gray-700">Adm. No.</th>
                  <th className="text-left py-2 px-2 font-bold text-gray-700">Guardian</th>
                  <th className="text-right py-2 px-2 font-bold text-gray-700">Paid (KES)</th>
                  <th className="text-right py-2 px-2 font-bold text-gray-700">Balance (KES)</th>
                  <th className="text-center py-2 px-2 font-bold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {gradeStudents.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-gray-500">
                      No students in Grade {selectedGrade}
                    </td>
                  </tr>
                ) : (
                  gradeStudents
                    .sort((a, b) => a.full_name.localeCompare(b.full_name))
                    .map((student, idx) => {
                      const paid = student.fee_paid || 0
                      const balance = Math.max(0, feePerGrade - paid)
                      return (
                        <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-2 text-center text-gray-500">{idx + 1}</td>
                          <td className="py-2 px-2 font-medium">{student.full_name}</td>
                          <td className="py-2 px-2 text-gray-600">{student.admission_no}</td>
                          <td className="py-2 px-2 text-gray-600 text-sm">{student.guardian_name}</td>
                          <td className="py-2 px-2 text-right font-medium text-green-600">KES {paid.toLocaleString()}</td>
                          <td className="py-2 px-2 text-right font-medium text-red-600">KES {balance.toLocaleString()}</td>
                          <td className="py-2 px-2 text-center">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              paid >= feePerGrade ? 'bg-green-100 text-green-800' :
                              paid > 0 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {paid >= feePerGrade ? 'PAID' : paid > 0 ? 'PARTIAL' : 'NONE'}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
