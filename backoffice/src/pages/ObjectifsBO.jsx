import { useState, useEffect } from 'react'
import { Plus, Trash2, Check, ChevronDown, ChevronUp, Target } from 'lucide-react'
import { api } from '../api/client'

const PERIOD_LABEL = { daily: 'Journalier', weekly: 'Hebdo', monthly: 'Mensuel' }
const PCT_COLOR = (p) => p >= 100 ? 'bg-blue-500' : p >= 60 ? 'bg-orange-400' : 'bg-red-400'

export default function ObjectifsBO() {
  const [data, setData] = useState([])        // [{ agentId, agentName, objectives }]
  const [agents, setAgents] = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({})
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    agentId: '', label: '', serviceId: '', category: '',
    targetAmount: '', targetCount: '', period: 'monthly',
  })

  useEffect(() => {
    Promise.all([api.objectives.all(), api.agents.list(), api.services.list()])
      .then(([objs, ags, svcs]) => { setData(objs); setAgents(ags); setServices(svcs) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleCreate = async () => {
    if (!form.label || !form.period) return
    setSaving(true)
    try {
      await api.objectives.createBO({
        agentId: form.agentId || null,
        label: form.label,
        serviceId: form.serviceId || null,
        category: form.category || null,
        targetAmount: form.targetAmount ? Number(form.targetAmount) : null,
        targetCount:  form.targetCount  ? Number(form.targetCount)  : null,
        period: form.period,
      })
      const updated = await api.objectives.all()
      setData(updated)
      setForm({ agentId: '', label: '', serviceId: '', category: '', targetAmount: '', targetCount: '', period: 'monthly' })
      setShowForm(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    await api.objectives.delete(id)
    setData(prev => prev.map(d => ({ ...d, objectives: d.objectives.filter(o => o.id !== id) })))
  }

  const toggle = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }))

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Objectifs ES</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 text-sm bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700">
          <Plus size={15} /> Définir un objectif
        </button>
      </div>

      {/* Formulaire BO */}
      {showForm && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-blue-200">
          <p className="font-semibold text-gray-800 mb-4">Nouvel objectif BO</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <select value={form.agentId} onChange={e => setForm(f => ({ ...f, agentId: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
              <option value="">Tous les agents ES</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.name} ({a.city})</option>)}
            </select>
            <input placeholder="Libellé objectif *" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
            <select value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
              <option value="daily">Journalier</option>
              <option value="weekly">Hebdomadaire</option>
              <option value="monthly">Mensuel</option>
            </select>
            <select value={form.serviceId} onChange={e => setForm(f => ({ ...f, serviceId: e.target.value, category: '' }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
              <option value="">— Service spécifique (optionnel) —</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value, serviceId: '' }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
              <option value="">— Catégorie (optionnel) —</option>
              <option value="recurrent">Services Récurrents</option>
              <option value="financier">Services Financiers</option>
            </select>
            <input type="number" placeholder="Objectif montant MAD" value={form.targetAmount} onChange={e => setForm(f => ({ ...f, targetAmount: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
            <input type="number" placeholder="Objectif nombre transactions" value={form.targetCount} onChange={e => setForm(f => ({ ...f, targetCount: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
          </div>
          <p className="text-xs text-blue-600 mt-3 bg-blue-50 rounded-lg px-3 py-2">
            Si aucun agent sélectionné, l'objectif sera appliqué à <strong>tous les ES</strong>.
          </p>
          <div className="flex gap-3 mt-4">
            <button onClick={handleCreate} disabled={saving || !form.label}
              className="flex items-center gap-1 text-sm bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 disabled:opacity-50">
              <Check size={14} /> Créer
            </button>
            <button onClick={() => setShowForm(false)} className="text-sm text-gray-500 hover:text-gray-700">Annuler</button>
          </div>
        </div>
      )}

      {/* Liste par agent */}
      <div className="space-y-3">
        {data.map(({ agentId, agentName, city, objectives }) => {
          const boObjs = objectives.filter(o => o.source === 'bo')
          const agentObjs = objectives.filter(o => o.source === 'agent')
          const avgPct = objectives.length
            ? Math.round(objectives.reduce((s, o) => s + (o.pct ?? o.pctAmount ?? 0), 0) / objectives.length)
            : 0

          return (
            <div key={agentId} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <button
                onClick={() => toggle(agentId)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                    {agentName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-800 text-sm">{agentName}</p>
                    <p className="text-xs text-gray-400">{city} · {objectives.length} objectif{objectives.length > 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-800">{avgPct}%</p>
                    <p className="text-xs text-gray-400">progression moy.</p>
                  </div>
                  <div className="w-20 h-2 bg-gray-100 rounded-full">
                    <div className={`h-full ${PCT_COLOR(avgPct)} rounded-full`} style={{ width: `${avgPct}%` }} />
                  </div>
                  {expanded[agentId] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </div>
              </button>

              {expanded[agentId] && (
                <div className="border-t border-gray-100 px-5 py-4 space-y-4">
                  {objectives.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-2">Aucun objectif configuré</p>
                  )}

                  {boObjs.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2">Objectifs BO</p>
                      <div className="space-y-2">
                        {boObjs.map(obj => <ObjRow key={obj.id} obj={obj} services={services} onDelete={handleDelete} />)}
                      </div>
                    </div>
                  )}
                  {agentObjs.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-orange-500 uppercase tracking-wide mb-2">Objectifs personnels</p>
                      <div className="space-y-2">
                        {agentObjs.map(obj => <ObjRow key={obj.id} obj={obj} services={services} onDelete={null} />)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ObjRow({ obj, services, onDelete }) {
  const pct = obj.pct ?? obj.pctAmount ?? obj.pctCount ?? 0
  return (
    <div className="flex items-center gap-3 py-2 px-3 bg-gray-50 rounded-xl">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-medium text-gray-800 truncate">{obj.label}</p>
          <span className="text-[10px] text-gray-400 whitespace-nowrap">{PERIOD_LABEL[obj.period]}</span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full">
          <div className={`h-full ${PCT_COLOR(pct)} rounded-full transition-all`} style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between mt-0.5">
          <span className="text-[11px] text-gray-400">
            {obj.targetAmount ? `${(obj.currentAmount||0).toLocaleString('fr-MA')} / ${obj.targetAmount.toLocaleString('fr-MA')} MAD` : ''}
            {obj.targetCount ? ` ${obj.currentCount||0}/${obj.targetCount} txn` : ''}
          </span>
          <span className={`text-[11px] font-bold ${pct >= 100 ? 'text-blue-600' : pct >= 60 ? 'text-orange-500' : 'text-red-500'}`}>{pct}%</span>
        </div>
      </div>
      {onDelete && (
        <button onClick={() => onDelete(obj.id)} className="text-red-400 hover:text-red-600 flex-shrink-0">
          <Trash2 size={13} />
        </button>
      )}
    </div>
  )
}
