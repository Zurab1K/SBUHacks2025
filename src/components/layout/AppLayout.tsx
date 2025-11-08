import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { label: 'Upload Transcript', to: '/upload' },
  { label: 'Processed Calls', to: '/calls' },
  { label: 'Sheet Settings', to: '/settings' },
]

const getNavClass = ({ isActive }: { isActive: boolean }) =>
  [
    'px-3 py-2 text-sm font-medium rounded-md transition-colors',
    isActive
      ? 'bg-slate-900 text-white'
      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
  ].join(' ')

export const AppLayout = () => (
  <div className="min-h-screen bg-slate-50">
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-brand-500">
            Auto Notes to Sheets
          </p>
          <h1 className="text-xl font-semibold text-slate-900">
            AI call intelligence dashboard
          </h1>
        </div>
        <div className="flex gap-2">
          {navItems.map((item) => (
            <NavLink key={item.label} to={item.to} className={getNavClass}>
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
    </header>
    <main className="mx-auto max-w-7xl px-6 py-8">
      <Outlet />
    </main>
  </div>
)
