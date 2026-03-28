import { useState, useEffect, useRef } from 'react'
import api from '../api'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const subjects = [
  'English', 'Kiswahili', 'Mathematics', 'Science', 'Social Studies',
  'Religious Education', 'Creative Arts', 'Physical & Health Education',
  'Agriculture', 'Life Skills'
]

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const times = ['7:30 - 8:00', '8:00 - 8:40', '8:40 - 9:20', '9:20 - 9:40', '9:40 - 10:20',
  '10:20 - 11:00', '11:00 - 11:40', '11:40 - 12:20', '12:20 - 1:00', '1:00 - 1:40']

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

  useEffect(() => {
    fetchPortalData()
    fetchTimetable()
    fetchMessages()
    fetchNews()
    fetchSports()
  }, [student.id])

  useEffect(() => {
    if (showChat) scrollToBottom()
  }, [messages, showChat])

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

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    setSending(true)
    try {
      const res = await api.post('/api/messages', { student_id: student.id, text: newMessage, sender: 'student' })
      setMessages(prev => [...prev, res.data])
      setNewMessage('')
    } catch (error) { console.error('Error sending message:', error) }
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
      const res = await api.get(`/api/student/portal/${student.id}`)
      setPortalData(res.data)
      if (res.data.terms?.length > 0) setSelectedTerm(res.data.terms[0])
    } catch (error) { console.error('Error fetching portal data:', error) }
    finally { setLoading(false) }
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

      const feePerGrade = 5000
      const feesPaid = portalData.student.fee_paid || 0
      const feesBalance = Math.max(0, feePerGrade - feesPaid)

      doc.setFontSize(12)
      doc.setTextColor(0)
      doc.text('Fee Status', 14, 65)
      autoTable(doc, {
        startY: 70,
        head: [['Total Fees', 'Paid', 'Balance']],
        body: [[`KES ${feePerGrade.toLocaleString()}`, `KES ${feesPaid.toLocaleString()}`, `KES ${feesBalance.toLocaleString()}`]],
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kenyan-blue"></div>
      </div>
    )
  }

  const feePerGrade = 5000
  const feesPaid = portalData?.student?.fee_paid || 0
  const feesBalance = Math.max(0, feePerGrade - feesPaid)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-kenyan-blue text-white p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Student Portal</h1>
            <p className="text-blue-200 text-sm">{portalData?.student?.full_name}</p>
          </div>
          <button onClick={onLogout} className="bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30 text-sm">Logout</button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">My Details</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><p className="text-sm text-gray-500">Admission No.</p><p className="font-semibold">{portalData?.student?.admission_no}</p></div>
            <div><p className="text-sm text-gray-500">Grade</p><p className="font-semibold">Grade {portalData?.student?.grade}</p></div>
            <div><p className="text-sm text-gray-500">Gender</p><p className="font-semibold capitalize">{portalData?.student?.gender}</p></div>
            <div><p className="text-sm text-gray-500">Guardian</p><p className="font-semibold text-sm">{portalData?.student?.guardian_name}</p></div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-6"><h3 className="text-sm text-gray-500 mb-2">Total Fees</h3><p className="text-2xl font-bold text-kenyan-blue">KES {feePerGrade.toLocaleString()}</p></div>
          <div className="bg-white rounded-xl shadow-sm p-6"><h3 className="text-sm text-gray-500 mb-2">Fees Paid</h3><p className="text-2xl font-bold text-green-600">KES {feesPaid.toLocaleString()}</p></div>
          <div className="bg-white rounded-xl shadow-sm p-6"><h3 className="text-sm text-gray-500 mb-2">Balance</h3><p className={`text-2xl font-bold ${feesBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>KES {feesBalance.toLocaleString()}</p></div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">📰 School News & Events</h2>
          {news.length > 0 ? (
            <div className="space-y-4">
              {news.slice(0, 3).map(item => (
                <div key={item.id} className="border-b border-gray-100 pb-4 last:border-0">
                  {item.media_type === 'image' && item.media_data && <img src={item.media_data} alt={item.title} className="w-full h-40 object-cover rounded-lg mb-3" />}
                  <h3 className="font-semibold text-gray-800">{item.title}</h3>
                  {item.event_date && <p className="text-sm text-kenyan-blue font-medium">📅 {new Date(item.event_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}{item.event_time && ` at ${item.event_time}`}</p>}
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500"><p>No news or events posted yet</p></div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">🏃 Sports & Activities</h2>
          {sports.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {sports.slice(0, 4).map(item => (
                <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  {item.image_data && <img src={item.image_data} alt={item.title} className="w-full h-32 object-cover" />}
                  <div className="p-3">
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-medium">{item.activity_type}</span>
                    <h3 className="font-semibold text-gray-800 mt-2">{item.title}</h3>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{item.description}</p>
                    {item.event_date && <p className="text-xs text-kenyan-blue mt-2">📅 {new Date(item.event_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}{item.location && ` | 📍 ${item.location}`}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500"><p>No sports activities posted yet</p></div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800">Academic Performance</h2>
            <span className={`px-4 py-2 rounded-full text-white font-bold ${getPerformanceColor(portalData?.performance)}`}>{getGradeLabel(portalData?.performance)}</span>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg"><p className="text-3xl font-bold text-kenyan-blue">{portalData?.average || 0}%</p><p className="text-sm text-gray-500">Average</p></div>
            <div className="text-center p-4 bg-gray-50 rounded-lg"><p className="text-3xl font-bold text-kenyan-blue">{portalData?.position || '-'}</p><p className="text-sm text-gray-500">Position in Class</p></div>
            <div className="text-center p-4 bg-gray-50 rounded-lg"><p className="text-3xl font-bold text-kenyan-blue">{portalData?.totalScore || 0}</p><p className="text-sm text-gray-500">Total Marks</p></div>
          </div>
          {portalData?.terms?.length > 0 && (
            <>
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700">Select Term:</label>
                <select value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)} className="select ml-2">
                  {portalData.terms.map(term => <option key={term} value={term}>{term}</option>)}
                </select>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b-2 border-gray-300 bg-gray-100">
                    <th className="text-left py-2 px-3 font-bold text-gray-700">Subject</th>
                    <th className="text-center py-2 px-3 font-bold text-gray-700">Marks</th>
                    <th className="text-center py-2 px-3 font-bold text-gray-700">Grade</th>
                  </tr></thead>
                  <tbody>
                    {subjects.map(sub => {
                      const score = portalData.scores[selectedTerm]?.subjects?.[sub] || 0
                      return (
                        <tr key={sub} className="border-b border-gray-100">
                          <td className="py-2 px-3 font-medium">{sub}</td>
                          <td className="py-2 px-3 text-center">{score || '-'}</td>
                          <td className="py-2 px-3 text-center">
                            {score > 0 && <span className={`px-2 py-1 rounded text-xs font-medium ${getGradeColor(score)}`}>{getGradeLetter(score)}</span>}
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

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">My Class Timetable</h2>
          {timetable && Object.keys(timetable).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead><tr className="border-b-2 border-gray-300 bg-gray-100">
                  <th className="py-2 px-2 font-bold text-gray-700 w-20 text-center">Time</th>
                  {days.map(day => <th key={day} className="py-2 px-2 font-bold text-gray-700 text-center">{day.substring(0, 3)}</th>)}
                </tr></thead>
                <tbody>
                  {times.map((time, idx) => (
                    <tr key={time} className="border-b border-gray-100">
                      <td className="py-1 px-1 text-xs text-gray-600 bg-gray-50 text-center">
                        {idx === 0 ? 'ASM' : idx === 4 || idx === 8 ? 'BREAK' : idx === 9 ? 'LUNCH' : time}
                      </td>
                      {days.map(day => {
                        const subject = timetable[day]?.[time] || ''
                        const isBreak = subject === 'BREAK' || subject === 'LUNCH' || subject === 'ASSEMBLY'
                        return <td key={`${day}-${time}`} className={`py-1 px-1 text-center text-xs ${isBreak ? 'bg-yellow-50 text-yellow-700 font-medium' : subject ? 'bg-blue-50 text-blue-800' : 'text-gray-400'}`}>{subject || '-'}</td>
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500"><p>No timetable available for your class</p></div>
          )}
        </div>

        <button onClick={downloadPDF} disabled={!portalData} className="w-full btn bg-kenyan-blue text-white py-4 text-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Download My Report (PDF)
        </button>

        <footer className="text-center py-4 text-gray-500 text-sm">&copy; {new Date().getFullYear()} SIFUNA CODEX COMPANY</footer>
      </div>

      <button onClick={() => setShowChat(!showChat)} className="fixed bottom-6 right-6 bg-kenyan-blue text-white p-4 rounded-full shadow-lg hover:bg-kenyan-blue/90 transition z-50">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
      </button>

      {showChat && (
        <div className="fixed bottom-20 right-6 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
          <div className="bg-kenyan-blue text-white p-4 flex justify-between items-center">
            <div><h3 className="font-bold">Chat with Admin</h3><p className="text-xs text-blue-200">Send messages or complaints</p></div>
            <button onClick={() => setShowChat(false)} className="text-white hover:text-blue-200"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
          <div className="h-64 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? <p className="text-center text-gray-400 text-sm py-8">No messages yet. Start a conversation!</p> : messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === 'student' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg px-3 py-2 ${msg.sender === 'student' ? 'bg-kenyan-blue text-white' : 'bg-gray-100 text-gray-800'}`}>
                  <p className="text-sm">{msg.text}</p>
                  <p className={`text-xs mt-1 ${msg.sender === 'student' ? 'text-blue-200' : 'text-gray-400'}`}>{new Date(msg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200">
            <div className="flex gap-2">
              <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="input text-sm flex-1" />
              <button type="submit" disabled={sending || !newMessage.trim()} className="btn btn-primary py-1 px-3 text-sm">{sending ? '...' : 'Send'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
