import { useState, useEffect } from 'react'
import { api } from '../api/client'

export default function TransactionsPage() {
  const [data, setData] = useState({ total: 0, data: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.transactions.list({ limit: 100 }).then(setData).finally(() => setLoading(false))
  }, [])

  const exportCsv = () => {
    const header = 'ID,Agent,Client,Service,Montant,Commission,Date'
    const rows = data.data.map(t =>
      `${t.id},${t.agentId},${t.client},${t.serviceName},${t.amount},${t.commission},${t.date}`
    )
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700" />
    </div>
  )

  const totalCommissions = data.data.reduce((s, t) => s + t.commission, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Transactions</h1>
          <p className="text-sm text-gray-500">{data.total} transaction(s) au total</p>
        </div>
        <button
          onClick={exportCsv}
          className="text-sm bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors"
        >
          Exporter CSV
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-2xl font-bold text-gray-900">{data.total}</p>
          <p className="text-xs text-gray-500 mt-1">Transactions totales</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-2xl font-bold text-blue-600">{totalCommissions.toFixed(2)} MAD</p>
          <p className="text-xs text-gray-500 mt-1">Commissions distribuées</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Agent', 'Client', 'Service', 'Montant', 'Commission', 'Date'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.data.length === 0 && (
                <tr><td colSpan={6} className="text-center text-gray-400 py-8">Aucune transaction</td></tr>
              )}
              {data.data.map(t => (
                <tr key={t.id} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 text-xs">{t.agentId}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{t.client}</td>
                  <td className="px-4 py-3 text-gray-600">{t.serviceName}</td>
                  <td className="px-4 py-3 font-semibold">{t.amount.toFixed(2)} MAD</td>
                  <td className="px-4 py-3 text-blue-600 font-semibold">+{t.commission.toFixed(2)}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(t.date).toLocaleDateString('fr-MA', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
