export default function DailyObjective({ revenueToday = 0, objectiveMAD = 1000 }) {
  const pct = Math.min(100, Math.round((revenueToday / objectiveMAD) * 100))
  const r = 54
  const circumference = 2 * Math.PI * r
  const dash = (pct / 100) * circumference
  const remaining = Math.max(0, objectiveMAD - revenueToday)

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <h3 className="font-semibold text-gray-800 text-sm mb-4 flex items-center gap-2">
        <span className="w-5 h-5 rounded-full border-2 border-orange-500 flex items-center justify-center">
          <span className="w-2 h-2 rounded-full bg-orange-500" />
        </span>
        Objectif Journalier
      </h3>

      <div className="flex flex-col items-center">
        <div className="relative w-36 h-36">
          <svg width="144" height="144" className="-rotate-90">
            <circle cx="72" cy="72" r={r} fill="none" stroke="#f1f5f9" strokeWidth="14" />
            <circle
              cx="72" cy="72" r={r}
              fill="none"
              stroke="#f97316"
              strokeWidth="14"
              strokeDasharray={`${dash} ${circumference}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 1s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-gray-900">{pct}</span>
            <span className="text-sm text-gray-400 -mt-1">%</span>
          </div>
        </div>

        {remaining > 0 ? (
          <p className="text-sm text-gray-600 mt-3 text-center">
            Encore <span className="font-bold" style={{ color: '#f97316' }}>{remaining.toFixed(2)} MAD</span> pour valider.
          </p>
        ) : (
          <p className="text-sm font-bold text-green-600 mt-3">🎉 Objectif atteint !</p>
        )}

        <div className="flex items-center gap-6 mt-4 w-full border-t border-gray-100 pt-4">
          <div className="flex-1 text-center">
            <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              Réalisé
            </p>
            <p className="font-bold text-gray-900 text-sm">{revenueToday.toFixed(0)} MAD</p>
          </div>
          <div className="h-8 w-px bg-gray-100" />
          <div className="flex-1 text-center">
            <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
              <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />
              Objectif
            </p>
            <p className="font-bold text-gray-900 text-sm">{objectiveMAD.toFixed(0)} MAD</p>
          </div>
        </div>
      </div>
    </div>
  )
}
