import { NavLink } from 'react-router-dom'
import {
  Home, Star, GraduationCap, LogOut, X, ShoppingBag,
  ClipboardList, Target, Layers,
} from 'lucide-react'

const sections = [
  {
    items: [
      { to: '/', label: 'Accueil', icon: Home, exact: true },
      { to: '/transactions', label: 'Transactions', icon: ClipboardList },
      { to: '/objectifs', label: 'Objectifs', icon: Target },
    ],
  },
  {
    title: 'Services',
    items: [
      { to: '/services', label: 'Mes Services', icon: Layers },
      { to: '/favoris', label: 'Mes Favoris', icon: Star },
    ],
  },
  {
    title: 'Écosystème',
    items: [
      { to: '/academy', label: 'RIAD Academy', icon: GraduationCap, accent: true },
    ],
  },
]

export default function Sidebar({ open, onClose }) {
  return (
    <aside
      className={`
        fixed md:static inset-y-0 left-0 z-30 flex flex-col
        w-64 text-white
        transform transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}
      style={{ backgroundColor: '#1e2d6b' }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#f97316' }}>
            <ShoppingBag size={20} className="text-white" />
          </div>
          <div>
            <p className="font-extrabold text-xl leading-tight tracking-wide">RIAD</p>
            <p className="text-xs text-blue-300 leading-tight">by M2T</p>
          </div>
        </div>
        <button onClick={onClose} className="md:hidden text-blue-300 hover:text-white">
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
        {sections.map((section, si) => (
          <div key={si} className={si > 0 ? 'pt-4' : ''}>
            {section.title && (
              <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-blue-400">
                {section.title}
              </p>
            )}
            {section.items.map(({ to, label, icon: Icon, exact, accent }) => (
              <NavLink
                key={label}
                to={to}
                end={exact}
                onClick={onClose}
                className={({ isActive }) =>
                  `relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    accent
                      ? isActive
                        ? 'text-orange-400 bg-white/10 border-l-2 border-orange-400'
                        : 'text-orange-300 hover:bg-white/10 hover:text-orange-400'
                      : isActive
                        ? 'bg-white/15 text-white border-l-2 border-orange-400'
                        : 'text-blue-200 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <Icon size={17} />
                {label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Déconnexion */}
      <div className="px-3 py-4 border-t border-white/10">
        <button className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm text-blue-300 hover:bg-white/10 hover:text-white transition-colors">
          <LogOut size={17} />
          Déconnexion
        </button>
      </div>
    </aside>
  )
}
