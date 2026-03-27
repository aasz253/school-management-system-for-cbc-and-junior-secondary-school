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

const terms = ['Term 1', 'Term 2', 'Term 3']
const currentYear = new Date().getFullYear()
const years = [currentYear, currentYear - 1]
const grades = ['1', '2', '3', '4', '5', '6', '7', '8']

export default function Academic() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedGrade, setSelectedGrade] = useState('1')
  const [selectedTerm, setSelectedTerm] = useState('Term 1')
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [scoresData, setScoresData] = useState({})
  const [view, setView] = useState('marks')
  const [saving, setSaving] = useState(false)
  const [existingScores, setExistingScores] = useState([])

  useEffect(() => {
    fetchStudents()
  }, [])

  useEffect(() => {
    fetchExistingScores()
  }, [selectedGrade, selectedTerm, selectedYear])

  const fetchStudents = async () => {
    try {
      const res = await axios.get('/api/students')
      setStudents(res.data)
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchExistingScores = async () => {
    try {
      const res = await axios.get('/api/scores')
      setExistingScores(res.data)
    } catch (error) {
      console.error('Error fetching scores:', error)
    }
  }

  const getStudentScore = (studentId, subject) => {
    const key = `${selectedGrade}-${selectedTerm}-${selectedYear}-${subject}`
    return scoresData[key]?.[studentId] || ''
  }

  const handleScoreChange = (studentId, subject, value) => {
    const key = `${selectedGrade}-${selectedTerm}-${selectedYear}-${subject}`
    setScoresData(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        [studentId]: value
      }
    }))
  }

  const handleSaveScores = async () => {
    setSaving(true)
    
    try {
      for (const subject of subjects) {
        const key = `${selectedGrade}-${selectedTerm}-${selectedYear}-${subject}`
        const gradeStudents = students.filter(s => s.grade === selectedGrade)
        
        for (const student of gradeStudents) {
          const score = parseInt(scoresData[key]?.[student.id]) || 0
          if (score > 0) {
            const existing = existingScores.find(s => 
              s.student_id === student.id && 
              s.subject === subject &&
              s.term === selectedTerm &&
              s.year === selectedYear
            )
            
            if (existing) {
              await axios.put(`/api/scores/${existing.id}`, { score })
            } else {
              await axios.post('/api/scores', {
                student_id: student.id,
                subject: subject,
                score: score,
                term: selectedTerm,
                year: selectedYear
              })
            }
          }
        }
      }
      alert('All scores saved successfully!')
      fetchExistingScores()
    } catch (error) {
      console.error('Error saving scores:', error)
      alert('Failed to save scores')
    } finally {
      setSaving(false)
    }
  }

  const loadExistingScoresToForm = () => {
    const newScoresData = {}
    
    subjects.forEach(subject => {
      const key = `${selectedGrade}-${selectedTerm}-${selectedYear}-${subject}`
      newScoresData[key] = {}
      
      existingScores.forEach(s => {
        if (s.grade === selectedGrade && 
            s.subject === subject && 
            s.term === selectedTerm && 
            s.year === selectedYear) {
          newScoresData[key][s.student_id] = s.score
        }
      })
    })
    
    setScoresData(newScoresData)
  }

  useEffect(() => {
    if (existingScores.length > 0) {
      loadExistingScoresToForm()
    }
  }, [existingScores, selectedGrade, selectedTerm, selectedYear])

  const getStudentTotal = (studentId) => {
    let total = 0
    subjects.forEach(subject => {
      const score = parseInt(getStudentScore(studentId, subject)) || 0
      total += score
    })
    return total
  }

  const getStudentMean = (studentId) => {
    let total = 0
    let count = 0
    subjects.forEach(subject => {
      const score = parseInt(getStudentScore(studentId, subject)) || 0
      if (score > 0) {
        total += score
        count++
      }
    })
    return count > 0 ? (total / count).toFixed(1) : 0
  }

  const getSubjectAverage = (subject) => {
    const gradeStudents = students.filter(s => s.grade === selectedGrade)
    let total = 0
    let count = 0
    
    gradeStudents.forEach(student => {
      const score = parseInt(getStudentScore(student.id, subject)) || 0
      if (score > 0) {
        total += score
        count++
      }
    })
    
    return count > 0 ? (total / count).toFixed(1) : 0
  }

  const getClassMean = () => {
    const gradeStudents = students.filter(s => s.grade === selectedGrade)
    let grandTotal = 0
    let totalStudents = 0
    
    gradeStudents.forEach(student => {
      const mean = parseFloat(getStudentMean(student.id))
      if (mean > 0) {
        grandTotal += mean
        totalStudents++
      }
    })
    
    return totalStudents > 0 ? (grandTotal / totalStudents).toFixed(1) : 0
  }

  const getGradeStudentsOrdered = () => {
    return students.filter(s => s.grade === selectedGrade)
  }

  const getRankedStudents = () => {
    const gradeStudents = students.filter(s => s.grade === selectedGrade)
    return gradeStudents
      .map(s => ({
        ...s,
        total: getStudentTotal(s.id),
        mean: parseFloat(getStudentMean(s.id))
      }))
      .sort((a, b) => b.total - a.total)
      .map((s, idx) => ({ ...s, position: idx + 1 }))
  }

  const getStudentPosition = (studentId) => {
    const ranked = getRankedStudents()
    const student = ranked.find(s => s.id === studentId)
    return student ? student.position : '-'
  }

  const exportResultsPDF = () => {
    const rankedStudents = getRankedStudents()
    const doc = new jsPDF('landscape')
    
    const schoolInfo = JSON.parse(localStorage.getItem('schoolInfo') || '{}')
    const currentDate = new Date()
    const formattedDate = currentDate.toLocaleDateString('en-GB', { 
      day: '2-digit', month: 'long', year: 'numeric' 
    })
    const formattedTime = currentDate.toLocaleTimeString('en-GB', { 
      hour: '2-digit', minute: '2-digit' 
    })
    
    doc.setFontSize(16)
    doc.setTextColor(0, 51, 102)
    doc.text(schoolInfo.motto ? 'CBC Smart School' : 'School', 148, 12, { align: 'center' })
    
    doc.setFontSize(12)
    doc.setTextColor(50)
    doc.text(`Class Report - Grade ${selectedGrade} | ${selectedTerm} ${selectedYear}`, 148, 20, { align: 'center' })
    
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(`Class Mean: ${getClassMean()}% | Total Students: ${rankedStudents.length}`, 148, 26, { align: 'center' })
    doc.text(`Generated: ${formattedDate} at ${formattedTime}`, 148, 32, { align: 'center' })

    const tableHead = [['Pos', 'Student Name', 'Adm No', ...subjects.map(s => s.substring(0, 3)), 'Total', 'Mean']]
    
    const tableData = rankedStudents.map(s => [
      s.position,
      s.full_name,
      s.admission_no,
      ...subjects.map(subj => getStudentScore(s.id, subj) || '-'),
      s.total,
      s.mean + '%'
    ])

    autoTable(doc, {
      head: tableHead,
      body: tableData,
      startY: 38,
      theme: 'grid',
      headStyles: {
        fillColor: [0, 51, 102],
        textColor: 255,
        fontSize: 6,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 6
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      styles: {
        cellPadding: 0.5,
        overflow: 'linebreak'
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 35 },
        2: { cellWidth: 22, halign: 'center' }
      }
    })

    const finalY = doc.lastAutoTable.finalY + 8
    
    doc.setFontSize(9)
    doc.setTextColor(100)
    
    const subjectAvgs = subjects.map(sub => getSubjectAverage(sub) + '%').join(' | ')
    doc.text(`Subject Averages: ${subjectAvgs}`, 148, finalY, { align: 'center' })

    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(`Report Generated: ${formattedDate} at ${formattedTime} - SIFUNA CODEX COMPANY`, 148, 192, { align: 'center' })

    const filename = `Grade${selectedGrade}_${selectedTerm}_${selectedYear}_Report.pdf`
    doc.save(filename)
  }

  const exportResultsCSV = () => {
    const rankedStudents = getRankedStudents()
    
    const headers = ['Position', 'Student Name', 'Admission No.', ...subjects, 'Total', 'Mean']
    
    const rows = rankedStudents.map(s => [
      s.position,
      s.full_name,
      s.admission_no,
      ...subjects.map(subj => getStudentScore(s.id, subj) || ''),
      s.total,
      s.mean
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Grade${selectedGrade}_${selectedTerm}_${selectedYear}_Report.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const gradeStudents = students.filter(s => s.grade === selectedGrade)
  const rankedStudents = getRankedStudents()

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
          <h1 className="text-2xl font-bold text-gray-800">Academic Results</h1>
          <p className="text-gray-500">Enter marks and view rankings</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class (Grade)</label>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="select"
            >
              {terms.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="select"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="ml-auto flex gap-2 flex-wrap">
            <button 
              onClick={exportResultsPDF}
              className="btn bg-red-600 text-white hover:bg-red-700 flex items-center gap-1 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              PDF
            </button>
            <button 
              onClick={exportResultsCSV}
              className="btn bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              CSV
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setView('marks')}
          className={`px-4 py-2 font-medium ${view === 'marks' ? 'border-b-2 border-kenyan-blue text-kenyan-blue' : 'text-gray-500'}`}
        >
          Enter Marks
        </button>
        <button
          onClick={() => setView('rankings')}
          className={`px-4 py-2 font-medium ${view === 'rankings' ? 'border-b-2 border-kenyan-blue text-kenyan-blue' : 'text-gray-500'}`}
        >
          Rankings
        </button>
      </div>

      {view === 'marks' && (
        <div className="card">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Enter Marks - Grade {selectedGrade} | {selectedTerm} {selectedYear}
            </h3>
            <p className="text-sm text-gray-500">
              Class Mean: <span className="font-bold text-kenyan-blue">{getClassMean()}%</span>
            </p>
          </div>

          {gradeStudents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <p className="text-lg font-medium">No students in Grade {selectedGrade}</p>
              <p>Add students first to enter marks</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full min-w-[1100px]">
              <thead>
                <tr className="border-b-2 border-gray-300 bg-gray-100">
                  <th className="text-center py-2 px-2 font-bold text-gray-700 w-10">#</th>
                  <th className="text-left py-2 px-2 font-bold text-gray-700 w-40">Student Name</th>
                  <th className="text-left py-2 px-2 font-bold text-gray-700 w-28">Adm No.</th>
                  {subjects.slice(0, 10).map(sub => (
                    <th key={sub} className="text-center py-2 px-1 font-bold text-gray-700 w-16" title={sub}>
                      {sub.substring(0, 3)}
                    </th>
                  ))}
                  <th className="text-center py-2 px-2 font-bold text-gray-700 w-16 bg-blue-50">Total</th>
                  <th className="text-center py-2 px-2 font-bold text-gray-700 w-16 bg-blue-50">Mean</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const orderedStudents = getGradeStudentsOrdered()
                  return orderedStudents.map((student, idx) => (
                    <tr key={student.id} className="border-b border-gray-100 hover:bg-blue-50">
                    <td className="py-2 px-2 text-center text-gray-500 text-sm">{idx + 1}</td>
                    <td className="py-2 px-2 font-medium text-gray-800 text-sm">{student.full_name}</td>
                    <td className="py-2 px-2 text-gray-600 text-sm">{student.admission_no}</td>
                    {subjects.map(sub => (
                      <td key={`${student.id}-${sub}`} className="py-2 px-1">
                        <input
                          type="number"
                          autoComplete="off"
                          onWheel={(e) => e.target.blur()}
                          value={getStudentScore(student.id, sub)}
                          onChange={(e) => handleScoreChange(student.id, sub, e.target.value)}
                          className="input text-center text-sm w-full no-spinners"
                          min="0"
                          max="100"
                          placeholder="-"
                        />
                      </td>
                    ))}
                    <td className="py-2 px-2 text-center font-bold text-kenyan-blue bg-blue-50">
                      {getStudentTotal(student.id)}
                    </td>
                    <td className="py-2 px-2 text-center font-bold text-kenyan-blue bg-blue-50">
                      {getStudentMean(student.id)}%
                    </td>
                  </tr>
                  ))
                })()}
                <tr className="bg-gray-100 font-bold">
                  <td colSpan="3" className="py-2 px-2 text-right text-gray-700">Subject Average</td>
                  {subjects.map(sub => (
                    <td key={sub} className="py-2 px-1 text-center text-gray-700">
                      {getSubjectAverage(sub)}%
                    </td>
                  ))}
                  <td className="py-2 px-2 text-center bg-blue-100 text-center">{getClassMean()}%</td>
                  <td className="py-2 px-2 text-center bg-blue-100 text-center">-</td>
                </tr>
              </tbody>
            </table>
            </div>
          )}

          {gradeStudents.length > 0 && (
            <div className="mt-4 flex justify-end">
              <button 
                onClick={handleSaveScores}
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? 'Saving...' : 'Save All Scores'}
              </button>
            </div>
          )}
        </div>
      )}

      {view === 'rankings' && (
        <div className="card overflow-x-auto">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Class Rankings - Grade {selectedGrade} | {selectedTerm} {selectedYear}
            </h3>
            <p className="text-sm text-gray-500">
              Class Mean: <span className="font-bold text-kenyan-blue">{getClassMean()}%</span> | 
              Total Students: <span className="font-bold">{rankedStudents.length}</span>
            </p>
          </div>

          {rankedStudents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No students in this class
            </div>
          ) : (
            <table className="w-full min-w-[1400px]">
              <thead>
                <tr className="border-b-2 border-gray-300 bg-gray-100">
                  <th className="text-center py-3 px-2 font-bold text-gray-700 w-12">Pos</th>
                  <th className="text-left py-3 px-2 font-bold text-gray-700 w-36">Student Name</th>
                  <th className="text-left py-3 px-2 font-bold text-gray-700 w-24">Adm No.</th>
                  {subjects.map(sub => (
                    <th key={sub} className="text-center py-3 px-1 font-bold text-gray-700 w-14" title={sub}>
                      {sub.substring(0, 3)}
                    </th>
                  ))}
                  <th className="text-center py-3 px-2 font-bold text-gray-700 bg-blue-50 w-16">Total</th>
                  <th className="text-center py-3 px-2 font-bold text-gray-700 bg-blue-50 w-16">Mean</th>
                </tr>
              </thead>
              <tbody>
                {rankedStudents.map((student, idx) => (
                  <tr key={student.id} className={`border-b border-gray-100 hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                    <td className="py-2 px-2 text-center">
                      <span className={`inline-block px-2 py-1 rounded-full text-sm font-bold ${
                        student.position === 1 ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300' :
                        student.position === rankedStudents.length ? 'bg-red-100 text-red-800 border-2 border-red-300' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {student.position}
                      </span>
                    </td>
                    <td className="py-2 px-2 font-medium text-gray-800 text-sm">{student.full_name}</td>
                    <td className="py-2 px-2 text-gray-600 text-sm">{student.admission_no}</td>
                    {subjects.map(sub => {
                      const score = parseInt(getStudentScore(student.id, sub)) || 0
                      return (
                        <td key={sub} className="py-2 px-1 text-center">
                          <span className={`px-1 py-1 rounded text-xs ${
                            score >= 80 ? 'bg-green-100 text-green-800' :
                            score >= 60 ? 'bg-blue-100 text-blue-800' :
                            score >= 40 ? 'bg-yellow-100 text-yellow-800' :
                            score > 0 ? 'bg-red-100 text-red-800' : 'text-gray-400'
                          }`}>
                            {score || '-'}
                          </span>
                        </td>
                      )
                    })}
                    <td className="py-2 px-3 text-center font-bold text-kenyan-blue bg-blue-50">
                      {student.total}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className={`px-2 py-1 rounded text-sm font-bold ${
                        student.mean >= 80 ? 'bg-green-500 text-white' :
                        student.mean >= 60 ? 'bg-blue-500 text-white' :
                        student.mean >= 40 ? 'bg-yellow-500 text-white' : 'bg-red-500 text-white'
                      }`}>
                        {student.mean}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
