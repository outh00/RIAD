import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus, Zap, Users, AlertTriangle, CheckCircle, Star, Brain } from 'lucide-react'
import { api } from '../api/client'

export default function Analytics() {
  const [agents, setAgents] = useState([])
  const [transactions, setTransactions] = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.agents.list(), api.transactions.list(), api.services.list()])
      .then(([ags, { data: txns }, svcs]) => { setAgents(ags); setTransactions(txns); setServices(svcs) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700" />
    </div>
  )

  const now = new Date()
  const month = now.toISOString().substring(0, 7)
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().substring(0, 7)

  const monthTxns = transactions.filter(t => t.date.startsWith(month))
  const prevMonthTxns = transactions.filter(t => t.date.startsWith(prevMonth))

  const totalCommM = monthTxns.reduce((s, t) => s + t.commission, 0)
  const totalCommP = prevMonthTxns.reduce((s, t) => s + t.commission, 0)
  const commGrowth = totalCommP > 0 ? Math.round(((totalCommM - totalCommP) / totalCommP) * 100) : 0

  // Agent performance score
  const agentScores = agents.map(agent => {
    const txns = monthTxns.filter(t => t.agentId === agent.id)
    const commission = txns.reduce((s, t) => s + t.commission, 0)
    const txnCount = txns.length
    const servicesUsed = [...new Set(txns.map(t => t.serviceId))].length
    const objective = agent.dailyObjectiveMAD || 1000
    const dailyAvg = commission / Math.max(1, new Date().getDate())
    const objCompletion = Math.min(100, Math.round((dailyAvg / objective) * 100))
    const diversity = Math.round((servicesUsed / Math.max(1, services.length)) * 100)
    const score = Math.round(objCompletion * 0.5 + diversity * 0.3 + Math.min(100, txnCount * 2) * 0.2)
    return { ...agent, commission, txnCount, servicesUsed, objCompletion, diversity, score }
  }).sort((a, b) => b.score - a.score)

  // Service adoption
  const serviceStats = services.map(svc => {
    const txns = monthTxns.filter(t => t.serviceId === svc.id)
    const agentsUsingIt = [...new Set(txns.map(t => t.agentId))].length
    const adoption = Math.round((agentsUsingIt / Math.max(1, agents.length)) * 100)
    const commission = txns.reduce((s, t) => s + t.commission, 0)
    return { ...svc, txnCount: txns.length, agentsUsingIt, adoption, commission }
  }).sort((a, b) => b.adoption - a.adoption)

  // AI Recommendations (computed from real data)
  const recommendations = []

  const underperformers = agentScores.filter(a => a.score < 40)
  if (underperformers.length > 0) {
    recommendations.push({
      type: 'warning',
      icon: AlertTriangle,
      title: `${underperformers.length} ES en sous-performance`,
      body: `${underperformers.map(a => a.name.split(' ')[0]).join(', ')} ont un score < 40. Recommandé : session de coaching + rappel des formations Academy.`,
      priority: 'haute',
    })
  }

  const underusedServices = serviceStats.filter(s => s.adoption < 30 && s.active)
  if (underusedServices.length > 0) {
    recommendations.push({
      type: 'info',
      icon: Zap,
      title: `${underusedServices.length} service(s) sous-utilisé(s)`,
      body: `${underusedServices.map(s => s.name).join(', ')} ont < 30% d'adoption. Envisagez une campagne de notification ou une promo temporaire.`,
      priority: 'moyenne',
    })
  }

  const topAgent = agentScores[0]
  if (topAgent && topAgent.score > 70) {
    recommendations.push({
      type: 'success',
      icon: Star,
      title: `Meilleur ES : ${topAgent.name}`,
      body: `Score IA ${topAgent.score}/100 · ${topAgent.txnCount} transactions · ${topAgent.servicesUsed} services actifs. Profil à valoriser comme référence réseau.`,
      priority: 'info',
    })
  }

  if (commGrowth < -10) {
    recommendations.push({
      type: 'warning',
      icon: TrendingDown,
      title: 'Baisse des commissions globales',
      body: `Les commissions ont baissé de ${Math.abs(commGrowth)}% vs le mois précédent. Analyser les services perdants et activer des promotions ciblées.`,
      priority: 'haute',
    })
  } else if (commGrowth > 10) {
    recommendations.push({
      type: 'success',
      icon: TrendingUp,
      title: 'Croissance des commissions',
      body: `+${commGrowth}% vs mois précédent. Capitaliser sur les services performants et dupliquer les bonnes pratiques dans le réseau.`,
      priority: 'info',
    })
  }

  const lowDiversity = agentScores.filter(a => a.servicesUsed <= 1 && a.txnCount > 0)
  if (lowDiversity.length > 0) {
    recommendations.push({
      type: 'info',
      icon: Users,
      title: 'Faible diversification des services',
      body: `${lowDiversity.length} ES n'utilisent qu'1 service. Opportunité cross-selling élevée : proposer des formations pour activer les services adjacents.`,
      priority: 'moyenne',
    })
  }

  const PRIORITY_STYLE = {
    haute:   'bg-red-50 border-red-200 text-red-800',
    moyenne: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info:    'bg-blue-50 border-blue-200 text-blue-800',
  }
  const PRIORITY_BADGE = {
    haute:   'bg-red-100 text-red-700',
    moyenne: 'bg-yellow-100 text-yellow-700',
    info:    'bg-blue-100 text-blue-700',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
          <Brain size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Analytics IA</h1>
          <p className="text-xs text-gray-400">Analyse automatique du réseau ES · {now.toLocaleDateString('fr-MA', { month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      {/* KPIs globaux */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Commissions ce mois" value={`${totalCommM.toFixed(2)} MAD`}
          trend={commGrowth} sub={`vs ${prevMonth}`} />
        <KPICard label="Transactions" value={monthTxns.length}
          trend={prevMonthTxns.length > 0 ? Math.round(((monthTxns.length - prevMonthTxns.length) / prevMonthTxns.length) * 100) : 0} />
        <KPICard label="ES actifs" value={agents.filter(a => monthTxns.some(t => t.agentId === a.id)).length}
          sub={`/ ${agents.length} agents`} />
        <KPICard label="Services adoptés" value={`${Math.round(serviceStats.filter(s => s.adoption > 0).length / Math.max(1, services.length) * 100)}%`}
          sub={`${serviceStats.filter(s => s.adoption > 0).length}/${services.length} actifs`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recommandations IA */}
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Brain size={16} className="text-blue-600" /> Recommandations IA
          </h2>
          {recommendations.length === 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-center">
              <CheckCircle size={32} className="text-blue-500 mx-auto mb-2" />
              <p className="text-sm text-blue-700 font-medium">Réseau en bonne santé. Aucune alerte détectée.</p>
            </div>
          )}
          {recommendations.map((rec, i) => {
            const { icon: Icon } = rec
            return (
              <div key={i} className={`rounded-2xl border p-4 ${PRIORITY_STYLE[rec.priority]}`}>
                <div className="flex items-start gap-3">
                  <Icon size={18} className="flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm">{rec.title}</p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${PRIORITY_BADGE[rec.priority]}`}>
                        {rec.priority}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed opacity-80">{rec.body}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Classement agents */}
        <div>
          <h2 className="font-semibold text-gray-800 mb-3">Classement ES (Score IA)</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {agentScores.map((agent, idx) => (
              <div key={agent.id} className={`flex items-center gap-4 px-5 py-3.5 ${idx < agentScores.length - 1 ? 'border-b border-gray-50' : ''}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx === 1 ? 'bg-gray-100 text-gray-600' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-400'
                }`}>{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{agent.name}</p>
                  <p className="text-xs text-gray-400">{agent.txnCount} txn · {agent.servicesUsed} services · obj. {agent.objCompletion}%</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-bold ${agent.score >= 70 ? 'text-blue-600' : agent.score >= 40 ? 'text-orange-500' : 'text-red-500'}`}>
                    {agent.score}/100
                  </p>
                  <div className="w-16 h-1.5 bg-gray-100 rounded-full mt-1">
                    <div className={`h-full rounded-full ${agent.score >= 70 ? 'bg-blue-500' : agent.score >= 40 ? 'bg-orange-400' : 'bg-red-400'}`}
                      style={{ width: `${agent.score}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Adoption des services */}
      <div>
        <h2 className="font-semibold text-gray-800 mb-3">Adoption des services</h2>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Service', 'Adoption réseau', 'Transactions', 'Commissions générées', 'Tendance'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {serviceStats.map((svc, idx) => {
                const prevTxns = prevMonthTxns.filter(t => t.serviceId === svc.id).length
                const trend = prevTxns > 0 ? Math.round(((svc.txnCount - prevTxns) / prevTxns) * 100) : svc.txnCount > 0 ? 100 : 0
                return (
                  <tr key={svc.id} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{svc.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-gray-100 rounded-full">
                          <div className={`h-full rounded-full ${svc.adoption >= 60 ? 'bg-blue-500' : svc.adoption >= 30 ? 'bg-yellow-400' : 'bg-red-400'}`}
                            style={{ width: `${svc.adoption}%` }} />
                        </div>
                        <span className="text-xs font-medium text-gray-600">{svc.adoption}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{svc.txnCount}</td>
                    <td className="px-4 py-3 font-semibold text-blue-600">+{svc.commission.toFixed(2)} MAD</td>
                    <td className="px-4 py-3">
                      {trend > 0
                        ? <span className="flex items-center gap-1 text-xs text-blue-600 font-semibold"><TrendingUp size={12} />+{trend}%</span>
                        : trend < 0
                        ? <span className="flex items-center gap-1 text-xs text-red-500 font-semibold"><TrendingDown size={12} />{trend}%</span>
                        : <span className="flex items-center gap-1 text-xs text-gray-400"><Minus size={12} />—</span>
                      }
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

function KPICard({ label, value, trend, sub }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <div className="flex items-center gap-2 mt-1">
        {trend !== undefined && trend !== 0 && (
          <span className={`text-xs font-semibold flex items-center gap-0.5 ${trend > 0 ? 'text-blue-600' : 'text-red-500'}`}>
            {trend > 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
        {sub && <span className="text-xs text-gray-400">{sub}</span>}
      </div>
    </div>
  )
}
