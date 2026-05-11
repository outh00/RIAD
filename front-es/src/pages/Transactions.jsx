import { useState, useEffect, useMemo } from 'react'
import { Phone, Droplets, Zap, Send, CreditCard, Filter, Download } from 'lucide-react'
import { api } from '../api/client'

const SERVICE_META = {
  recharge:     { Icon: Phone,      bg: 'bg-purple-100', text: 'text-purple-600' },
  facture_eau:  { Icon: Droplets,   bg: 'bg-blue-100',   text: 'text-blue-600'  },
  facture_elec: { Icon: Zap,        bg: 'bg-yellow-100', text: 'text-yellow-600' },
  transfert:    { Icon: Send,       bg: 'bg-green-100',  text: 'text-green-600' },
  chaabi_pay:   { Icon: CreditCard, bg: 'bg-orange-100', text: 'text-orange-600' },
}

const STATUS_STYLE = {
  completed: 'bg-green-100 text-green-700',
  pending:   'bg-yellow-100 text-yellow-700',
  failed:    'bg-red-100 text-red-600',
}
const STATUS_LABEL = { completed: 'Validée', pending: 'En cours', failed: 'Échouée' }

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterService, setFilterService] = useState('all')
  const [filterPeriod, setFilterPeriod] = useState('all')

  useEffect(() => {
    api.transactions.list().then(setTransactions).catch(console.error).finally(() => setLoading(false))
  }, [])

  const services = useMemo(() => [...new Set(transactions.map(t => t.serviceId))], [transactions])

  const filtered = useMemo(() => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const month = now.toISOString().substring(0, 7)
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay()); weekStart.setHours(0,0,0,0)

    return transactions.filter(t => {
      if (filterStatus !== 'all' && t.status !== filterStatus) return false
      if (filterService !== 'all' && t.serviceId !== filterService) return false
      if (filterPeriod === 'today' && !t.date.startsWith(today)) return false
      if (filterPeriod === 'week' && new Date(t.date) < weekStart) return false
      if (filterPeriod === 'month' && !t.date.startsWith(month)) return false
      return true
    })
  }, [transactions, filterStatus, filterService, filterPeriod])

  const totalAmount = filtered.reduce((s, t) => s + t.amount, 0)
  const totalCommission = filtered.reduce((s, t) => s + t.commission, 0)

  // Par service breakdown
  const byService = useMemo(() => {
    const map = {}
    filtered.forEach(t => {
      if (!map[t.serviceId]) map[t.serviceId] = { name: t.serviceName, count: 0, amount: 0, commission: 0 }
      map[t.serviceId].count++
      map[t.serviceId].amount += t.amount
      map[t.serviceId].commission += t.commission
    })
    return Object.entries(map).sort((a, b) => b[1].commission - a[1].commission)
  }, [filtered])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700" />
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Historique des transactions</h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPI label="Transactions" value={filtered.length} />
        <KPI label="Montant traité" value={`${totalAmount.toLocaleString('fr-MA', { minimumFractionDigits: 2 })} MAD`} />
        <KPI label="Commissions" value={`+${totalCommission.toFixed(2)} MAD`} color="text-green-600" />
        <KPI label="Taux succès" value={`${filtered.length ? Math.round(filtered.filter(t => t.status === 'completed').length / filtered.length * 100) : 0}%`} />
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-wrap gap-3 items-center">
        <Filter size={15} className="text-gray-400" />
        <select value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)} className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-400">
          <option value="all">Toute période</option>
          <option value="today">Aujourd'hui</option>
          <option value="week">Cette semaine</option>
          <option value="month">Ce mois</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-400">
          <option value="all">Tous statuts</option>
          <option value="completed">Validée</option>
          <option value="pending">En cours</option>
          <option value="failed">Échouée</option>
        </select>
        <select value={filterService} onChange={e => setFilterService(e.target.value)} className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-400">
          <option value="all">Tous services</option>
          {services.map(sid => {
            const t = transactions.find(x => x.serviceId === sid)
            return <option key={sid} value={sid}>{t?.serviceName || sid}</option>
          })}
        </select>
        <span className="ml-auto text-xs text-gray-400">{filtered.length} résultat{filtered.length > 1 ? 's' : ''}</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Service', 'Client', 'Montant', 'Commission', 'Statut', 'Date'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="text-center text-gray-400 py-10">Aucune transaction</td></tr>
                )}
                {filtered.map(t => {
                  const meta = SERVICE_META[t.serviceId] || { Icon: CreditCard, bg: 'bg-gray-100', text: 'text-gray-600' }
                  const { Icon } = meta
                  return (
                    <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg ${meta.bg} ${meta.text} flex items-center justify-center flex-shrink-0`}>
                            <Icon size={13} />
                          </div>
                          <span className="text-xs font-medium text-gray-800 leading-tight">{t.serviceName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{t.client}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-gray-800 whitespace-nowrap">
                        {t.amount.toLocaleString('fr-MA', { minimumFractionDigits: 2 })} MAD
                      </td>
                      <td className="px-4 py-3 text-xs font-bold text-green-600 whitespace-nowrap">
                        +{t.commission.toLocaleString('fr-MA', { minimumFractionDigits: 2 })} MAD
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_STYLE[t.status] || STATUS_STYLE.completed}`}>
                          {STATUS_LABEL[t.status] || t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {new Date(t.date).toLocaleDateString('fr-MA', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Breakdown par service */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <p className="font-semibold text-gray-800 text-sm mb-4">Répartition par service</p>
          {byService.length === 0 && <p className="text-xs text-gray-400">Aucune donnée</p>}
          <div className="space-y-3">
            {byService.map(([sid, data]) => {
              const meta = SERVICE_META[sid] || { bg: 'bg-gray-100', text: 'text-gray-600' }
              const pct = totalCommission > 0 ? Math.round(data.commission / totalCommission * 100) : 0
              return (
                <div key={sid}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700">{data.name}</span>
                    <span className="text-xs font-bold text-green-600">+{data.commission.toFixed(2)} MAD</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">{data.count} txn · {data.amount.toLocaleString('fr-MA')} MAD traités</p>
                </div>
              )
            })}
          </div>

          <div className="mt-5 pt-4 border-t border-gray-100 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total traité</span>
              <span className="font-bold text-gray-800">{totalAmount.toLocaleString('fr-MA', { minimumFractionDigits: 2 })} MAD</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total commissions</span>
              <span className="font-bold text-green-600">+{totalCommission.toFixed(2)} MAD</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function KPI({ label, value, color = 'text-gray-900' }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  )
}
