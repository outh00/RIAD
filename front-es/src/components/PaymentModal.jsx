import { useState } from 'react'
import {
  X, CheckCircle, Phone, Droplets, Zap, Send, CreditCard,
  AlertCircle, ChevronRight, UserPlus, PlusCircle, MinusCircle, ShieldCheck, Star,
} from 'lucide-react'
import { api, AGENT_ID } from '../api/client'

const SERVICE_META = {
  recharge:     { Icon: Phone,      bg: 'bg-purple-100', text: 'text-purple-600', color: '#9333ea' },
  facture_eau:  { Icon: Droplets,   bg: 'bg-blue-100',   text: 'text-blue-600',   color: '#2563eb' },
  facture_elec: { Icon: Zap,        bg: 'bg-yellow-100', text: 'text-yellow-600', color: '#d97706' },
  transfert:    { Icon: Send,       bg: 'bg-green-100',  text: 'text-green-600',  color: '#16a34a' },
  chaabi_pay:   { Icon: CreditCard, bg: 'bg-orange-100', text: 'text-orange-600', color: '#ea580c' },
}

// ─── Config sous-services ─────────────────────────────────────────────────────
const SUB_SERVICES = {
  facture_eau: {
    label: 'Choisir le facturier',
    items: [
      { id: 'srm_tta',  name: 'SRM TTA',               sub: 'ex-ONEE · Fès, Meknès, Taza, Al Hoceïma…',       color: '#2563eb' },
      { id: 'srm_rsk',  name: 'SRM RSK',               sub: 'ex-ONEE · Rabat, Salé, Kénitra, Skhirat…',       color: '#2563eb' },
      { id: 'srm_casa', name: 'SRM Casablanca-Settat', sub: 'ex-LYDEC · ex-RADEEJ · ex-RADEEC',               color: '#2563eb' },
    ],
  },
  facture_elec: {
    label: 'Choisir le facturier',
    items: [
      { id: 'srm_tta',  name: 'SRM TTA',               sub: 'ex-ONEE · Fès, Meknès, Taza, Al Hoceïma…',       color: '#d97706' },
      { id: 'srm_rsk',  name: 'SRM RSK',               sub: 'ex-ONEE · Rabat, Salé, Kénitra, Skhirat…',       color: '#d97706' },
      { id: 'srm_casa', name: 'SRM Casablanca-Settat', sub: 'ex-LYDEC · ex-RADEEJ · ex-RADEEC',               color: '#d97706' },
    ],
  },
  recharge: {
    label: 'Choisir l\'opérateur',
    items: [
      { id: 'iam',    name: 'Maroc Telecom', sub: 'IAM',   color: '#005ea6' },
      { id: 'orange', name: 'Orange Maroc',  sub: 'Orange',color: '#f97316' },
      { id: 'inwi',   name: 'Inwi',          sub: 'Inwi',  color: '#7c3aed' },
    ],
  },
  transfert: {
    label: 'Choisir le prestataire MTO',
    items: [
      { id: 'wu',       name: 'Western Union',      sub: 'Transfert international rapide',  color: '#f59e0b' },
      { id: 'mg',       name: 'MoneyGram',          sub: 'Envoi mondial en minutes',         color: '#dc2626' },
      { id: 'ria',      name: 'Ria Money Transfer', sub: 'Réseau mondial',                   color: '#0ea5e9' },
      { id: 'wafacash', name: 'Wafacash',           sub: 'Transfert national',               color: '#16a34a' },
    ],
  },
  chaabi_pay: {
    label: 'Choisir l\'opération',
    items: [
      { id: 'creation',     name: 'Création de compte',  sub: 'Ouvrir un compte Chaabi Pay', Icon: UserPlus,    color: '#ea580c' },
      { id: 'alimentation', name: 'Alimentation',        sub: 'Créditer un compte existant', Icon: PlusCircle,  color: '#ea580c' },
      { id: 'retrait',      name: 'Retrait',             sub: 'Retirer des fonds',            Icon: MinusCircle, color: '#ea580c' },
      { id: 'validation',   name: 'Validation KYC',      sub: 'Vérifier l\'identité client',  Icon: ShieldCheck, color: '#ea580c' },
    ],
  },
}

