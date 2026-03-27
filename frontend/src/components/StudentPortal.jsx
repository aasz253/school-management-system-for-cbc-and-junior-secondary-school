import { useState, useEffect } from 'react'
import axios from 'axios'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const subjects = [
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

export default function StudentPortal({ student, onLogout }) {
  const [portalData, setPortalData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedTerm, setSelectedTerm] = useState('')

  useEffect(() => {
    fetchPortalData()
  }, [student.id])

  const fetchPortalData = async () => {
    try {
      const res = await axios.get(`/api/student/portal/${student.id}`)
      setPortalData(res.data)
      if (res.data.terms.length > 0) {
        setSelectedTerm(res.data.terms[0])
      }
    } catch (error) {
      console.error('Error fetching portal data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPerformanceColor = (performance) => {
    if (performance === 'Excellent' || performance === 'Very Good') return 'bg-green-500'
    if (performance === 'Good') return 'bg-blue-500'
    if (performance === 'Fair') return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getGradeColor = (score) => {
    if (score >= 80) return 'bg-green-100 text-green-800'
    if (score >= 70) return 'bg-blue-100 text-blue-800'
    if (score >= 60) return 'bg-blue-50 text-blue-700'
    if (score >= 50) return 'bg-yellow-100 text-yellow-800'
    if (score >= 40) return 'bg-orange-100 text-orange-800'
    return 'bg-red-100 text-red-800'
  }

  const getGradeLetter = (score) => {
    if (score >= 80) return 'A'
    if (score >= 70) return 'B+'
    if (score >= 60) return 'B'
    if (score >= 50) return 'C'
    if (score >= 40) return 'D'
    return 'E'
  }

  const getGradeLabel = (performance) => {
    if (performance === 'Excellent') return 'EXCELLENT'
    if (performance === 'Very Good') return 'VERY GOOD'
    if (performance === 'Good') return 'GOOD'
    if (performance === 'Fair') return 'FAIR'
    return 'NEEDS IMPROVEMENT'
  }

  const downloadPDF = (selectedTermYear = null) => {
    if (!portalData) return

    const doc = new jsPDF()
    const schoolInfo = JSON.parse(localStorage.getItem('schoolInfo') || '{}')
    const currentDate = new Date()
    const formattedDate = currentDate.toLocaleDateString('en-GB', { 
      day: '2-digit', month: 'long', year: 'numeric' 
    })
    const formattedTime = currentDate.toLocaleTimeString('en-GB', { 
      hour: '2-digit', minute: '2-digit' 
    })

    const termYear = selectedTermYear || (portalData.terms && portalData.terms[0]) || 'Term 1-2026'
    const [term, year] = termYear.split('-')

    doc.setFontSize(18)
    doc.setTextColor(0, 51, 102)
    doc.text(schoolInfo.motto ? 'CBC Smart School' : 'School', 105, 15, { align: 'center' })

    doc.setFontSize(14)
    doc.setTextColor(50)
    doc.text('Student Report Card', 105, 25, { align: 'center' })

    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(`Term: ${term} | Year: ${year}`, 105, 33, { align: 'center' })

    doc.setFontSize(11)
    doc.setTextColor(80)
    doc.text(`Name: ${portalData.student.full_name}`, 14, 45)
    doc.text(`Admission No: ${portalData.student.admission_no}`, 14, 52)
    doc.text(`Grade: ${portalData.student.grade}`, 14, 59)

    const feePerGrade = 5000
    const totalFees = feePerGrade
    const feesPaid = portalData.student.fee_paid || 0
    const feesBalance = Math.max(0, totalFees - feesPaid)

    doc.setFontSize(12)
    doc.setTextColor(0)
    doc.text('Fee Status', 14, 65)
    
    autoTable(doc, {
      startY: 70,
      head: [['Total Fees', 'Paid', 'Balance']],
      body: [[`KES ${totalFees.toLocaleString()}`, `KES ${feesPaid.toLocaleString()}`, `KES ${feesBalance.toLocaleString()}`]],
      theme: 'grid',
      headStyles: { fillColor: [0, 51, 102] }
    })

    doc.setFontSize(12)
    doc.setTextColor(0)
    doc.text('Academic Performance', 14, doc.lastAutoTable.finalY + 15)

    const termScores = portalData.terms.map(term => {
      const termData = portalData.scores[term]
      const scores = subjects.map(sub => termData?.subjects?.[sub] || '-')
      return [term, ...scores]
    })

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Term', ...subjects.map(s => s.substring(0, 3))]],
      body: termScores,
      theme: 'grid',
      headStyles: { fillColor: [0, 51, 102], fontSize: 7 },
      bodyStyles: { fontSize: 7 },
      columnStyles: { 0: { cellWidth: 25 } }
    })

    doc.setFontSize(12)
    doc.text('Summary', 14, doc.lastAutoTable.finalY + 15)
    
    const summaryData = [
      ['Total Score', portalData.totalScore.toString()],
      ['Average', `${portalData.average}%`],
      ['Class Position', `${portalData.position} of ${portalData.student.grade}`],
      ['Performance', portalData.performance]
    ]

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [0, 51, 102] }
    })

    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(`Generated: ${formattedDate} at ${formattedTime} - SIFUNA CODEX COMPANY`, 105, 285, { align: 'center' })

    const filename = `${portalData.student.admission_no}_${term}_${year}_Report.pdf`
    doc.save(filename)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kenyan-blue"></div>
      </div>
    )
  }

  const feePerGrade = 5000
  const totalFees = feePerGrade
  const feesPaid = portalData.student.fee_paid || 0
  const feesBalance = Math.max(0, totalFees - feesPaid)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-kenyan-blue text-white p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Student Portal</h1>
            <p className="text-blue-200 text-sm">{portalData.student.full_name}</p>
          </div>
          <button
            onClick={onLogout}
            className="bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30 text-sm"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">My Details</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Admission No.</p>
              <p className="font-semibold">{portalData.student.admission_no}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Grade</p>
              <p className="font-semibold">Grade {portalData.student.grade}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Gender</p>
              <p className="font-semibold capitalize">{portalData.student.gender}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Guardian</p>
              <p className="font-semibold text-sm">{portalData.student.guardian_name}</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-sm text-gray-500 mb-2">Total Fees</h3>
            <p className="text-2xl font-bold text-kenyan-blue">KES {totalFees.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-sm text-gray-500 mb-2">Fees Paid</h3>
            <p className="text-2xl font-bold text-green-600">KES {feesPaid.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-sm text-gray-500 mb-2">Balance</h3>
            <p className={`text-2xl font-bold ${feesBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              KES {feesBalance.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800">Academic Performance</h2>
            <span className={`px-4 py-2 rounded-full text-white font-bold ${getPerformanceColor(portalData.performance)}`}>
              {getGradeLabel(portalData.performance)}
            </span>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-kenyan-blue">{portalData.average}%</p>
              <p className="text-sm text-gray-500">Average</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-kenyan-blue">{portalData.position}</p>
              <p className="text-sm text-gray-500">Position in Class</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-kenyan-blue">{portalData.totalScore}</p>
              <p className="text-sm text-gray-500">Total Marks</p>
            </div>
          </div>

          {portalData.terms.length > 0 && (
            <>
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700">Select Term:</label>
                <select
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                  className="select ml-2"
                >
                  {portalData.terms.map(term => (
                    <option key={term} value={term}>{term}</option>
                  ))}
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-300 bg-gray-100">
                      <th className="text-left py-2 px-3 font-bold text-gray-700">Subject</th>
                      <th className="text-center py-2 px-3 font-bold text-gray-700">Marks</th>
                      <th className="text-center py-2 px-3 font-bold text-gray-700">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map(sub => {
                      const score = portalData.scores[selectedTerm]?.subjects?.[sub] || 0
                      return (
                        <tr key={sub} className="border-b border-gray-100">
                          <td className="py-2 px-3 font-medium">{sub}</td>
                          <td className="py-2 px-3 text-center">{score || '-'}</td>
                          <td className="py-2 px-3 text-center">
                            {score > 0 && (
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getGradeColor(score)}`}>
                                {getGradeLetter(score)}
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <button
          onClick={downloadPDF}
          className="w-full btn bg-kenyan-blue text-white py-4 text-lg font-bold flex items-center justify-center gap-2"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download My Report (PDF)
        </button>

        <footer className="text-center py-4 text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} SIFUNA CODEX COMPANY
        </footer>
      </div>
    </div>
  )
}
