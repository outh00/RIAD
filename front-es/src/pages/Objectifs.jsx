import { useState, useEffect } from 'react'
import { Plus, Trash2, Target, TrendingUp, X, Check } from 'lucide-react'
import { api } from '../api/client'

const PERIOD_LABEL = { daily: 'Journalier', weekly: 'Hebdomadaire', monthly: 'Mensuel' }
const SOURCE_STYLE = { bo: 'bg-blue-100 text-blue-700', agent: 'bg-orange-100 text-orange-700' }
const SOURCE_LABEL = { bo: 'BO', agent: 'Personnel' }

const COLOR_BY_PCT = (p) => p >= 100 ? '#16a34a' : p >= 60 ? '#f97316' : '#e11d48'

export default function Objectifs() {
  const [objectives, setObjectives] = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ label: '', serviceId: '', category: '', targetAmount: '', targetCount: '', period: 'monthly' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([api.objectives.list(), api.services.list()])
      .then(([objs, svcs]) => { setObjectives(objs); setServices(svcs) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleCreate = async () => {
    if (!form.label || !form.period) return
    setSaving(true)
    try {
      const body = {
        label: form.label,
        period: form.period,
        serviceId: form.serviceId || null,
        category: form.category || null,
        targetAmount: form.targetAmount ? Number(form.targetAmount) : null,
        targetCount:  form.targetCount  ? Number(form.targetCount)  : null,
      }
      const obj = await api.objectives.create(body)
      setObjectives(prev => [obj, ...prev])
      setForm({ label: '', serviceId: '', category: '', targetAmount: '', targetCount: '', period: 'monthly' })
      setShowForm(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    await api.objectives.delete(id)
    setObjectives(prev => prev.filter(o => o.id !== id))
  }

  const filtered = tab === 'all' ? objectives
    : tab === 'bo' ? objectives.filter(o => o.source === 'bo')
    : objectives.filter(o => o.source === 'agent')

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700" />
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Mes Objectifs</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl text-white font-medium transition-colors"
          style={{ backgroundColor: '#f97316' }}
        >
          <Plus size={15} /> Nouvel objectif
        </button>
      </div>

      {/* Formulaire création */}
      {showForm && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-orange-200">
          <p className="font-semibold text-gray-800 mb-4">Définir un objectif personnel</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <input placeholder="Libellé *" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
            <select value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400">
              <option value="daily">Journalier</option>
              <option value="weekly">Hebdomadaire</option>
              <option value="monthly">Mensuel</option>
            </select>
            <select value={form.serviceId} onChange={e => setForm(f => ({ ...f, serviceId: e.target.value, category: '' }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400">
              <option value="">— Service spécifique (optionnel) —</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value, serviceId: '' }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400">
              <option value="">— Catégorie (optionnel) —</option>
              <option value="recurrent">Services Récurrents</option>
              <option value="financier">Services Financiers</option>
            </select>
            <input type="number" placeholder="Objectif montant MAD" value={form.targetAmount} onChange={e => setForm(f => ({ ...f, targetAmount: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
            <input type="number" placeholder="Objectif nombre transactions" value={form.targetCount} onChange={e => setForm(f => ({ ...f, targetCount: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleCreate} disabled={saving || !form.label}
              className="flex items-center gap-1 text-sm bg-orange-500 text-white px-4 py-2 rounded-xl hover:bg-orange-600 disabled:opacity-50">
              <Check size={14} /> Créer
            </button>
            <button onClick={() => setShowForm(false)} className="text-sm text-gray-500 hover:text-gray-700">Annuler</button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-0">
        {[['all', 'Tous'], ['bo', 'Définis par BO'], ['agent', 'Mes objectifs']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === key ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {label}
            <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
              {key === 'all' ? objectives.length : objectives.filter(o => o.source === key).length}
            </span>
          </button>
        ))}
      </div>

      {/* Cards objectifs */}
      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl p-10 text-center text-gray-400 shadow-sm border border-gray-100">
          <Target size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Aucun objectif. Créez-en un ou attendez que le BackOffice en configure.</p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(obj => {
          const pct = obj.pctAmount ?? obj.pctCount ?? 0
          const color = COLOR_BY_PCT(pct)
          const circumference = 2 * Math.PI * 28
          const dash = (pct / 100) * circumference

          return (
            <div key={obj.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">{obj.label}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${SOURCE_STYLE[obj.source]}`}>
                      {SOURCE_LABEL[obj.source]}
                    </span>
                    <span className="text-[10px] text-gray-400">{PERIOD_LABEL[obj.period]}</span>
                    {(obj.serviceId || obj.category) && (
                      <span className="text-[10px] text-gray-400">
                        · {obj.serviceId ? services.find(s => s.id === obj.serviceId)?.name || obj.serviceId : obj.category === 'recurrent' ? 'Récurrents' : 'Financiers'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="relative w-14 h-14 flex-shrink-0 ml-3">
                  <svg width="56" height="56" className="-rotate-90">
                    <circle cx="28" cy="28" r="28" fill="none" stroke="#f1f5f9" strokeWidth="6" />
                    <circle cx="28" cy="28" r="28" fill="none" stroke={color} strokeWidth="6"
                      strokeDasharray={`${dash} ${circumference}`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold" style={{ color }}>{pct}%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                {obj.targetAmount && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Montant</span>
                    <span className="font-semibold text-gray-800">
                      {(obj.currentAmount || 0).toLocaleString('fr-MA', { minimumFractionDigits: 0 })} / {obj.targetAmount.toLocaleString('fr-MA')} MAD
                    </span>
                  </div>
                )}
                {obj.targetCount && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Transactions</span>
                    <span className="font-semibold text-gray-800">{obj.currentCount || 0} / {obj.targetCount}</span>
                  </div>
                )}
              </div>

              {obj.source === 'agent' && (
                <button onClick={() => handleDelete(obj.id)} className="self-end text-xs text-red-400 hover:text-red-600 flex items-center gap-1">
                  <Trash2 size={12} /> Supprimer
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
