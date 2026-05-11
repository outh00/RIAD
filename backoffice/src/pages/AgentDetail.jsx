import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, Lock, BookOpen } from 'lucide-react'
import { api } from '../api/client'

export default function AgentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [agent, setAgent] = useState(null)
  const [services, setServices] = useState([])
  const [academy, setAcademy] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.agents.get(id),
      api.agents.services(id),
      api.agents.academy(id),
      api.transactions.list({ agentId: id, limit: 10 }),
    ]).then(([a, s, ac, t]) => {
      setAgent(a)
      setServices(s)
      setAcademy(ac)
      setTransactions(t.data || [])
    }).finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700" />
    </div>
  )

  if (!agent) return <p className="text-center text-gray-500 py-12">Agent introuvable</p>

  const pct = Math.round((agent.dailyProgress / agent.dailyObjective) * 100)

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <button onClick={() => navigate('/agents')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} /> Retour aux agents
      </button>

      {/* Profil */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-700 text-white rounded-full flex items-center justify-center text-2xl font-bold">
            {agent.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{agent.name}</h1>
            <p className="text-sm text-gray-500">{agent.city} — {agent.phone}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
          {[
            { label: 'Solde', value: `${agent.balance.toFixed(2)} MAD` },
            { label: 'Transactions', value: agent.totalTransactions },
            { label: 'Clients', value: agent.totalClients },
            { label: 'Objectif', value: `${pct}%` },
          ].map(s => (
            <div key={s.label} className="text-center p-3 bg-gray-50 rounded-xl">
              <p className="text-lg font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Services */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Lock size={16} className="text-blue-600" /> Services
          </h2>
          <div className="space-y-2">
            {services.map(s => (
              <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-700">{s.name}</span>
                {s.isUnlocked
                  ? <span className="flex items-center gap-1 text-xs text-blue-600"><CheckCircle size={12} /> Actif</span>
                  : <span className="text-xs text-gray-400">Verrouillé</span>
                }
              </div>
            ))}
          </div>
        </div>

        {/* Academy */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BookOpen size={16} className="text-blue-600" /> Formations
          </h2>
          <div className="space-y-2">
            {academy.map(m => (
              <div key={m.id} className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-700 truncate pr-2">{m.title}</span>
                {m.progress?.qcmPassed
                  ? <span className="text-xs text-blue-600 flex-shrink-0">✓ {m.progress.score}%</span>
                  : m.progress?.watched
                    ? <span className="text-xs text-amber-500 flex-shrink-0">En cours</span>
                    : <span className="text-xs text-gray-400 flex-shrink-0">Non démarré</span>
                }
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dernières transactions */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-800 mb-4">10 dernières transactions</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left pb-2 text-xs font-semibold text-gray-500">Client</th>
                <th className="text-left pb-2 text-xs font-semibold text-gray-500">Service</th>
                <th className="text-right pb-2 text-xs font-semibold text-gray-500">Montant</th>
                <th className="text-right pb-2 text-xs font-semibold text-gray-500">Commission</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 && (
                <tr><td colSpan={4} className="text-center text-gray-400 py-6">Aucune transaction</td></tr>
              )}
              {transactions.map(t => (
                <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2.5">{t.client}</td>
                  <td className="py-2.5 text-gray-500">{t.serviceName}</td>
                  <td className="py-2.5 text-right font-medium">{t.amount.toFixed(2)} MAD</td>
                  <td className="py-2.5 text-right text-blue-600">+{t.commission.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
