import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, TrendingUp, Banknote, Activity, ChevronRight, CheckCircle, AlertCircle } from 'lucide-react'
import { api } from '../api/client'
import StatsCard from '../components/StatsCard'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([api.transactions.stats(), api.agents.list()])
      .then(([s, a]) => { setStats(s); setAgents(a) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700" />
    </div>
  )

  // Données graphique : progression objectif par agent
  const chartData = agents.map(a => ({
    name: a.name.split(' ')[0],
    pct: Math.round((a.dailyProgress / a.dailyObjective) * 100),
    txns: a.totalTransactions,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard Supervision</h1>
        <p className="text-sm text-gray-500">{agents.length} agent(s) ES actif(s)</p>
      </div>

      {/* KPIs globaux */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Transactions totales" value={stats?.totalTransactions} icon={Activity} color="blue" />
        <StatsCard label="CA total" value={stats?.totalRevenue?.toFixed(0)} unit="MAD" icon={Banknote} color="blue" />
        <StatsCard label="Commissions distribuées" value={stats?.totalCommissions?.toFixed(2)} unit="MAD" icon={TrendingUp} color="amber" />
        <StatsCard label="Transactions aujourd'hui" value={stats?.todayTransactions} sub={`${stats?.todayRevenue?.toFixed(0)} MAD`} icon={Users} color="purple" />
      </div>

      {/* Graphique progression objectifs */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-800 mb-4">Progression objectif journalier par agent (%)</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} barSize={32}>
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
            <Tooltip formatter={(v) => [`${v}%`, 'Progression']} />
            <Bar dataKey="pct" fill="#2563eb" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tableau des agents */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Agents ES</h2>
          <button onClick={() => navigate('/agents')} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
            Voir tous <ChevronRight size={12} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Agent</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ville</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Objectif</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Solde</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Services</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {agents.map(agent => {
                const pct = Math.round((agent.dailyProgress / agent.dailyObjective) * 100)
                return (
                  <tr key={agent.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-700 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {agent.name.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-800">{agent.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{agent.city}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-20 h-1.5 bg-gray-100 rounded-full">
                          <div
                            className={`h-full rounded-full ${pct >= 100 ? 'bg-blue-500' : pct >= 60 ? 'bg-blue-500' : 'bg-amber-400'}`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 w-8">{pct}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-800">{agent.balance.toFixed(2)} MAD</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {agent.unlockedServices.length > 0
                          ? <CheckCircle size={14} className="text-blue-500" />
                          : <AlertCircle size={14} className="text-amber-400" />
                        }
                        <span className="text-xs text-gray-500">{agent.unlockedServices.length} actifs</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => navigate(`/agents/${agent.id}`)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Détail
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