// ─── Champs extra par (serviceId_subId) ou serviceId ─────────────────────────
const EXTRA_FIELDS = {
  // Factures — N° abonné par SRM
  facture_eau_srm_tta:  [{ name: 'abonne', label: 'N° Abonné SRM TTA',               placeholder: 'Ex : 1234567890', type: 'text' }],
  facture_eau_srm_rsk:  [{ name: 'abonne', label: 'N° Abonné SRM RSK',               placeholder: 'Ex : 1234567890', type: 'text' }],
  facture_eau_srm_casa: [{ name: 'abonne', label: 'N° Abonné SRM Casa-Settat',        placeholder: 'Ex : 1234567890', type: 'text' }],
  facture_elec_srm_tta: [{ name: 'abonne', label: 'N° Abonné SRM TTA (Élec)',         placeholder: 'Ex : 9876543210', type: 'text' }],
  facture_elec_srm_rsk: [{ name: 'abonne', label: 'N° Abonné SRM RSK (Élec)',         placeholder: 'Ex : 9876543210', type: 'text' }],
  facture_elec_srm_casa:[{ name: 'abonne', label: 'N° Abonné SRM Casa-Settat (Élec)', placeholder: 'Ex : 9876543210', type: 'text' }],
  // Recharges — téléphone seulement (opérateur déjà choisi)
  recharge_iam:    [{ name: 'phone', label: 'Numéro Maroc Telecom', placeholder: '06 XX XX XX XX', type: 'tel' }],
  recharge_orange: [{ name: 'phone', label: 'Numéro Orange Maroc',  placeholder: '06 XX XX XX XX', type: 'tel' }],
  recharge_inwi:   [{ name: 'phone', label: 'Numéro Inwi',          placeholder: '07 XX XX XX XX', type: 'tel' }],
  // Transferts
  transfert_wu:       [{ name: 'beneficiaire', label: 'Bénéficiaire', placeholder: 'Prénom NOM', type: 'text' }, { name: 'cin', label: 'CIN expéditeur', placeholder: 'AB123456', type: 'text' }],
  transfert_mg:       [{ name: 'beneficiaire', label: 'Bénéficiaire', placeholder: 'Prénom NOM', type: 'text' }, { name: 'cin', label: 'CIN expéditeur', placeholder: 'AB123456', type: 'text' }],
  transfert_ria:      [{ name: 'beneficiaire', label: 'Bénéficiaire', placeholder: 'Prénom NOM', type: 'text' }, { name: 'cin', label: 'CIN expéditeur', placeholder: 'AB123456', type: 'text' }],
  transfert_wafacash: [{ name: 'beneficiaire', label: 'Bénéficiaire', placeholder: 'Prénom NOM', type: 'text' }, { name: 'cin', label: 'CIN expéditeur', placeholder: 'AB123456', type: 'text' }],
  // Chaabi Pay
  chaabi_pay_creation:     [{ name: 'cin', label: 'CIN client', placeholder: 'CD789012', type: 'text' }, { name: 'phone', label: 'Téléphone', placeholder: '06 XX XX XX XX', type: 'tel' }, { name: 'email', label: 'Email (optionnel)', placeholder: 'client@mail.com', type: 'email', optional: true }],
  chaabi_pay_alimentation: [{ name: 'phone', label: 'N° compte Chaabi Pay', placeholder: '06 XX XX XX XX', type: 'tel' }],
  chaabi_pay_retrait:      [{ name: 'phone', label: 'N° compte Chaabi Pay', placeholder: '06 XX XX XX XX', type: 'tel' }, { name: 'cin', label: 'CIN client', placeholder: 'CD789012', type: 'text' }],
  chaabi_pay_validation:   [{ name: 'cin', label: 'CIN client', placeholder: 'CD789012', type: 'text' }, { name: 'phone', label: 'Téléphone', placeholder: '06 XX XX XX XX', type: 'tel' }],
}

// Opérations Chaabi Pay qui ne nécessitent pas de montant
const NO_AMOUNT = new Set(['chaabi_pay_creation', 'chaabi_pay_validation'])

const FAVS_KEY = 'm2t_favorites'
const loadFavs = () => { try { return JSON.parse(localStorage.getItem(FAVS_KEY) || '[]') } catch { return [] } }

