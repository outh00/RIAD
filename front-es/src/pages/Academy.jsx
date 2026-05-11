import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlayCircle, CheckCircle, Clock, Lock } from 'lucide-react'
import { api } from '../api/client'

export default function Academy() {
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.academy.list().then(setModules).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700" />
    </div>
  )

  const completed = modules.filter(m => m.progress?.qcmPassed).length
  const totalPct = modules.length ? Math.round((completed / modules.length) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">RIAD Academy</h1>
          <p className="text-sm text-gray-500">Complétez les formations pour activer de nouveaux services</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-blue-700">{totalPct}%</p>
          <p className="text-xs text-gray-500">{completed}/{modules.length} complétés</p>
        </div>
      </div>

      {/* Barre de progression globale */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-700">Progression globale</p>
          <p className="text-sm font-bold text-blue-700">{totalPct}%</p>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-700"
            style={{ width: `${totalPct}%` }}
          />
        </div>
      </div>

      {/* Liste des modules */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map(module => {
          const { progress } = module
          const watched = progress?.watched
          const passed = progress?.qcmPassed
          const score = progress?.score

          let statusColor = 'border-gray-100'
          let badgeEl = null

          if (passed) {
            statusColor = 'border-green-200'
            badgeEl = <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Validé {score}%</span>
          } else if (watched) {
            statusColor = 'border-yellow-200'
            badgeEl = <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">QCM en attente</span>
          } else {
            badgeEl = <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">Non démarré</span>
          }

          return (
            <div
              key={module.id}
              onClick={() => navigate(`/academy/${module.id}`)}
              className={`bg-white rounded-2xl p-5 shadow-sm border ${statusColor} cursor-pointer hover:shadow-md transition-all`}
            >
              <div className="flex items-start justify-between mb-3">
                {badgeEl}
                {passed
                  ? <CheckCircle size={20} className="text-green-500" />
                  : watched
                    ? <Clock size={20} className="text-yellow-500" />
                    : <Lock size={18} className="text-gray-400" />
                }
              </div>

              <h3 className="font-semibold text-gray-800 text-sm mb-1 leading-snug">{module.title}</h3>
              <p className="text-xs text-gray-500 mb-3 leading-snug">{module.description}</p>

              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <PlayCircle size={12} />
                  {Math.floor(module.duration / 60)}min {module.duration % 60}s
                </span>
                <span>{module.questionCount} questions</span>
              </div>

              {module.serviceName && (
                <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                  <span className="text-xs text-gray-500">Active: <span className="font-medium text-gray-700">{module.serviceName}</span></span>
                  {module.serviceUnlocked && <CheckCircle size={14} className="text-green-500" />}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
