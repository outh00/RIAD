import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Search, Bell } from 'lucide-react'
import { api } from '../api/client'

export default function Header({ onMenuClick }) {
  const [agent, setAgent] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [search, setSearch] = useState('')
  const [showNotifs, setShowNotifs] = useState(false)
  const [notifs, setNotifs] = useState([])
  const navigate = useNavigate()

  const fetchAgent = () => api.agent.get().then(setAgent).catch(() => {})

  useEffect(() => {
    fetchAgent()
    api.notifications.list().then(({ notifications, unreadCount }) => {
      setNotifs(notifications)
      setUnreadCount(unreadCount)
    }).catch(() => {})

    window.addEventListener('payment-success', fetchAgent)
    return () => window.removeEventListener('payment-success', fetchAgent)
  }, [])

  const handleMarkRead = async (id) => {
    await api.notifications.markRead(id)
    setNotifs(n => n.map(x => x.id === id ? { ...x, read: true } : x))
    setUnreadCount(c => Math.max(0, c - 1))
  }

  const typeColor = {
    success: 'bg-green-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
  }

  const initials = agent
    ? agent.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  const firstName = agent?.name?.split(' ')[0] || ''

  return (
    <header className="bg-white border-b border-gray-200 px-5 py-3 flex items-center gap-4">
      <button onClick={onMenuClick} className="md:hidden text-gray-500 hover:text-gray-700">
        <Menu size={22} />
      </button>

      {/* Barre de recherche */}
      <div className="flex-1 relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un client, service ou ville..."
          className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
        />
      </div>

      {/* Droite */}
      <div className="flex items-center gap-4 ml-2">
        {/* Bonjour */}
        {agent && (
          <span className="hidden sm:block text-sm text-gray-600 font-medium whitespace-nowrap">
            Bonjour <span className="font-semibold text-gray-900">{firstName} !</span>
          </span>
        )}

        {/* Séparateur */}
        {agent && <div className="hidden sm:block h-5 w-px bg-gray-200" />}

        {/* Solde */}
        {agent && (
          <div className="hidden sm:flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-sm text-gray-500">Solde Comm. :</span>
            <span className="text-sm font-bold" style={{ color: '#f97316' }}>
              {agent.balance.toLocaleString('fr-MA', { minimumFractionDigits: 2 })} MAD
            </span>
          </div>
        )}

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <p className="font-semibold text-sm text-gray-800">Notifications</p>
                <button
                  onClick={async () => {
                    await api.notifications.markAllRead()
                    setNotifs(n => n.map(x => ({ ...x, read: true })))
                    setUnreadCount(0)
                  }}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Tout lire
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifs.length === 0 && (
                  <p className="text-center text-gray-400 text-sm py-8">Aucune notification</p>
                )}
                {notifs.map(n => (
                  <div
                    key={n.id}
                    onClick={() => handleMarkRead(n.id)}
                    className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-50 last:border-0 ${!n.read ? 'bg-orange-50' : ''}`}
                  >
                    <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${typeColor[n.type] || 'bg-gray-400'}`} />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-snug">{n.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Avatar */}
        <button
          onClick={() => navigate('/profile')}
          className="w-9 h-9 rounded-full text-white flex items-center justify-center text-xs font-bold hover:opacity-90 transition-opacity flex-shrink-0"
          style={{ backgroundColor: '#1e2d6b' }}
        >
          {initials}
        </button>
      </div>
    </header>
  )
}
