import { useState, useEffect } from 'react'
import api from '../../api'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const times = ['7:30 - 8:00', '8:00 - 8:40', '8:40 - 9:20', '9:20 - 9:40', '9:40 - 10:20',
  '10:20 - 11:00', '11:00 - 11:40', '11:40 - 12:20', '12:20 - 1:00', '1:00 - 1:40']

export default function StudentTimetable({ student, refreshKey }) {
  const [timetable, setTimetable] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTimetable()
  }, [student.grade, refreshKey])

  const fetchTimetable = async () => {
    try {
      const res = await api.get(`/api/timetable/${student.grade}`)
      if (res.data.schedule) setTimetable(res.data.schedule)
    } catch (error) {
      console.error('Error fetching timetable:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadTimetablePDF = () => {
    if (!timetable || Object.keys(timetable).length === 0) {
      alert('No timetable available to download.')
      return
    }
    try {
      const doc = new jsPDF()
      const schoolInfo = JSON.parse(localStorage.getItem('schoolInfo') || '{}')
      const currentDate = new Date()
      const formattedDate = currentDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })

      doc.setFontSize(18)
      doc.setTextColor(0, 51, 102)
      doc.text(schoolInfo.name || 'Masinde Muliro School', 105, 15, { align: 'center' })
      doc.setFontSize(14)
      doc.setTextColor(50)
      doc.text('Class Timetable', 105, 25, { align: 'center' })
      doc.setFontSize(10)
      doc.setTextColor(100)
      doc.text(`Grade: ${student.grade || '-'}`, 105, 33, { align: 'center' })
      
      doc.setFontSize(11)
      doc.setTextColor(80)
      doc.text(`Name: ${student.full_name || '-'}`, 14, 45)
      doc.text(`Admission No: ${student.username || '-'}`, 14, 52)

      const tableBody = times.map((time, idx) => {
        const rowLabel = idx === 0 ? 'Assembly' : idx === 4 || idx === 8 ? 'Break' : idx === 9 ? 'Lunch' : time
        const row = [rowLabel]
        days.forEach(day => {
          const subject = timetable[day]?.[time] || '-'
          row.push(subject)
        })
        return row
      })

      autoTable(doc, {
        startY: 60,
        head: [['Time', ...days]],
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: [0, 51, 102], fontSize: 8 },
        bodyStyles: { fontSize: 7 },
        columnStyles: { 0: { cellWidth: 25 } }
      })

      doc.setFontSize(8)
      doc.setTextColor(150)
      doc.text(`Generated: ${formattedDate}`, 105, 285, { align: 'center' })

      const filename = `${student.username || 'student'}_Timetable.pdf`
      doc.save(filename)
    } catch (error) {
      console.error('Error generating timetable PDF:', error)
      alert('Failed to generate timetable PDF.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700"></div>
      </div>
    )
  }

  const hasTimetable = timetable && Object.keys(timetable).length > 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
          <span className="text-3xl">🕐</span> Class Timetable
        </h2>
        {hasTimetable && (
          <button onClick={downloadTimetablePDF} className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-5 py-2.5 rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition shadow">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download as PDF
          </button>
        )}
      </div>

      {hasTimetable ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="bg-gradient-to-r from-blue-700 to-blue-800 text-white">
                  <th className="py-4 px-4 text-left font-semibold">Time</th>
                  {days.map(day => (
                    <th key={day} className="py-4 px-3 text-center font-semibold">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {times.map((time, idx) => {
                  const isBreak = idx === 4 || idx === 8
                  const isLunch = idx === 9
                  const isAssembly = idx === 0
                  const rowBg = isBreak || isLunch ? 'bg-yellow-50' : idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                  
                  return (
                    <tr key={time} className={`${rowBg} border-b border-gray-100`}>
                      <td className={`py-3 px-4 text-sm font-medium ${isBreak || isLunch || isAssembly ? 'text-amber-700' : 'text-gray-700'}`}>
                        {isAssembly ? 'ASM' : isBreak ? 'BREAK' : isLunch ? 'LUNCH' : time}
                      </td>
                      {days.map(day => {
                        const subject = timetable[day]?.[time] || '-'
                        const isSpecial = subject === 'BREAK' || subject === 'LUNCH' || subject === 'ASSEMBLY'
                        return (
                          <td key={`${day}-${time}`} className={`py-3 px-3 text-center text-sm ${isSpecial ? 'text-amber-700 font-medium' : subject !== '-' ? 'text-gray-800' : 'text-gray-400'}`}>
                            {subject !== '-' ? subject : '-'}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Timetable Available</h3>
          <p className="text-gray-500">Your class timetable has not been set up yet.</p>
        </div>
      )}
    </div>
  )
}
