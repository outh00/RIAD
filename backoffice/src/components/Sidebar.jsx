import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, Layers, GraduationCap, Bell, ClipboardList, Target, Brain, X } from 'lucide-react'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/agents', label: 'Agents ES', icon: Users },
  { to: '/transactions', label: 'Transactions', icon: ClipboardList },
  { to: '/objectifs', label: 'Objectifs', icon: Target },
  { to: '/analytics', label: 'Analytics IA', icon: Brain },
  { to: '/services', label: 'Catalogue Services', icon: Layers },
  { to: '/academy', label: 'RIAD Academy', icon: GraduationCap },
  { to: '/notifications', label: 'Notifications', icon: Bell },
]

export default function Sidebar({ open, onClose }) {
  return (
    <aside
      className={`
        fixed md:static inset-y-0 left-0 z-30
        w-64 bg-blue-900 text-white flex flex-col
        transform transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-blue-800">
        <div>
          <p className="font-bold text-lg tracking-wide">M2T BackOffice</p>
          <p className="text-blue-300 text-xs">Supervision Agents</p>
        </div>
        <button onClick={onClose} className="md:hidden text-blue-300 hover:text-white">
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-700 text-white'
                  : 'text-blue-200 hover:bg-blue-800 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
