import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Phone, Droplets, Zap, Send, CreditCard,
  TrendingUp, Users, Play, BookOpen,
  MessageCircle, Mail, Clock,
} from 'lucide-react'
import { api } from '../api/client'
import DailyObjective from '../components/DailyObjective'
import PaymentModal from '../components/PaymentModal'

// ─── Icônes & couleurs par service ───────────────────────────────────────────
const SERVICE_META = {
  recharge:     { Icon: Phone,      bg: 'bg-purple-100', text: 'text-purple-600' },
  facture_eau:  { Icon: Droplets,   bg: 'bg-blue-100',   text: 'text-blue-600'  },
  facture_elec: { Icon: Zap,        bg: 'bg-yellow-100', text: 'text-yellow-600' },
  transfert:    { Icon: Send,       bg: 'bg-green-100',  text: 'text-green-600' },
  chaabi_pay:   { Icon: CreditCard, bg: 'bg-orange-100', text: 'text-orange-600' },
}

// ─── Badge styling ────────────────────────────────────────────────────────────
const BADGE = {
  Populaire: 'bg-blue-100 text-blue-700',
  Promo:     'bg-orange-500 text-white',
  Courant:   'bg-gray-100 text-gray-500',
}

// ─── Couleur bouton CTA ───────────────────────────────────────────────────────
const CTA_CLASS = {
  Promo:     'text-white font-semibold',
  Populaire: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 font-medium',
  Courant:   'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 font-medium',
}

const CTA_STYLE = {
  Promo: { backgroundColor: '#f97316' },
}

const today = new Date().toISOString().split('T')[0]

