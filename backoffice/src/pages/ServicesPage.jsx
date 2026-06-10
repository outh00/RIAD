import { useState, useEffect } from 'react'
import { Pencil, Trash2, Plus, Check, X, Star, Flame, Minus } from 'lucide-react'
import { api } from '../api/client'

const BADGE_STYLE = {
  Populaire: 'bg-blue-100 text-blue-700',
  Promo:     'bg-orange-500 text-white',
  Courant:   'bg-gray-100 text-gray-500',
}

const BADGE_ICON = {
  Populaire: <Star size={11} className="inline mr-0.5" />,
  Promo:     <Flame size={11} className="inline mr-0.5" />,
  Courant:   <Minus size={11} className="inline mr-0.5" />,
}

const emptyCreate = { name: '', category: 'eau_electricite', commissionRate: 0.02, description: '', badge: 'Courant', opportunityNote: '', ctaLabel: 'Utiliser', videoUrl: '' }

const CAT_LABELS = {
  eau_electricite: 'Eau & Élec', telephonie_internet: 'Téléphonie', transport: 'Transport',
  transfert: 'Transfert', impot_taxe: 'Impôt & Taxe', recharge: 'Recharge',
  commande_cash: 'Cmd Cash', souscription: 'Souscription', assurance: 'Assurance',
  paypro: 'PayPro', billetterie: 'Billetterie', gaming: 'Gaming',
  scolarite: 'Scolarité', hbab_chaabi: 'Hbab Chaabi', autres: 'Autres',
}

