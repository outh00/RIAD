export default function TransactionTable({ transactions = [], limit }) {
  const rows = limit ? transactions.slice(0, limit) : transactions

  const statusColor = {
    completed: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    failed: 'bg-red-100 text-red-700',
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Client</th>
            <th className="text-left pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Service</th>
            <th className="text-right pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Montant</th>
            <th className="text-right pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Commission</th>
            <th className="text-right pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="text-center text-gray-400 py-8">Aucune transaction</td>
            </tr>
          )}
          {rows.map(t => (
            <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td className="py-3 font-medium text-gray-800">{t.client}</td>
              <td className="py-3 text-gray-600">{t.serviceName}</td>
              <td className="py-3 text-right font-semibold">{t.amount.toFixed(2)} MAD</td>
              <td className="py-3 text-right text-green-600 font-semibold">+{t.commission.toFixed(2)} MAD</td>
              <td className="py-3 text-right text-gray-400 text-xs">
                {new Date(t.date).toLocaleDateString('fr-MA', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
