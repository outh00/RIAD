import { useState, useEffect } from 'react'
import { Phone, Droplets, Zap, Send, CreditCard, Lock, ChevronRight, Star, Trash2 } from 'lucide-react'
import { api } from '../api/client'
import PaymentModal from '../components/PaymentModal'

const FAVS_KEY = 'm2t_favorites'
const loadFavs = () => { try { return JSON.parse(localStorage.getItem(FAVS_KEY) || '[]') } catch { return [] } }

const SVC_META = {
  facture_eau:  { Icon: Droplets,   bg: 'bg-blue-100',   text: 'text-blue-600' },
  facture_elec: { Icon: Zap,        bg: 'bg-yellow-100', text: 'text-yellow-600' },
  recharge:     { Icon: Phone,      bg: 'bg-purple-100', text: 'text-purple-600' },
  transfert:    { Icon: Send,       bg: 'bg-green-100',  text: 'text-green-600' },
  chaabi_pay:   { Icon: CreditCard, bg: 'bg-orange-100', text: 'text-orange-600' },
}

export default function Favoris() {
  const [favorites, setFavorites] = useState(loadFavs)
  const [services, setServices] = useState([])
  const [payingConfig, setPayingConfig] = useState(null)

  useEffect(() => {
    api.agent.services().then(setServices).catch(() => {})
  }, [])

  const removeFav = (serviceId, subId) => {
    const next = favorites.filter(f => !(f.serviceId === serviceId && f.subId === subId))
    setFavorites(next)
    localStorage.setItem(FAVS_KEY, JSON.stringify(next))
  }

  const openFav = (fav) => {
    const svc = services.find(s => s.id === fav.serviceId)
    if (!svc?.isUnlocked) return
    setPayingConfig({
      service: svc,
      initialSubService: { id: fav.subId, name: fav.name, sub: fav.sub, color: fav.color },
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-yellow-100 rounded-xl flex items-center justify-center">
          <Star size={18} className="text-yellow-500" fill="currentColor" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Mes Favoris</h1>
        {favorites.length > 0 && (
          <span className="bg-yellow-400 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {favorites.length}
          </span>
        )}
      </div>

      {payingConfig && (
        <PaymentModal
          service={payingConfig.service}
          initialSubService={payingConfig.initialSubService}
          onClose={() => setPayingConfig(null)}
          onSuccess={() => {}}
        />
      )}

      {favorites.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-gray-100 shadow-sm">
          <Star size={48} className="mx-auto mb-4 text-gray-200" />
          <p className="font-semibold text-gray-500">Aucun favori enregistré</p>
          <p className="text-sm text-gray-400 mt-1">
            Cliquez sur ★ lors du choix d'un facturier ou opérateur pour l'ajouter ici.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites.map(fav => {
            const meta = SVC_META[fav.serviceId] || { Icon: CreditCard, bg: 'bg-gray-100', text: 'text-gray-600' }
            const { Icon } = meta
            const svc = services.find(s => s.id === fav.serviceId)
            const unlocked = svc?.isUnlocked ?? false

            return (
              <div
                key={`${fav.serviceId}_${fav.subId}`}
                className="bg-white rounded-2xl p-4 shadow-sm border border-yellow-100 hover:border-yellow-200 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${meta.bg} ${meta.text}`}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{fav.name}</p>
                      <p className="text-xs text-gray-400">{fav.serviceName}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFav(fav.serviceId, fav.subId)}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                    title="Retirer des favoris"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {fav.sub && <p className="text-xs text-gray-400 mb-3">{fav.sub}</p>}

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Commission : <span className="font-semibold">{((fav.commissionRate || 0) * 100).toFixed(1)}%</span>
                  </span>
                  {unlocked ? (
                    <button
                      onClick={() => openFav(fav)}
                      className="flex items-center gap-1 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Payer <ChevronRight size={12} />
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Lock size={11} /> Verrouillé
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