export default function PaymentModal({ service, onClose, onSuccess, initialSubService = null }) {
  const subConf = SUB_SERVICES[service.id] || null
  const [step, setStep] = useState(initialSubService ? 'form' : (subConf ? 'select' : 'form'))
  const [subService, setSubService] = useState(initialSubService)
  const [client, setClient] = useState('')
  const [amount, setAmount] = useState('')
  const [extras, setExtras] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [favorites, setFavorites] = useState(loadFavs)

  const isFav = (subId) => favorites.some(f => f.serviceId === service.id && f.subId === subId)
  const toggleFav = (e, item) => {
    e.stopPropagation()
    const next = isFav(item.id)
      ? favorites.filter(f => !(f.serviceId === service.id && f.subId === item.id))
      : [...favorites, { serviceId: service.id, subId: item.id, name: item.name, sub: item.sub || '', color: item.color, serviceName: service.name, commissionRate: service.commissionRate }]
    setFavorites(next)
    localStorage.setItem(FAVS_KEY, JSON.stringify(next))
  }

  const meta = SERVICE_META[service.id] || { Icon: CreditCard, bg: 'bg-gray-100', text: 'text-gray-600', color: '#6b7280' }
  const { Icon } = meta

  const extraKey = subService ? `${service.id}_${subService.id}` : service.id
  const extraFields = EXTRA_FIELDS[extraKey] || []
  const needsAmount = !NO_AMOUNT.has(extraKey)
  const numAmount = parseFloat(amount) || 0
  const commission = parseFloat((numAmount * service.commissionRate).toFixed(2))

  const canSubmit = client.trim() &&
    (needsAmount ? numAmount > 0 : true) &&
    extraFields.every(f => f.optional || (extras[f.name] || '').trim())

  const handleSelectSub = (item) => {
    setSubService(item)
    setExtras({})
    setStep('form')
  }

  const handleBack = () => {
    setSubService(null)
    setExtras({})
    setError(null)
    setStep('select')
  }

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const txn = await api.transactions.create({
        agentId: AGENT_ID,
        serviceId: service.id,
        client: client.trim(),
        amount: needsAmount ? numAmount : 0,
        meta: { subService: subService?.id, subServiceName: subService?.name, ...extras },
      })
      setResult(txn)
      setStep('success')
      window.dispatchEvent(new Event('payment-success'))
      if (onSuccess) onSuccess(txn)
    } catch (err) {
      setError(err.error || err.message || 'Une erreur est survenue.')
    } finally {
      setSubmitting(false)
    }
  }

  const headerLabel = subService ? `${service.name} — ${subService.name}` : service.name

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${meta.bg} ${meta.text} flex items-center justify-center flex-shrink-0`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm leading-tight">{headerLabel}</p>
              <p className="text-xs text-gray-400">Commission : {(service.commissionRate * 100).toFixed(1)}% du montant</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors flex-shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto">

          {/* ─── SUCCÈS ─────────────────────────────────────────────── */}
          {step === 'success' && result && (
            <div className="text-center py-4 space-y-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={44} className="text-green-500" />
              </div>
              <div>
                <p className="font-bold text-xl text-gray-900">Transaction validée !</p>
                <p className="text-sm text-gray-500 mt-1">Réf. : {result.id}</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4 text-left space-y-2 text-sm">
                <Row label="Client" value={result.client} />
                <Row label="Service" value={result.serviceName} />
                {subService && <Row label="Via" value={subService.name} />}
                {needsAmount && <Row label="Montant" value={`${result.amount.toLocaleString('fr-MA', { minimumFractionDigits: 2 })} MAD`} />}
                <div className="border-t border-gray-200 pt-2 mt-2 flex items-center justify-between">
                  <span className="font-semibold text-gray-700">Votre commission</span>
                  <span className="font-bold text-lg text-green-600">+{result.commission.toFixed(2)} MAD</span>
                </div>
              </div>
              <button onClick={onClose} className="w-full py-3 rounded-2xl text-white font-semibold transition-opacity hover:opacity-90" style={{ backgroundColor: meta.color }}>
                Nouvelle transaction
              </button>
            </div>
          )}

          {/* ─── SÉLECTION ──────────────────────────────────────────── */}
          {step === 'select' && subConf && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700 mb-4">{subConf.label}</p>
              {subConf.items.map(item => {
                const SubIcon = item.Icon || null
                const faved = isFav(item.id)
                return (
                  <div key={item.id} className="relative group">
                    <button
                      type="button"
                      onClick={() => handleSelectSub(item)}
                      className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
                    >
                      <div className="flex items-center gap-3">
                        {SubIcon ? (
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: item.color + '20', color: item.color }}>
                            <SubIcon size={18} />
                          </div>
                        ) : (
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                        )}
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{item.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => toggleFav(e, item)}
                      title={faved ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                      className="absolute right-10 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors hover:bg-yellow-50"
                    >
                      <Star size={15} className={faved ? 'text-yellow-400' : 'text-gray-300'} fill={faved ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* ─── FORMULAIRE ─────────────────────────────────────────── */}
          {step === 'form' && (
            <div className="space-y-4">
              {subConf && (
                <button type="button" onClick={handleBack} className="text-xs text-blue-600 hover:underline">
                  ← Retour
                </button>
              )}

              {extraFields.map(field => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {field.label}
                    {field.optional && <span className="text-gray-400 font-normal"> (optionnel)</span>}
                  </label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={extras[field.name] || ''}
                    onChange={e => setExtras(x => ({ ...x, [field.name]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                  />
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom du client</label>
                <input
                  type="text"
                  placeholder="Prénom NOM"
                  value={client}
                  onChange={e => setClient(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                />
              </div>

              {needsAmount && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Montant (MAD)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      placeholder="0,00"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-16 text-sm focus:outline-none focus:border-blue-400"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">MAD</span>
                  </div>
                </div>
              )}

              {needsAmount && numAmount > 0 && (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <span className="text-sm text-gray-600">Commission estimée</span>
                  <span className="font-bold text-green-600 text-base">+{commission.toFixed(2)} MAD</span>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                className="w-full py-3.5 rounded-2xl text-white font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-40"
                style={{ backgroundColor: canSubmit ? meta.color : '#9ca3af' }}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Traitement en cours...
                  </span>
                ) : needsAmount
                  ? `Valider — ${numAmount > 0 ? numAmount.toLocaleString('fr-MA', { minimumFractionDigits: 2 }) + ' MAD' : 'entrer un montant'}`
                  : "Valider l'opération"
                }
              </button>

              <p className="text-center text-xs text-gray-400">
                🔒 Transaction sécurisée et enregistrée en temps réel
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800">{value}</span>
    </div>
  )
}
