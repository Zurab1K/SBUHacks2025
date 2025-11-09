import { NavLink, Outlet } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'

const navItems = [
  { label: 'Upload Transcript', to: '/upload' },
  { label: 'Processed Calls', to: '/calls' },
  { label: 'Financial Health', to: '/financial' },
  { label: 'Sheet Settings', to: '/settings' },
]

const getNavClass = ({ isActive }: { isActive: boolean }) =>
  [
    'px-3 py-2 text-sm font-medium rounded-md transition-colors',
    isActive
      ? 'bg-slate-900 text-white'
      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
  ].join(' ')

export const AppLayout = () => {
  
  const { user, logout } = useAuth0()

  const handleLogout = () => {
    logout({
      logoutParams: {
        returnTo: window.location.origin, 
      },
    })
  }


  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img
              src="/synoptic.png"
              alt="Synoptic AI logo"
              className="h-12 w-12 rounded-full object-contain"
            />
            <span className="text-2xl font-semibold text-slate-900">
              Synoptic AI
            </span>
          </div>
          <div className="flex items-center gap-2"> {}
            {navItems.map((item) => (
              <NavLink key={item.label} to={item.to} className={getNavClass}>
                {item.label}
              </NavLink>
            ))}

            {}
            <div className="ml-4 flex items-center gap-3">
              <span className="text-sm text-slate-500">{user?.email}</span>
              <button
                onClick={handleLogout}
                className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200"
              >
                Log Out
              </button>
            </div>
            {}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
