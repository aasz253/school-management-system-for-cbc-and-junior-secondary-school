import { useState } from 'react'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

export default function Layout({ children, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-h-screen">
        <Navbar onMenuClick={() => setSidebarOpen(true)} onLogout={onLogout} />
        
        <main className="flex-1 p-4 md:p-6 overflow-x-auto">
          {children}
        </main>

        <footer className="bg-white border-t border-gray-200 py-4 px-6 text-center">
          <p className="text-sm text-gray-600">
            &copy; 2026 SIFUNA CODEX - All Rights Reserved
          </p>
        </footer>
      </div>

      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