export default function Home() {
  const [agent, setAgent] = useState(null)
  const [agentServices, setAgentServices] = useState([])
  const [transactions, setTransactions] = useState([])
  const [academyModules, setAcademyModules] = useState([])
  const [crosssell, setCrosssell] = useState(null)
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [payingService, setPayingService] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      api.agent.get(),
      api.agent.services(),
      api.transactions.list(),
      api.academy.list(),
      api.analytics.crosssell().catch(() => null),
      api.config.get().catch(() => null),
    ]).then(([a, s, t, ac, cs, cfg]) => {
      setAgent(a)
      setAgentServices(s)
      setTransactions(t)
      setAcademyModules(ac)
      setCrosssell(cs)
      setConfig(cfg)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
    </div>
  )

  // ── Données dérivées ───────────────────────────────────────────────────────
  const todayTxns = transactions.filter(t => t.date.startsWith(today))
  const todayRevenue = todayTxns.reduce((s, t) => s + t.amount, 0)

  // 3 opportunités : services triés par popularité
  const opportunities = [...agentServices]
    .sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0))
    .slice(0, 3)

  // 2 modules academy non complétés
  const pendingModules = academyModules.filter(m => !m.progress?.qcmPassed).slice(0, 2)

  // Stats rapides
  const txnGrowth = agent?.weeklyGrowth || 0
  const clientGrowth = agent?.clientGrowth || 0

  const handlePaymentSuccess = (txn) => {
    setTransactions(prev => [txn, ...prev])
    setAgent(prev => prev ? { ...prev, balance: (prev.balance || 0) + txn.commission, totalTransactions: (prev.totalTransactions || 0) + 1 } : prev)
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {payingService && (
        <PaymentModal
          service={payingService}
          onClose={() => setPayingService(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* ─── COLONNE GAUCHE / CENTRE (2/3) ──────────────────────────────── */}
      <div className="xl:col-span-2 space-y-6">

        {/* OPPORTUNITÉS DU JOUR */}
        <section>
          <h2 className="font-bold text-gray-900 mb-4">
            Vos Opportunités du Jour{' '}
            <span className="text-sm font-normal text-gray-400">(Basé sur vos ventes)</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {opportunities.map(service => {
              const meta = SERVICE_META[service.id] || { Icon: CreditCard, bg: 'bg-gray-100', text: 'text-gray-600' }
              const { Icon } = meta
              const badge = service.badge || 'Courant'
              const cta = service.ctaLabel || 'Utiliser'

              return (
                <div key={service.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3">
                  {/* Icône + Badge */}
                  <div className="flex items-start justify-between">
                    <div className={`w-11 h-11 rounded-xl ${meta.bg} ${meta.text} flex items-center justify-center`}>
                      <Icon size={20} />
                    </div>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${BADGE[badge] || BADGE.Courant}`}>
                      {badge === 'Populaire' && '★ '}{badge}
                      {badge === 'Promo' && ' 🔥'}
                    </span>
                  </div>

                  {/* Nom + Note */}
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{service.name}</p>
                    {service.opportunityNote && (
                      <p className={`text-xs mt-0.5 font-medium ${badge === 'Populaire' ? 'text-green-600' : 'text-gray-500'}`}>
                        {badge === 'Populaire' && '↗ '}{service.opportunityNote}
                      </p>
                    )}
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => service.isUnlocked ? setPayingService(service) : navigate(`/academy/${service.requiredModuleId}`)}
                    className={`w-full py-2 rounded-xl text-sm transition-colors ${CTA_CLASS[badge] || CTA_CLASS.Courant}`}
                    style={CTA_STYLE[badge] || {}}
                  >
                    {service.isUnlocked ? cta : '🔒 Activer'}
                  </button>
                </div>
              )
            })}
          </div>
        </section>

        {/* RIAD ACADEMY */}
        {pendingModules.length > 0 && (
          <section>
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen size={18} className="text-orange-500" />
              RIAD Academy{' '}
              <span className="text-sm font-normal text-gray-400">(Micro-Formations)</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {pendingModules.map((module, idx) => {
                const thumbColors = ['bg-orange-500', 'bg-blue-600', 'bg-green-600', 'bg-purple-600']
                const color = thumbColors[idx % thumbColors.length]
                const pct = module.progress?.watched ? 40 : 0

                return (
                  <div
                    key={module.id}
                    onClick={() => navigate(`/academy/${module.id}`)}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow flex gap-4 p-4"
                  >
                    {/* Thumbnail */}
                    <div className={`w-20 h-16 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <Play size={24} className="text-white fill-white" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm truncate">{module.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {module.description?.substring(0, 40)}... • {Math.floor(module.duration / 60)}m{module.duration % 60 > 0 ? `${module.duration % 60}s` : ''}
                      </p>
                      {/* Progress bar */}
                      <div className="mt-2 h-1.5 bg-gray-100 rounded-full">
                        <div
                          className={`h-full ${color} rounded-full transition-all`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <button
                      className="self-center text-xs font-semibold text-blue-600 hover:text-blue-800 whitespace-nowrap"
                      onClick={e => { e.stopPropagation(); navigate(`/academy/${module.id}`) }}
                    >
                      Voir
                    </button>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* DERNIÈRES TRANSACTIONS */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Dernières Transactions</h2>
            <button onClick={() => navigate('/transactions')} className="text-xs text-blue-600 hover:underline">
              Voir tout
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Service', 'Client', 'Montant', 'Commission', 'Statut'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 && (
                  <tr><td colSpan={5} className="text-center text-gray-400 py-8">Aucune transaction</td></tr>
                )}
                {transactions.slice(0, 6).map(t => {
                  const meta = SERVICE_META[t.serviceId] || { Icon: CreditCard, bg: 'bg-gray-100', text: 'text-gray-600' }
                  const { Icon } = meta
                  return (
                    <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl ${meta.bg} ${meta.text} flex items-center justify-center flex-shrink-0`}>
                            <Icon size={14} />
                          </div>
                          <span className="font-medium text-gray-800 text-xs leading-tight">{t.serviceName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{t.client}</td>
                      <td className="px-4 py-3 font-semibold text-gray-800 text-xs">
                        {t.amount.toLocaleString('fr-MA', { minimumFractionDigits: 2 })} MAD
                      </td>
                      <td className="px-4 py-3 text-xs font-bold text-green-600">
                        +{t.commission.toLocaleString('fr-MA', { minimumFractionDigits: 2 })} MAD
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          t.status === 'completed' ? 'bg-green-100 text-green-700' :
                          t.status === 'pending'   ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-600'
                        }`}>
                          {t.status === 'completed' ? 'Validée' : t.status === 'pending' ? 'En cours' : 'Échouée'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* ─── COLONNE DROITE (1/3) ─────────────────────────────────────────── */}
      <div className="space-y-4">

        {/* Objectif Journalier */}
        <DailyObjective
          revenueToday={todayRevenue}
          objectiveMAD={agent?.dailyObjectiveMAD || 1000}
        />

        {/* Stats rapides */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
            <p className="text-2xl font-bold text-gray-900">{agent?.totalTransactions}</p>
            <p className="text-xs text-gray-400 mt-0.5">Transactions</p>
            {txnGrowth !== 0 && (
              <p className={`text-xs font-semibold mt-1 flex items-center justify-center gap-0.5 ${txnGrowth > 0 ? 'text-green-500' : 'text-red-500'}`}>
                <TrendingUp size={11} />
                {txnGrowth > 0 ? '+' : ''}{txnGrowth}%
              </p>
            )}
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
            <p className="text-2xl font-bold text-gray-900">{agent?.totalClients}</p>
            <p className="text-xs text-gray-400 mt-0.5">Clients servis</p>
            {clientGrowth !== 0 && (
              <p className={`text-xs font-semibold mt-1 flex items-center justify-center gap-0.5 ${clientGrowth > 0 ? 'text-green-500' : 'text-red-500'}`}>
                <Users size={11} />
                {clientGrowth > 0 ? '+' : ''}{clientGrowth}%
              </p>
            )}
          </div>
        </div>

        {/* Astuce Cross-selling dynamique */}
        <CrossSellWidget
          crosssell={crosssell}
          city={agent?.city}
          agentServices={agentServices}
          onPay={setPayingService}
          onNavigate={navigate}
          onAcademy={() => navigate('/academy')}
        />

        {/* Support */}
        <SupportWidget config={config} />

      </div>
    </div>
  )
}

// ─── Support widget ───────────────────────────────────────────────────────────
function SupportWidget({ config }) {
  const phone = config?.supportPhone || '+212520000000'
  const whatsapp = config?.supportWhatsApp || '+212600000000'
  const email = config?.supportEmail || 'support@m2t.ma'
  const hours = config?.supportHours || 'Lun–Sam · 8h–20h'
  const wa = whatsapp.replace(/\D/g, '')

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
          <MessageCircle size={16} className="text-blue-600" />
        </div>
        <p className="font-bold text-gray-900 text-sm">Support M2T</p>
      </div>

      <div className="space-y-2.5">
        <a
          href={`tel:${phone}`}
          className="flex items-center gap-3 text-sm text-gray-700 hover:text-blue-600 transition-colors"
        >
          <Phone size={15} className="text-gray-400 flex-shrink-0" />
          <span>{phone}</span>
        </a>
        <a
          href={`https://wa.me/${wa}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 text-sm text-gray-700 hover:text-green-600 transition-colors"
        >
          <MessageCircle size={15} className="text-gray-400 flex-shrink-0" />
          <span>WhatsApp · {whatsapp}</span>
        </a>
        <a
          href={`mailto:${email}`}
          className="flex items-center gap-3 text-sm text-gray-700 hover:text-blue-600 transition-colors"
        >
          <Mail size={15} className="text-gray-400 flex-shrink-0" />
          <span>{email}</span>
        </a>
        <div className="flex items-center gap-3 text-xs text-gray-400 pt-1 border-t border-gray-50">
          <Clock size={13} className="flex-shrink-0" />
          <span>{hours}</span>
        </div>
      </div>
    </div>
  )
}

// ─── SERVICE_LABEL fallback ────────────────────────────────────────────────────
const SVC_LABEL = {
  recharge:     'Recharge mobile',
  facture_eau:  'Facture eau',
  facture_elec: 'Facture électricité',
  transfert:    'Transfert d\'argent',
  chaabi_pay:   'Chaabi Pay',
}

function CrossSellWidget({ crosssell, city, agentServices = [], onPay, onNavigate, onAcademy }) {
  const findSvc = (id) => agentServices.find(s => s.id === id) || null

  const handleClick = (serviceId) => {
    const svc = findSvc(serviceId)
    if (!svc) return onNavigate('/services')
    if (svc.isUnlocked) onPay(svc)
    else onNavigate(`/academy/${svc.requiredModuleId}`)
  }

  // Pas de données — widget générique
  if (!crosssell || crosssell.totalCityTransactions === 0) {
    return (
      <div className="rounded-2xl p-5 text-white" style={{ backgroundColor: '#1e2d6b' }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">💡</span>
          <p className="font-bold text-base">Astuce Cross-selling</p>
        </div>
        <p className="text-sm text-blue-200 leading-relaxed mb-4">
          Après une facture, proposez toujours une recharge téléphonique associée pour augmenter votre panier moyen.
        </p>
        <button onClick={onAcademy} className="w-full py-2.5 rounded-xl border border-white/30 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
          📖 Voir le guide de vente
        </button>
      </div>
    )
  }

  const top = crosssell.crossSellPairs?.[0]
  const topSvc = crosssell.topServices?.[0]

  const SvcChip = ({ serviceId, name, className }) => {
    const svc = findSvc(serviceId)
    const label = name || SVC_LABEL[serviceId] || serviceId
    const isUnlocked = svc?.isUnlocked
    return (
      <button
        type="button"
        onClick={() => handleClick(serviceId)}
        title={isUnlocked ? `Ouvrir ${label}` : 'Activer ce service'}
        className={`${className} cursor-pointer hover:brightness-110 active:scale-95 transition-all flex items-center gap-1`}
      >
        {label}
        {isUnlocked
          ? <span className="opacity-70 text-[10px]">→</span>
          : <span className="opacity-60 text-[10px]">🔒</span>
        }
      </button>
    )
  }

  return (
    <div className="rounded-2xl p-5 text-white" style={{ backgroundColor: '#1e2d6b' }}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">💡</span>
        <p className="font-bold text-base">Cross-selling · {city}</p>
      </div>
      <p className="text-[11px] text-blue-400 mb-3">
        Basé sur {crosssell.totalCityTransactions} transactions ({crosssell.cityAgentsCount} ES dans votre zone)
      </p>

      {/* Service le plus populaire dans la zone */}
      {topSvc && (
        <div className="bg-white/10 rounded-xl px-3 py-2.5 mb-3">
          <p className="text-[11px] text-blue-300 mb-0.5">Service N°1 dans votre zone</p>
          <div className="flex items-center justify-between">
            <p className="font-semibold text-sm text-white">
              {topSvc.name} <span className="text-blue-300 font-normal">· {topSvc.count} transactions</span>
            </p>
            <button
              type="button"
              onClick={() => handleClick(topSvc.id)}
              className="text-[11px] font-bold text-orange-300 hover:text-orange-200 transition-colors whitespace-nowrap ml-2"
            >
              {findSvc(topSvc.id)?.isUnlocked ? 'Utiliser →' : '🔒 Activer'}
            </button>
          </div>
        </div>
      )}

      {/* Meilleure paire cross-sell */}
      {top ? (
        <div className="space-y-2 mb-3">
          <p className="text-[11px] text-blue-300">Meilleure opportunité de vente croisée :</p>
          <div className="flex items-center gap-2 flex-wrap">
            <SvcChip
              serviceId={top.serviceA.id}
              name={top.serviceA.name}
              className="bg-white/15 rounded-lg px-2.5 py-1 text-xs font-semibold text-white"
            />
            <span className="text-blue-400 text-sm">+</span>
            <SvcChip
              serviceId={top.serviceB.id}
              name={top.serviceB.name}
              className="bg-orange-500/80 rounded-lg px-2.5 py-1 text-xs font-semibold text-white"
            />
          </div>
          <div className="flex items-center gap-1.5 bg-green-500/20 rounded-xl px-3 py-1.5">
            <span className="text-green-400 font-bold text-sm">↗ +{top.conversionRate}% de conversion</span>
            <span className="text-green-300/70 text-[11px]">dans votre zone</span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-blue-200 mb-3">
          Pas encore assez de données croisées dans votre zone. Continuez vos transactions !
        </p>
      )}

      {/* Autres paires */}
      {crosssell.crossSellPairs?.slice(1, 3).map((pair, i) => (
        <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-1.5 mb-1.5">
          <div className="flex items-center gap-1 text-[11px] text-blue-200">
            <button type="button" onClick={() => handleClick(pair.serviceA.id)} className="hover:text-white transition-colors">
              {pair.serviceA.name || SVC_LABEL[pair.serviceA.id]}
            </button>
            <span className="opacity-50">→</span>
            <button type="button" onClick={() => handleClick(pair.serviceB.id)} className="hover:text-white transition-colors">
              {pair.serviceB.name || SVC_LABEL[pair.serviceB.id]}
            </button>
          </div>
          <span className="text-[11px] font-bold text-green-400">+{pair.conversionRate}%</span>
        </div>
      ))}

      <button onClick={onAcademy} className="w-full mt-3 py-2.5 rounded-xl border border-white/30 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
        📖 Voir le guide de vente
      </button>
    </div>
  )
}
