import { useState, useEffect } from 'react'
import { MapPin, Phone, Award } from 'lucide-react'
import { api } from '../api/client'

export default function Profile() {
  const [agent, setAgent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.agent.get().then(setAgent).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700" />
    </div>
  )

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Mon Profil</h1>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
        <div className="w-20 h-20 bg-blue-700 text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-3">
          {agent?.name?.charAt(0)}
        </div>
        <h2 className="text-lg font-bold text-gray-900">{agent?.name}</h2>
        <div className="flex items-center justify-center gap-4 mt-3 text-sm text-gray-500">
          <span className="flex items-center gap-1"><MapPin size={14} />{agent?.city}</span>
          <span className="flex items-center gap-1"><Phone size={14} />{agent?.phone}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-2xl font-bold text-blue-700">{agent?.balance?.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">MAD de commissions</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-2xl font-bold text-gray-900">{agent?.totalTransactions}</p>
          <p className="text-xs text-gray-500 mt-1">Transactions totales</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Award size={16} className="text-blue-600" /> Services actifs
        </p>
        {agent?.unlockedServices?.length === 0 && (
          <p className="text-sm text-gray-400">Aucun service activé pour le moment.</p>
        )}
        <div className="flex flex-wrap gap-2">
          {agent?.unlockedServices?.map(s => (
            <span key={s} className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
