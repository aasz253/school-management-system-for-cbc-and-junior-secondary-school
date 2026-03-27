import { useState, useEffect } from 'react'

export default function WelcomePage({ onContinue }) {
  const [schoolInfo, setSchoolInfo] = useState({
    badge: '',
    motto: '',
    headmaster: '',
    hod: '',
    adminName: ''
  })
  const [isEditing, setIsEditing] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('schoolInfo')
    if (saved) {
      setSchoolInfo(JSON.parse(saved))
      setIsEditing(false)
    }
  }, [])

  const handleSave = () => {
    localStorage.setItem('schoolInfo', JSON.stringify(schoolInfo))
    setIsEditing(false)
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setSchoolInfo(prev => ({ ...prev, badge: reader.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  if (!isEditing && schoolInfo.motto) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-kenyan-blue via-blue-900 to-kenyan-green flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
          <div className="bg-kenyan-blue p-8 text-center">
            {schoolInfo.badge ? (
              <img 
                src={schoolInfo.badge} 
                alt="School Badge" 
                className="w-24 h-24 mx-auto mb-4 rounded-full object-cover border-4 border-white"
              />
            ) : (
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            )}
            <h1 className="text-3xl font-bold text-white">Welcome to Our School</h1>
            {schoolInfo.motto && (
              <p className="text-blue-200 mt-2 text-lg italic">"{schoolInfo.motto}"</p>
            )}
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
              {schoolInfo.headmaster && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Headmaster</p>
                  <p className="font-semibold text-gray-800">{schoolInfo.headmaster}</p>
                </div>
              )}
              {schoolInfo.hod && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Head of Department</p>
                  <p className="font-semibold text-gray-800">{schoolInfo.hod}</p>
                </div>
              )}
              {schoolInfo.adminName && (
                <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                  <p className="text-sm text-gray-500">School Administrator</p>
                  <p className="font-semibold text-gray-800">{schoolInfo.adminName}</p>
                </div>
              )}
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={handleEdit}
                className="flex-1 py-3 px-6 border-2 border-kenyan-blue text-kenyan-blue rounded-lg font-semibold hover:bg-kenyan-blue hover:text-white transition"
              >
                Edit Information
              </button>
              <button
                onClick={onContinue}
                className="flex-1 py-3 px-6 bg-kenyan-blue text-white rounded-lg font-semibold hover:bg-blue-800 transition"
              >
                Continue to Dashboard
              </button>
            </div>
          </div>

          <footer className="bg-gray-50 border-t border-gray-200 py-3 text-center">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} SIFUNA CODEX COMPANY
            </p>
          </footer>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-kenyan-blue via-blue-900 to-kenyan-green flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
        <div className="bg-kenyan-blue p-8 text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">School Information</h1>
          <p className="text-blue-200 mt-2">Configure your school details</p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">School Badge / Logo</label>
              <div className="flex items-center gap-4">
                {schoolInfo.badge ? (
                  <img src={schoolInfo.badge} alt="Badge Preview" className="w-20 h-20 rounded-full object-cover border-2 border-gray-200" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-kenyan-blue file:text-white hover:file:bg-blue-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">School Motto</label>
              <input
                type="text"
                value={schoolInfo.motto}
                onChange={(e) => setSchoolInfo(prev => ({ ...prev, motto: e.target.value }))}
                className="input"
                placeholder="Enter school motto"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Headmaster Name</label>
              <input
                type="text"
                value={schoolInfo.headmaster}
                onChange={(e) => setSchoolInfo(prev => ({ ...prev, headmaster: e.target.value }))}
                className="input"
                placeholder="Enter headmaster's name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Head of Department (HOD)</label>
              <input
                type="text"
                value={schoolInfo.hod}
                onChange={(e) => setSchoolInfo(prev => ({ ...prev, hod: e.target.value }))}
                className="input"
                placeholder="Enter HOD's name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Admin Name</label>
              <input
                type="text"
                value={schoolInfo.adminName}
                onChange={(e) => setSchoolInfo(prev => ({ ...prev, adminName: e.target.value }))}
                className="input"
                placeholder="Enter administrator's name"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full py-3 mt-6"
          >
            Save & Continue
          </button>
        </form>

        <footer className="bg-gray-50 border-t border-gray-200 py-3 text-center">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} SIFUNA CODEX COMPANY
          </p>
        </footer>
      </div>
    </div>
  )
}