export default function ServicesPage() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState(emptyCreate)

  useEffect(() => {
    api.services.list().then(setServices).finally(() => setLoading(false))
  }, [])

  const handleToggleActive = async (service) => {
    const updated = await api.services.update(service.id, { active: !service.active })
    setServices(prev => prev.map(s => s.id === service.id ? updated : s))
  }

  const handleSaveEdit = async (id) => {
    const updated = await api.services.update(id, {
      ...editForm,
      popular: editForm.badge === 'Populaire'
    })
    setServices(prev => prev.map(s => s.id === id ? updated : s))
    setEditingId(null)
  }

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce service ?')) return
    await api.services.delete(id)
    setServices(prev => prev.filter(s => s.id !== id))
  }

  const handleCreate = async () => {
    if (!createForm.name.trim()) return
    const s = await api.services.create(createForm)
    setServices(prev => [...prev, s])
    setShowCreate(false)
    setCreateForm(emptyCreate)
  }

  const startEdit = (s) => {
    setEditingId(s.id)
    setEditForm({
      name: s.name,
      commissionRate: s.commissionRate,
      active: s.active,
      badge: s.badge || 'Courant',
      opportunityNote: s.opportunityNote || '',
      ctaLabel: s.ctaLabel || 'Utiliser',
    })
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Catalogue Services</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 text-sm bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} /> Nouveau service
        </button>
      </div>

      {/* Création */}
      {showCreate && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-blue-200">
          <h2 className="font-semibold text-gray-800 mb-4">Nouveau service</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              placeholder="Nom du service *"
              value={createForm.name}
              onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />
            <select
              value={createForm.category}
              onChange={e => setCreateForm(f => ({ ...f, category: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            >
              <option value="eau_electricite">Eau et Électricité</option>
              <option value="telephonie_internet">Téléphonie et Internet</option>
              <option value="transport">Transport</option>
              <option value="transfert">Transfert</option>
              <option value="impot_taxe">Impôt et Taxe</option>
              <option value="recharge">Recharge</option>
              <option value="commande_cash">Commande Cash</option>
              <option value="souscription">Souscription</option>
              <option value="assurance">Assurance</option>
              <option value="paypro">PayPro</option>
              <option value="billetterie">Billetterie</option>
              <option value="gaming">Gaming</option>
              <option value="scolarite">Scolarité</option>
              <option value="hbab_chaabi">Hbab Chaabi</option>
              <option value="autres">Autres</option>
            </select>
            <input
              placeholder="Description"
              value={createForm.description}
              onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />
            <input
              type="number"
              placeholder="Taux commission (ex: 0.025)"
              step="0.005"
              value={createForm.commissionRate}
              onChange={e => setCreateForm(f => ({ ...f, commissionRate: parseFloat(e.target.value) }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />

            {/* Promotion */}
            <select
              value={createForm.badge}
              onChange={e => setCreateForm(f => ({ ...f, badge: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            >
              <option value="Courant">Badge : Courant</option>
              <option value="Populaire">Badge : Populaire ★</option>
              <option value="Promo">Badge : Promo 🔥</option>
            </select>
            <input
              placeholder="Note opportunité (ex: +8% ce mois)"
              value={createForm.opportunityNote}
              onChange={e => setCreateForm(f => ({ ...f, opportunityNote: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />
            <input
              placeholder="Label bouton CTA (ex: Recharger)"
              value={createForm.ctaLabel}
              onChange={e => setCreateForm(f => ({ ...f, ctaLabel: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />
            <input
              placeholder="URL vidéo RIAD Academy (YouTube embed, ex: https://www.youtube.com/embed/...)"
              value={createForm.videoUrl}
              onChange={e => setCreateForm(f => ({ ...f, videoUrl: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 sm:col-span-2"
            />
          </div>

          <p className="text-xs text-blue-600 mt-3 bg-blue-50 rounded-lg px-3 py-2">
            ✅ Un module RIAD Academy sera automatiquement créé avec cette vidéo et lié à ce service.
          </p>

          <div className="flex gap-3 mt-4">
            <button onClick={handleCreate} className="flex items-center gap-1 text-sm bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700">
              <Check size={14} /> Créer
            </button>
            <button onClick={() => setShowCreate(false)} className="text-sm text-gray-500 hover:text-gray-700">
              Annuler
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Service', 'Catégorie', 'Commission', 'Promotion', 'Statut', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {services.map(s => (
              <tr key={s.id} className="border-t border-gray-50 hover:bg-gray-50">
                {/* Nom */}
                <td className="px-4 py-3">
                  {editingId === s.id ? (
                    <input
                      value={editForm.name}
                      onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                      className="border border-gray-200 rounded-lg px-2 py-1 text-sm w-full"
                    />
                  ) : (
                    <div>
                      <p className="font-medium text-gray-800">{s.name}</p>
                      <p className="text-xs text-gray-400">{s.description}</p>
                    </div>
                  )}
                </td>

                {/* Catégorie */}
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    {CAT_LABELS[s.category] || s.category}
                  </span>
                </td>

                {/* Commission */}
                <td className="px-4 py-3">
                  {editingId === s.id ? (
                    <input
                      type="number"
                      step="0.005"
                      value={editForm.commissionRate}
                      onChange={e => setEditForm(f => ({ ...f, commissionRate: parseFloat(e.target.value) }))}
                      className="border border-gray-200 rounded-lg px-2 py-1 text-sm w-24"
                    />
                  ) : (
                    <span className="font-medium">{(s.commissionRate * 100).toFixed(1)}%</span>
                  )}
                </td>

                {/* Promotion / Badge */}
                <td className="px-4 py-3">
                  {editingId === s.id ? (
                    <div className="space-y-1">
                      <select
                        value={editForm.badge}
                        onChange={e => setEditForm(f => ({ ...f, badge: e.target.value }))}
                        className="border border-gray-200 rounded-lg px-2 py-1 text-xs w-full"
                      >
                        <option value="Courant">Courant</option>
                        <option value="Populaire">Populaire ★</option>
                        <option value="Promo">Promo 🔥</option>
                      </select>
                      <input
                        placeholder="Note opportunité"
                        value={editForm.opportunityNote}
                        onChange={e => setEditForm(f => ({ ...f, opportunityNote: e.target.value }))}
                        className="border border-gray-200 rounded-lg px-2 py-1 text-xs w-full"
                      />
                      <input
                        placeholder="Label CTA"
                        value={editForm.ctaLabel}
                        onChange={e => setEditForm(f => ({ ...f, ctaLabel: e.target.value }))}
                        className="border border-gray-200 rounded-lg px-2 py-1 text-xs w-full"
                      />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${BADGE_STYLE[s.badge] || BADGE_STYLE.Courant}`}>
                        {BADGE_ICON[s.badge] || BADGE_ICON.Courant}
                        {s.badge || 'Courant'}
                      </span>
                      {s.opportunityNote && (
                        <p className="text-xs text-gray-400">{s.opportunityNote}</p>
                      )}
                    </div>
                  )}
                </td>

                {/* Statut */}
                <td className="px-4 py-3">
                  <button onClick={() => handleToggleActive(s)}>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${s.active ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-600'}`}>
                      {s.active ? 'Actif' : 'Inactif'}
                    </span>
                  </button>
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {editingId === s.id ? (
                      <>
                        <button onClick={() => handleSaveEdit(s.id)} className="text-blue-600 hover:text-blue-800"><Check size={16} /></button>
                        <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(s)} className="text-blue-500 hover:text-blue-700">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => handleDelete(s.id)} className="text-red-400 hover:text-red-600">
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
