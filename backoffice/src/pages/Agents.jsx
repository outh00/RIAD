import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, ChevronRight, CheckCircle, AlertCircle } from 'lucide-react'
import { api } from '../api/client'

export default function Agents() {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.agents.list().then(setAgents).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Agents ES ({agents.length})</h1>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map(agent => {
          const pct = Math.round((agent.dailyProgress / agent.dailyObjective) * 100)
          const pctColor = pct >= 100 ? 'text-blue-600' : pct >= 60 ? 'text-blue-600' : 'text-amber-500'
          const barColor = pct >= 100 ? 'bg-blue-500' : pct >= 60 ? 'bg-blue-500' : 'bg-amber-400'

          return (
            <div key={agent.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-blue-200 transition-all">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-11 h-11 bg-blue-700 text-white rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0">
                  {agent.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800">{agent.name}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin size={11} />{agent.city}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Objectif du jour</span>
                  <span className={`font-bold ${pctColor}`}>{pct}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full">
                  <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>

                <div className="flex justify-between pt-1">
                  <span className="text-gray-500">Solde commissions</span>
                  <span className="font-semibold text-gray-800">{agent.balance.toFixed(2)} MAD</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">Transactions</span>
                  <span className="font-semibold text-gray-800">{agent.totalTransactions}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">Services actifs</span>
                  <span className="flex items-center gap-1">
                    {agent.unlockedServices.length > 0
                      ? <CheckCircle size={13} className="text-blue-500" />
                      : <AlertCircle size={13} className="text-amber-400" />
                    }
                    <span className="font-semibold text-gray-800">{agent.unlockedServices.length}</span>
                  </span>
                </div>
              </div>

              <button
                onClick={() => navigate(`/agents/${agent.id}`)}
                className="w-full flex items-center justify-center gap-1 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors"
              >
                Voir le détail <ChevronRight size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
