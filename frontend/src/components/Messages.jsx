import { useState, useEffect, useRef } from 'react'
import api from '../api'

export default function Messages() {
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    fetchConversations()
  }, [])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.studentId)
    }
  }, [selectedConversation])

  // Auto-refresh messages every 5 seconds when conversation is selected
  useEffect(() => {
    if (!selectedConversation) return
    const interval = setInterval(() => {
      fetchMessages(selectedConversation.studentId)
    }, 5000)
    return () => clearInterval(interval)
  }, [selectedConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const searchStudents = async (query) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }
    setSearching(true)
    try {
      const res = await api.get(`/api/students/search?q=${encodeURIComponent(query)}`)
      setSearchResults(res.data)
    } catch (error) {
      console.error('Error searching students:', error)
    } finally {
      setSearching(false)
    }
  }

  const startConversation = async (student) => {
    // Check if conversation already exists
    const existing = conversations.find(c => c.studentId === student.id)
    if (existing) {
      setSelectedConversation(existing)
    } else {
      // Create new conversation
      const newConv = {
        studentId: student.id,
        studentName: student.full_name,
        admissionNo: student.admission_no,
        messages: []
      }
      setConversations(prev => [newConv, ...prev])
      setSelectedConversation(newConv)
    }
    setSearchQuery('')
    setSearchResults([])
  }

  const fetchConversations = async () => {
    try {
      const res = await api.get('/api/messages')
      setConversations(res.data)
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (studentId) => {
    try {
      const id = String(studentId)
      console.log('Fetching messages for student ID:', id)
      const res = await api.get(`/api/messages/${id}`)
      console.log('Messages response:', res.data)
      setMessages(res.data.messages || [])
      await api.put(`/api/messages/read/${id}`)
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation) return

    setSending(true)
    try {
      const studentId = String(selectedConversation.studentId)
      console.log('Sending message to student ID:', studentId)
      const res = await api.post('/api/messages', {
        student_id: studentId,
        text: newMessage,
        sender: 'admin'
      })
      console.log('Message sent:', res.data)
      // Update the conversation with new message
      setConversations(prev => prev.map(conv => {
        if (conv.studentId === selectedConversation.studentId) {
          return {
            ...conv,
            messages: [...(conv.messages || []), res.data]
          }
        }
        return conv
      }))
      setMessages(prev => [...prev, res.data])
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const formatTime = (date) => {
    const d = new Date(date)
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (date) => {
    const d = new Date(date)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getUnreadCount = (conv) => {
    return conv.messages.filter(m => m.sender === 'student').length
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
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Messages & Complaints</h1>
        <p className="text-gray-500">Chat with students</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex h-[600px]">
          <div className="w-1/3 border-r border-gray-200">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h2 className="font-semibold text-gray-800">Conversations</h2>
              <p className="text-sm text-gray-500">{conversations.length} student(s)</p>
            </div>
            
            {/* Search Students */}
            <div className="p-3 border-b border-gray-200">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    searchStudents(e.target.value)
                  }}
                  placeholder="Search student to chat..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                {searching && (
                  <div className="absolute right-3 top-2">
                    <div className="animate-spin h-4 w-4 border-2 border-kenyan-blue border-t-transparent rounded-full"></div>
                  </div>
                )}
              </div>
              {searchResults.length > 0 && (
                <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {searchResults.map(student => (
                    <button
                      key={student.id}
                      onClick={() => startConversation(student)}
                      className="w-full p-2 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                    >
                      <p className="font-medium text-sm text-gray-800">{student.full_name}</p>
                      <p className="text-xs text-gray-500">{student.admission_no}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="overflow-y-auto h-[calc(100%-140px)]">
              {conversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No conversations yet
                </div>
              ) : (
                conversations.map(conv => (
                  <button
                    key={conv.studentId}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full p-4 text-left border-b border-gray-100 hover:bg-blue-50 transition ${
                      selectedConversation?.studentId === conv.studentId ? 'bg-blue-50 border-l-4 border-l-kenyan-blue' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-800">{conv.studentName}</p>
                        <p className="text-sm text-gray-500">{conv.admissionNo}</p>
                      </div>
                      <div className="text-right">
                        {conv.messages.length > 0 && (
                          <p className="text-xs text-gray-400">
                            {formatDate(conv.messages[conv.messages.length - 1].created_at)}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 truncate mt-1">
                      {conv.messages.length > 0 ? conv.messages[conv.messages.length - 1].text : 'No messages'}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="w-2/3 flex flex-col">
            {selectedConversation ? (
              <>
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="font-semibold text-gray-800">{selectedConversation.studentName}</h2>
                  <p className="text-sm text-gray-500">{selectedConversation.admissionNo}</p>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          msg.sender === 'admin'
                            ? 'bg-kenyan-blue text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <p className="text-sm">{msg.text}</p>
                        <p className={`text-xs mt-1 ${
                          msg.sender === 'admin' ? 'text-blue-200' : 'text-gray-400'
                        }`}>
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="input flex-1"
                    />
                    <button
                      type="submit"
                      disabled={sending || !newMessage.trim()}
                      className="btn btn-primary"
                    >
                      {sending ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p>Select a conversation to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
