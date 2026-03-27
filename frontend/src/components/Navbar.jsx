export default function Navbar({ onMenuClick, onLogout }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        <div className="hidden sm:block">
          <h2 className="text-lg font-semibold text-gray-800">
            CBC-Aligned School Management System (Kenya)
          </h2>
          <p className="text-sm text-gray-500">KEMIS Compliant • KNEC Ready</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg">
          <div className="w-8 h-8 bg-kenyan-blue rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {user.username?.charAt(0).toUpperCase() || 'A'}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800 capitalize">{user.username || 'Admin'}</p>
            <p className="text-xs text-gray-500 capitalize">{user.role || 'Administrator'}</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          title="Logout"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </header>
  )
}
