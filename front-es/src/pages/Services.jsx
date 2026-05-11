import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Phone, Droplets, Zap, Send, CreditCard, Lock, CheckCircle, ChevronRight } from 'lucide-react'
import { api } from '../api/client'
import PaymentModal from '../components/PaymentModal'

const serviceIcons = { phone: Phone, droplets: Droplets, zap: Zap, send: Send, 'credit-card': CreditCard }

const categoryLabels = {
  eau_electricite:    'Eau et Électricité',
  telephonie_internet:'Téléphonie et Internet',
  transport:          'Transport',
  transfert:          'Transfert',
  impot_taxe:         'Impôt et Taxe',
  recharge:           'Recharge',
  commande_cash:      'Commande Cash',
  souscription:       'Souscription',
  assurance:          'Assurance',
  paypro:             'PayPro',
  billetterie:        'Billetterie',
  gaming:             'Gaming',
  scolarite:          'Scolarité',
  hbab_chaabi:        'Hbab Chaabi',
  autres:             'Autres',
}

export default function Services() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [activating, setActivating] = useState(null)
  const [message, setMessage] = useState(null)
  const [payingConfig, setPayingConfig] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    api.agent.services().then(setServices).finally(() => setLoading(false))
  }, [])

  const handleActivate = async (service) => {
    if (service.isUnlocked) return

    if (!service.canActivate) {
      navigate(`/academy/${service.requiredModuleId}`)
      return
    }

    setActivating(service.id)
    try {
      await api.services.activate(service.id)
      setServices(prev => prev.map(s => s.id === service.id ? { ...s, isUnlocked: true } : s))
      setMessage({ type: 'success', text: `Service "${service.name}" activé !` })
    } catch (err) {
      if (err.step === 'watch_video' || err.step === 'pass_qcm') {
        navigate(`/academy/${service.requiredModuleId}`)
      } else {
        setMessage({ type: 'error', text: err.message || 'Erreur lors de l\'activation' })
      }
    } finally {
      setActivating(null)
      setTimeout(() => setMessage(null), 4000)
    }
  }

  const grouped = services.reduce((acc, s) => {
    if (!acc[s.category]) acc[s.category] = []
    acc[s.category].push(s)
    return acc
  }, {})

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700" />
    </div>
  )

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Mes Services</h1>

      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {payingConfig && (
        <PaymentModal
          service={payingConfig.service}
          initialSubService={payingConfig.initialSubService}
          onClose={() => setPayingConfig(null)}
          onSuccess={() => {}}
        />
      )}

      {Object.entries(grouped).map(([category, list]) => (
        <div key={category}>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {categoryLabels[category] || category}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map(service => {
              const Icon = serviceIcons[service.icon] || Phone
              return (
                <div
                  key={service.id}
                  className={`bg-white rounded-2xl p-5 shadow-sm border transition-all ${
                    service.isUnlocked ? 'border-blue-200 hover:border-blue-300' : 'border-gray-100 hover:border-blue-200'
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`p-2.5 rounded-xl ${service.isUnlocked ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                      <Icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm">{service.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-snug">{service.description}</p>
                    </div>
                    {service.isUnlocked && <CheckCircle size={18} className="text-blue-500 flex-shrink-0" />}
                    {!service.isUnlocked && <Lock size={16} className="text-gray-400 flex-shrink-0" />}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Commission: <span className="font-semibold text-gray-700">{(service.commissionRate * 100).toFixed(1)}%</span>
                    </span>
                    {!service.isUnlocked ? (
                      <button
                        onClick={() => handleActivate(service)}
                        disabled={activating === service.id}
                        className="flex items-center gap-1 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {activating === service.id ? 'Activation...' : 'Activer'}
                        <ChevronRight size={12} />
                      </button>
                    ) : (
                      <button
                        onClick={() => setPayingConfig({ service, initialSubService: null })}
                        className="flex items-center gap-1 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Payer <ChevronRight size={12} />
                      </button>
                    )}
                  </div>

                  {!service.isUnlocked && (
                    <div className="mt-3 pt-3 border-t border-gray-50">
                      <button
                        onClick={() => navigate(`/academy/${service.requiredModuleId}`)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        📚 Formation requise : {service.moduleTitle}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
