import { TrendingUp, TrendingDown } from 'lucide-react'

export default function StatsCard({ label, value, unit = '', growth, icon: Icon, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    amber: 'bg-amber-50 text-amber-700',
    purple: 'bg-purple-50 text-purple-700',
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">
            {value}
            {unit && <span className="text-sm font-medium text-gray-500 ml-1">{unit}</span>}
          </p>
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-xl ${colors[color]}`}>
            <Icon size={20} />
          </div>
        )}
      </div>
      {growth !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${growth >= 0 ? 'text-green-600' : 'text-red-500'}`}>
          {growth >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {growth >= 0 ? '+' : ''}{growth}% cette semaine
        </div>
      )}
    </div>
  )
}
