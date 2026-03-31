import { useState, useEffect, useRef } from 'react'
import api from '../api'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import StudentAssignments from './student/StudentAssignments'
import StudentTimetable from './student/StudentTimetable'
import StudentNews from './student/StudentNews'
import StudentSports from './student/StudentSports'

const subjects = [
  'English', 'Kiswahili', 'Mathematics', 'Science', 'Social Studies',
  'Religious Education', 'Creative Arts', 'Physical & Health Education',
  'Agriculture', 'Life Skills'
]

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const times = ['7:30 - 8:00', '8:00 - 8:40', '8:40 - 9:20', '9:20 - 9:40', '9:40 - 10:20',
  '10:20 - 11:00', '11:00 - 11:40', '11:40 - 12:20', '12:20 - 1:00', '1:00 - 1:40']

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { id: 'assignments', label: 'My Assignments', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { id: 'timetable', label: 'Class Timetable', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { id: 'news', label: 'News & Announcements', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z' },
  { id: 'sports', label: 'Games & Sports', icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'results', label: 'My Results', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
]

export default function StudentPortal({ student, onLogout }) {
  const [portalData, setPortalData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedTerm, setSelectedTerm] = useState('')
  const [timetable, setTimetable] = useState({})
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const messagesEndRef = useRef(null)
  const [news, setNews] = useState([])
  const [sports, setSports] = useState([])
  const [assignments, setAssignments] = useState([])
  const [activeNav, setActiveNav] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    fetchPortalData()
    fetchTimetable()
    fetchMessages()
    fetchNews()
    fetchSports()
    fetchAssignments()
  }, [student.id, refreshKey, showChat])

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/api/messages/${student.id}`)
      setMessages(res.data.messages || [])
    } catch (error) { console.error('Error fetching messages:', error) }
  }

  const fetchNews = async () => {
    try {
      const res = await api.get('/api/news')
      setNews((res.data || []).filter(n => n.is_published))
    } catch (error) { console.error('Error fetching news:', error) }
  }

  const fetchSports = async () => {
    try {
      const res = await api.get('/api/sports')
      setSports((res.data || []).filter(s => s.is_published))
    } catch (error) { console.error('Error fetching sports:', error) }
  }

  const fetchAssignments = async () => {
    try {
      const res = await api.get(`/api/assignments?grade=${student.grade}`)
      setAssignments((res.data || []).filter(a => a.is_published))
    } catch (error) { console.error('Error fetching assignments:', error) }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    setSending(true)
    try {
      const studentId = String(student.id)
      console.log('Student sending message with ID:', studentId)
      const res = await api.post('/api/messages', { 
        student_id: studentId, 
        text: newMessage, 
        sender: 'student' 
      })
      console.log('Message sent response:', res.data)
      setMessages(prev => [...prev, res.data])
      setNewMessage('')
    } catch (error) { 
      console.error('Error sending message:', error) 
    }
    finally { setSending(false) }
  }

  const fetchTimetable = async () => {
    try {
      const res = await api.get(`/api/timetable/${student.grade}`)
      if (res.data.schedule) setTimetable(res.data.schedule)
    } catch (error) { console.error('Error fetching timetable:', error) }
  }

  const fetchPortalData = async () => {
    try {
      setLoading(true)
      console.log('Fetching portal for student ID:', student.id, 'type:', typeof student.id)
      const res = await api.get(`/api/student/portal/${student.id}`)
      console.log('Portal response status:', res.status)
      console.log('Portal data response:', res.data)
      console.log('Portal data keys:', Object.keys(res.data))
      console.log('Portal scores keys:', res.data.scores ? Object.keys(res.data.scores) : 'no scores')
      if (res.data.student) {
        console.log('Student data in response:', res.data.student)
        console.log('fee_paid in response:', res.data.student.fee_paid)
      }
      console.log('Full API response:', JSON.stringify(res.data, null, 2))
      setPortalData(res.data)
      // Set selected term if terms exist OR if scores exist
      const terms = res.data.terms || []
      const scoreKeys = res.data.scores ? Object.keys(res.data.scores) : []
      console.log('Terms from API:', terms)
      console.log('Score keys from API:', scoreKeys)
      const allTerms = terms.length > 0 ? terms : scoreKeys
      if (allTerms.length > 0) setSelectedTerm(allTerms[0])
    } catch (error) { 
      console.error('Error fetching portal data:', error)
      console.error('Error response:', error.response?.data)
      console.error('Error status:', error.response?.status)
      // If API fails, use student data from login as fallback
      setPortalData({ 
        student: {
          full_name: student.full_name || 'Student',
          admission_no: student.admission_no || student.username || '',
          grade: student.grade || 'Grade 1',
          section: student.section || 'A',
          gender: student.gender || '',
          date_of_birth: student.date_of_birth || '',
          guardian_name: student.guardian_name || '',
          guardian_contact: student.guardian_contact || '',
          fee_paid: student.fee_paid || 0
        },
        total_fee: 5000,
        scores: {},
        terms: [],
        average: 0,
        position: '-',
        performance: 'N/A'
      })
    } finally { 
      setLoading(false) 
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await Promise.all([
      fetchPortalData(),
      fetchTimetable(),
      fetchMessages(),
      fetchNews(),
      fetchSports(),
      fetchAssignments()
    ])
    setIsRefreshing(false)
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

  const downloadPDF = () => {
    if (!portalData) return
    try {
      const doc = new jsPDF()
      const schoolInfo = JSON.parse(localStorage.getItem('schoolInfo') || '{}')
      const currentDate = new Date()
      const formattedDate = currentDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
      const formattedTime = currentDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

      let term = 'Term 1', year = currentDate.getFullYear().toString()
      if (selectedTerm) {
        const parts = selectedTerm.split('-')
        term = parts[0] || term
        year = parts[1] || year
      }

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

      const feePerGrade = portalData.total_fee || 5000
      const feesPaid = portalData.student.fee_paid || 0
      const feesBalance = Math.max(0, feePerGrade - feesPaid)
      
      // Also check login data as fallback
      const finalFeesPaid = (feesPaid > 0) ? feesPaid : (student?.fee_paid || 0)
      const finalBalance = Math.max(0, feePerGrade - finalFeesPaid)

      doc.setFontSize(12)
      doc.setTextColor(0)
      doc.text('Fee Status', 14, 65)
      autoTable(doc, {
        startY: 70,
        head: [['Total Fees', 'Paid', 'Balance']],
        body: [[`KES ${feePerGrade.toLocaleString()}`, `KES ${finalFeesPaid.toLocaleString()}`, `KES ${finalBalance.toLocaleString()}`]],
        theme: 'grid',
        headStyles: { fillColor: [0, 51, 102] }
      })

      doc.setFontSize(12)
      doc.setTextColor(0)
      doc.text('Academic Performance', 14, doc.lastAutoTable.finalY + 15)

      const termScores = (portalData.terms || []).map(t => {
        const termData = portalData.scores[t]
        const scores = subjects.map(sub => termData?.subjects?.[sub] || '-')
        return [t, ...scores]
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
        ['Total Score', (portalData.totalScore || 0).toString()],
        ['Average', `${portalData.average || 0}%`],
        ['Class Position', `${portalData.position || '-'} of ${portalData.student.grade}`],
        ['Performance', portalData.performance || 'N/A']
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
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF. Please try again.')
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
      const formattedTime = currentDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

      doc.setFontSize(18)
      doc.setTextColor(0, 51, 102)
      doc.text(schoolInfo.name || 'Masinde Muliro School', 105, 15, { align: 'center' })
      doc.setFontSize(14)
      doc.setTextColor(50)
      doc.text('Class Timetable', 105, 25, { align: 'center' })
      doc.setFontSize(10)
      doc.setTextColor(100)
      doc.text(`Grade: ${portalData?.student?.grade || '-'}`, 105, 33, { align: 'center' })
      
      doc.setFontSize(11)
      doc.setTextColor(80)
      doc.text(`Name: ${portalData?.student?.full_name || '-'}`, 14, 45)
      doc.text(`Admission No: ${portalData?.student?.admission_no || '-'}`, 14, 52)

      const dayColumns = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      const timeSlots = ['7:30 - 8:00', '8:00 - 8:40', '8:40 - 9:20', '9:20 - 9:40', '9:40 - 10:20',
        '10:20 - 11:00', '11:00 - 11:40', '11:40 - 12:20', '12:20 - 1:00', '1:00 - 1:40']
      
      const tableBody = timeSlots.map((time, idx) => {
        const rowLabel = idx === 0 ? 'Assembly' : idx === 4 || idx === 8 ? 'Break' : idx === 9 ? 'Lunch' : time
        const row = [rowLabel]
        dayColumns.forEach(day => {
          const subject = timetable[day]?.[time] || '-'
          row.push(subject)
        })
        return row
      })

      autoTable(doc, {
        startY: 60,
        head: [['Time', ...dayColumns]],
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: [0, 51, 102], fontSize: 8 },
        bodyStyles: { fontSize: 7 },
        columnStyles: { 0: { cellWidth: 25 } }
      })

      doc.setFontSize(8)
      doc.setTextColor(150)
      doc.text(`Generated: ${formattedDate} at ${formattedTime}`, 105, 285, { align: 'center' })

      const filename = `${portalData?.student?.admission_no || 'student'}_Timetable.pdf`
      doc.save(filename)
    } catch (error) {
      console.error('Error generating timetable PDF:', error)
      alert('Failed to generate timetable PDF. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    )
  }

  const feePerGrade = portalData?.total_fee || 5000
  // Use API fee_paid, fall back to login data if API returns 0
  const feesPaid = (portalData?.student?.fee_paid > 0) ? portalData.student.fee_paid : (student?.fee_paid || 0)
  const feesBalance = Math.max(0, feePerGrade - feesPaid)

  console.log('Fee debug - total_fee:', portalData?.total_fee, 'fee_paid (API):', portalData?.student?.fee_paid, 'fee_paid (login):', student?.fee_paid, 'used:', feesPaid, 'balance:', feesBalance)

  // Get top 5 subjects for performance summary
  const getTopSubjects = () => {
    // Get available terms from portalData
    const availableTerms = portalData?.terms || []
    const scoreKeys = portalData?.scores ? Object.keys(portalData.scores) : []
    const allTerms = availableTerms.length > 0 ? availableTerms : scoreKeys
    
    // Use selectedTerm or first available term
    const termToUse = selectedTerm || (allTerms.length > 0 ? allTerms[0] : null)
    
    console.log('getTopSubjects - selectedTerm:', selectedTerm, 'termToUse:', termToUse, 'scores:', portalData?.scores)
    
    if (!termToUse || !portalData?.scores?.[termToUse]?.subjects) return []
    
    const subjectScores = Object.entries(portalData.scores[termToUse].subjects)
      .filter(([_, score]) => score > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
    return subjectScores
  }

  const topSubjects = getTopSubjects()

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          {/* Mobile menu button */}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          {/* School Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center shadow">
              <svg viewBox="0 0 40 40" className="w-7 h-7 sm:w-9 sm:h-9">
                {/* School building */}
                <rect x="8" y="18" width="24" height="16" fill="white" rx="1"/>
                <polygon points="6,18 20,8 34,18" fill="#2563eb"/>
                {/* Door */}
                <rect x="17" y="26" width="6" height="8" fill="#1e40af"/>
                {/* Windows */}
                <rect x="11" y="22" width="4" height="4" fill="#93c5fd"/>
                <rect x="25" y="22" width="4" height="4" fill="#93c5fd"/>
                {/* Flag */}
                <line x1="20" y1="8" x2="20" y2="3" stroke="#1e40af" strokeWidth="1.5"/>
                <rect x="20" y="3" width="6" height="4" fill="#ef4444"/>
                {/* Trees */}
                <circle cx="5" cy="30" r="4" fill="#22c55e"/>
                <circle cx="35" cy="30" r="4" fill="#22c55e"/>
              </svg>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-blue-900 tracking-tight">
              MASINDE MULIRO <span className="hidden sm:inline">SCHOOL</span>
            </h1>
          </div>
        </div>

        {/* User Menu & Refresh */}
        <div className="flex items-center gap-2">
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition"
            title="Refresh data"
          >
            <svg className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <div className="relative">
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 sm:gap-3 hover:bg-gray-50 rounded-lg px-2 py-1 transition"
          >
            <span className="text-sm sm:text-base font-medium text-gray-700">
              Welcome, {student?.full_name?.split(' ')[0] || student?.username || 'Student'}!
            </span>
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow">
              {(student?.full_name?.[0] || student?.username?.[0] || 'S').toUpperCase()}
            </div>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              <button 
                onClick={() => { setShowUserMenu(false); onLogout(); }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>

      <div className="flex flex-1 relative">
        {/* Sidebar Overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          lg:shadow-none lg:border-r lg:border-gray-200
          flex flex-col pt-4 lg:pt-0
        `}>
          {/* Mobile close button */}
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <nav className="flex-1 px-3 py-4 space-y-1 mt-4 lg:mt-4">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveNav(item.id); setSidebarOpen(false); }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left
                  ${activeNav === item.id 
                    ? 'bg-blue-700 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'}
                `}
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Logout Button in Sidebar */}
          <div className="px-3 pb-4">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-400 rounded-xl p-6 text-white relative overflow-hidden shadow-lg">
              <div className="relative z-10">
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                  Welcome, {portalData?.student?.full_name?.split(' ')[0] || 'Student'} 👋
                </h2>
                <p className="text-blue-100 text-lg">Grade: {portalData?.student?.grade}</p>
                <p className="text-blue-100">Admission No: {portalData?.student?.admission_no}</p>
              </div>
              {/* Decorative school illustration */}
              <div className="absolute right-4 bottom-0 opacity-30 sm:opacity-40">
                <svg viewBox="0 0 200 120" className="w-32 h-20 sm:w-48 sm:h-28">
                  {/* Ground */}
                  <ellipse cx="100" cy="110" rx="90" ry="10" fill="#22c55e"/>
                  {/* Main building */}
                  <rect x="50" y="40" width="100" height="70" fill="white" rx="2"/>
                  <polygon points="40,40 100,10 160,40" fill="#1e40af"/>
                  {/* Windows */}
                  <rect x="60" y="50" width="20" height="15" fill="#93c5fd" rx="1"/>
                  <rect x="90" y="50" width="20" height="15" fill="#93c5fd" rx="1"/>
                  <rect x="120" y="50" width="20" height="15" fill="#93c5fd" rx="1"/>
                  <rect x="60" y="75" width="20" height="15" fill="#93c5fd" rx="1"/>
                  <rect x="90" y="75" width="20" height="15" fill="#93c5fd" rx="1"/>
                  <rect x="120" y="75" width="20" height="15" fill="#93c5fd" rx="1"/>
                  {/* Door */}
                  <rect x="92" y="85" width="16" height="25" fill="#1e40af" rx="1"/>
                  {/* Trees */}
                  <circle cx="25" cy="80" r="18" fill="#22c55e"/>
                  <rect x="22" y="90" width="6" height="20" fill="#92400e"/>
                  <circle cx="175" cy="80" r="18" fill="#22c55e"/>
                  <rect x="172" y="90" width="6" height="20" fill="#92400e"/>
                  {/* Flag */}
                  <line x1="100" y1="10" x2="100" y2="0" stroke="#1e40af" strokeWidth="2"/>
                  <rect x="100" y="0" width="12" height="8" fill="#ef4444"/>
                </svg>
              </div>
            </div>

            {/* Main Content Area - Conditionally Render Pages */}
            <div className="w-full">
              {activeNav === 'dashboard' && (
                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Left Column - Main Content */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Announcements */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="text-2xl">📢</span> Announcements
                      </h3>
                      <div className="space-y-3">
                        {news.length > 0 ? news.slice(0, 3).map((item, idx) => (
                          <div key={item.id || idx} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                            <span className="text-xl">🔔</span>
                            <div>
                              <p className="font-medium text-gray-800">{item.title}</p>
                              <p className="text-sm text-gray-600">{item.content}</p>
                            </div>
                          </div>
                        )) : (
                          <>
                            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                              <span className="text-xl">🔔</span>
                              <p className="text-gray-700">Exams start next week!</p>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                              <span className="text-xl">💰</span>
                              <p className="text-gray-700">Fees deadline is Friday!</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Performance Summary */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="text-green-500 text-2xl">✅</span> Performance Summary
                      </h3>
                      
                      {topSubjects.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-gray-200">
                                <th className="text-left py-3 px-4 font-semibold text-gray-700 bg-gray-50 rounded-tl-lg">Subject</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700 bg-gray-50">Score</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700 bg-gray-50 rounded-tr-lg">Grade</th>
                              </tr>
                            </thead>
                            <tbody>
                              {topSubjects.map(([subject, score], idx) => (
                                <tr key={subject} className={`border-b border-gray-100 ${idx === topSubjects.length - 1 ? 'border-b-0' : ''}`}>
                                  <td className="py-3 px-4 font-medium text-gray-800">{subject}</td>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-[100px]">
                                        <div 
                                          className={`h-full rounded-full ${score >= 70 ? 'bg-green-500' : score >= 50 ? 'bg-blue-500' : 'bg-yellow-500'}`}
                                          style={{ width: `${score}%` }}
                                        />
                                      </div>
                                      <span className="font-semibold text-gray-700">{score}</span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${getGradeColor(score)}`}>
                                      {getGradeLetter(score)}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <p>No performance data available yet</p>
                        </div>
                      )}

                      {/* Mini bar chart */}
                      {topSubjects.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-gray-100">
                          <div className="flex items-end justify-around gap-2 h-24">
                            {topSubjects.slice(0, 4).map(([subject, score], idx) => (
                              <div key={subject} className="flex flex-col items-center gap-1 flex-1">
                                <div 
                                  className={`w-full max-w-[40px] rounded-t-md ${idx === 0 ? 'bg-blue-600' : idx === 1 ? 'bg-blue-500' : idx === 2 ? 'bg-orange-400' : 'bg-orange-300'}`}
                                  style={{ height: `${score}%` }}
                                />
                                <span className="text-[10px] text-gray-500 truncate w-full text-center">{subject.substring(0, 3)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Quick Assignments Preview */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                          <span className="text-xl">📚</span> My Assignments
                        </h3>
                        <button onClick={() => setActiveNav('assignments')} className="text-blue-600 text-sm font-medium hover:underline">
                          View All
                        </button>
                      </div>
                      {assignments.length > 0 ? (
                        <div className="space-y-3">
                          {assignments.slice(0, 3).map(item => {
                            const isOverdue = item.due_date && new Date(item.due_date) < new Date()
                            return (
                              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                  <p className="font-medium text-gray-800">{item.title}</p>
                                  <p className="text-sm text-gray-500">{item.subject}</p>
                                </div>
                                {item.due_date && (
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${isOverdue ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {isOverdue ? 'Overdue' : `Due: ${new Date(item.due_date).toLocaleDateString()}`}
                                  </span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-gray-500">
                          <p>No assignments for your class</p>
                        </div>
                      )}
                    </div>
                  </div>

              {/* Right Column - Sidebar Cards */}
              <div className="space-y-6">
                {/* Student Details Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-200 pb-3">
                    Student Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Name:</span>
                      <span className="font-medium text-gray-800">{portalData?.student?.full_name || student?.full_name || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Adm. No:</span>
                      <span className="font-medium text-gray-800">{portalData?.student?.admission_no || student?.admission_no || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Class:</span>
                      <span className="font-medium text-gray-800">Grade {portalData?.student?.grade || student?.grade || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Section:</span>
                      <span className="font-medium text-gray-800">{portalData?.student?.section || 'A'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Gender:</span>
                      <span className="font-medium text-gray-800 capitalize">{portalData?.student?.gender || student?.gender || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Date of Birth:</span>
                      <span className="font-medium text-gray-800">{portalData?.student?.date_of_birth ? new Date(portalData.student.date_of_birth).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : (student?.date_of_birth || '-')}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Guardian:</span>
                      <span className="font-medium text-gray-800 text-sm">{portalData?.student?.guardian_name || student?.guardian_name || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Contact:</span>
                      <span className="font-medium text-gray-800">{portalData?.student?.guardian_contact || student?.guardian_contact || '-'}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Total Fees:</span>
                        <span className="font-bold text-gray-800">KES {feePerGrade.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-gray-500">Fees Paid:</span>
                        <span className="font-bold text-green-600">KES {feesPaid.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-gray-500">Balance:</span>
                        <span className="font-bold text-red-600">KES {feesBalance.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Class Timetable Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-200 pb-3">
                    <span className="text-xl">🕐</span> Class Timetable
                  </h3>
                  
                  {timetable && Object.keys(timetable).length > 0 ? (
                    <div className="overflow-x-auto -mx-2">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="py-2 px-2 text-left font-semibold text-gray-600"></th>
                            <th className="py-2 px-2 text-center font-semibold text-gray-600">8:00 AM</th>
                            <th className="py-2 px-2 text-center font-semibold text-gray-600">10:00 AM</th>
                            <th className="py-2 px-2 text-center font-semibold text-gray-600">12:00 PM</th>
                          </tr>
                        </thead>
                        <tbody>
                          {days.slice(0, 4).map(day => (
                            <tr key={day} className="border-b border-gray-100">
                              <td className="py-2 px-2 font-medium text-gray-700">{day}</td>
                              <td className="py-2 px-2 text-center text-gray-600">{timetable[day]?.['8:00 - 8:40'] || '-'}</td>
                              <td className="py-2 px-2 text-center text-gray-600">{timetable[day]?.['9:40 - 10:20'] || '-'}</td>
                              <td className="py-2 px-2 text-center text-gray-600">{timetable[day]?.['11:40 - 12:20'] || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <p>No timetable available</p>
                    </div>
                  )}
                </div>

                {/* Download Report Button */}
                <button onClick={downloadPDF} disabled={!portalData} className="w-full bg-gradient-to-r from-blue-700 to-blue-800 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:from-blue-800 hover:to-blue-900 transition shadow-lg disabled:opacity-50">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download My Report (PDF)
                </button>

                {/* Download Timetable Button */}
                <button onClick={downloadTimetablePDF} disabled={!timetable || Object.keys(timetable).length === 0} className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:from-green-700 hover:to-green-800 transition shadow-lg disabled:opacity-50">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Download Timetable (PDF)
                </button>
              </div>
            </div>
              )}

              {/* Assignments Page */}
              {activeNav === 'assignments' && (
                <div className="col-span-full">
                  <StudentAssignments student={student} refreshKey={refreshKey} />
                </div>
              )}

              {/* Timetable Page */}
              {activeNav === 'timetable' && (
                <div className="col-span-full">
                  <StudentTimetable student={student} refreshKey={refreshKey} />
                </div>
              )}

              {/* News Page */}
              {activeNav === 'news' && (
                <div className="col-span-full">
                  <StudentNews student={student} refreshKey={refreshKey} />
                </div>
              )}

              {/* Sports Page */}
              {activeNav === 'sports' && (
                <div className="col-span-full">
                  <StudentSports student={student} refreshKey={refreshKey} />
                </div>
              )}

              {/* Results Page */}
              {activeNav === 'results' && (
                <div className="col-span-full">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                        <span className="text-3xl">📊</span> My Results
                      </h2>
                      <button 
                        onClick={downloadPDF} 
                        disabled={!portalData?.terms?.length}
                        className="bg-gradient-to-r from-blue-700 to-blue-800 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:from-blue-800 hover:to-blue-900 transition shadow-lg disabled:opacity-50"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download PDF
                      </button>
                    </div>
                    
                    {/* Check both terms AND scores object */}
                    {(portalData?.terms?.length > 0 || (portalData?.scores && Object.keys(portalData.scores).length > 0)) ? (
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="mb-4">
                          <label className="text-sm font-medium text-gray-700">Select Term:</label>
                          <select 
                            value={selectedTerm} 
                            onChange={(e) => setSelectedTerm(e.target.value)} 
                            className="ml-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          >
                            {(portalData.terms || Object.keys(portalData.scores || {})).map(term => <option key={term} value={term}>{term}</option>)}
                          </select>
                        </div>
                        
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b-2 border-gray-300 bg-gray-50">
                                <th className="text-left py-3 px-4 font-bold text-gray-700">Subject</th>
                                <th className="text-center py-3 px-4 font-bold text-gray-700">Marks</th>
                                <th className="text-center py-3 px-4 font-bold text-gray-700">Grade</th>
                              </tr>
                            </thead>
                            <tbody>
                              {subjects.map(sub => {
                                const score = portalData.scores[selectedTerm]?.subjects?.[sub] || 0
                                return (
                                  <tr key={sub} className="border-b border-gray-100">
                                    <td className="py-3 px-4 font-medium text-gray-800">{sub}</td>
                                    <td className="py-3 px-4 text-center">{score || '-'}</td>
                                    <td className="py-3 px-4 text-center">
                                      {score > 0 && (
                                        <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${getGradeColor(score)}`}>
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
                        
                        <div className="mt-6 pt-4 border-t border-gray-200 grid grid-cols-3 gap-4">
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <p className="text-2xl font-bold text-blue-700">{portalData.average || 0}%</p>
                            <p className="text-sm text-gray-600">Average</p>
                          </div>
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <p className="text-2xl font-bold text-green-700">{portalData.position || '-'}</p>
                            <p className="text-sm text-gray-600">Class Position</p>
                          </div>
                          <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <p className="text-2xl font-bold text-purple-700">{portalData.totalScore || 0}</p>
                            <p className="text-sm text-gray-600">Total Marks</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                        <div className="text-6xl mb-4">📝</div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Results Yet</h3>
                        <p className="text-gray-500">Your exam results will appear here once they are published.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-3 px-4 text-center">
        <p className="text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Masinde Muliro University of Science and Technology. All Rights Reserved.
        </p>
      </footer>

      {/* Chat Button */}
      <button 
        onClick={() => setShowChat(!showChat)} 
        className="fixed bottom-6 right-6 bg-blue-700 text-white p-4 rounded-full shadow-lg hover:bg-blue-800 transition z-50"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>

      {/* Chat Panel */}
      {showChat && (
        <div className="fixed bottom-20 right-6 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
          <div className="bg-blue-700 text-white p-4 flex justify-between items-center">
            <div>
              <h3 className="font-bold">Chat with Admin</h3>
              <p className="text-xs text-blue-200">Send messages or complaints</p>
            </div>
            <button onClick={() => setShowChat(false)} className="text-white hover:text-blue-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="h-64 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">No messages yet. Start a conversation!</p>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === 'student' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg px-3 py-2 ${msg.sender === 'student' ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-800'}`}>
                    <p className="text-sm">{msg.text}</p>
                    <p className={`text-xs mt-1 ${msg.sender === 'student' ? 'text-blue-200' : 'text-gray-400'}`}>
                      {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200">
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newMessage} 
                onChange={(e) => setNewMessage(e.target.value)} 
                placeholder="Type a message..." 
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" 
              />
              <button 
                type="submit" 
                disabled={sending || !newMessage.trim()} 
                className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50"
              >
                {sending ? '...' : 'Send'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
