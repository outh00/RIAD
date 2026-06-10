const express = require('express')
const router = express.Router()
const { v4: uuidv4 } = require('uuid')
const db = require('../db')

// GET /services - liste tous les services
router.get('/', (req, res) => {
  const { active } = req.query
  let services = db.get('services')
  if (active === 'true') services = services.filter({ active: true })
  res.json(services.value())
})

// GET /services/:id
router.get('/:id', (req, res) => {
  const service = db.get('services').find({ id: req.params.id }).value()
  if (!service) return res.status(404).json({ error: 'Service introuvable' })
  res.json(service)
})

// POST /services - créer un service (backoffice)
router.post('/', (req, res) => {
  const { name, category, description, commissionRate, icon, badge, opportunityNote, ctaLabel, videoUrl } = req.body
  if (!name || !category || commissionRate === undefined) {
    return res.status(400).json({ error: 'name, category et commissionRate sont obligatoires' })
  }

  const serviceId = (() => {
    const base = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    return db.get('services').find({ id: base }).value() ? `${base}_${uuidv4().split('-')[0]}` : base
  })()

  // Auto-create academy module
  const moduleId = `module_${uuidv4().split('-')[0]}`
  const newModule = {
    id: moduleId,
    title: `Formation : ${name}`,
    serviceId,
    description: `Maîtrisez le service "${name}" pour le proposer à vos clients et augmenter vos commissions. Formation courte, validée par QCM.`,
    videoUrl: videoUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duration: 480,
    thumbnail: null,
    passingScore: 70,
    qcm: [
      {
        question: `Quel est l'avantage principal du service "${name}" pour votre activité ?`,
        options: [
          'Augmenter vos commissions uniquement',
          'Fidéliser vos clients uniquement',
          'Augmenter vos commissions ET fidéliser vos clients',
          'Aucun avantage particulier',
        ],
        correct: 2,
      },
      {
        question: `Avant de proposer "${name}" à un client, que devez-vous vérifier ?`,
        options: [
          'Que le client possède un smartphone',
          "Que le client dispose des pièces requises et comprend bien le service",
          "Rien, tous les clients peuvent utiliser n'importe quel service",
          'Que le client a déjà utilisé ce service ailleurs',
        ],
        correct: 1,
      },
      {
        question: `Quelle est la meilleure pratique lors d'une transaction "${name}" ?`,
        options: [
          'Traiter rapidement sans relire les informations',
          'Déléguer la saisie au client pour aller plus vite',
          "Vérifier l'identité du client et confirmer les détails avant de valider",
          'Ignorer les petites erreurs de saisie',
        ],
        correct: 2,
      },
    ],
  }
  db.get('academy').push(newModule).write()

  const badgeVal = badge || 'Courant'
  const service = {
    id: serviceId,
    name,
    category,
    description: description || '',
    commissionRate: Number(commissionRate),
    requiredModuleId: moduleId,
    icon: icon || 'star',
    active: true,
    popular: badgeVal === 'Populaire',
    badge: badgeVal,
    opportunityNote: opportunityNote || '',
    ctaLabel: ctaLabel || 'Utiliser'
  }

  db.get('services').push(service).write()
  res.status(201).json({ ...service, module: newModule })
})

// PUT /services/:id - mise à jour (backoffice)
router.put('/:id', (req, res) => {
  const service = db.get('services').find({ id: req.params.id }).value()
  if (!service) return res.status(404).json({ error: 'Service introuvable' })

  const forbidden = ['id']
  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => !forbidden.includes(k))
  )
  db.get('services').find({ id: req.params.id }).assign(updates).write()
  res.json(db.get('services').find({ id: req.params.id }).value())
})

// DELETE /services/:id (backoffice)
router.delete('/:id', (req, res) => {
  const service = db.get('services').find({ id: req.params.id }).value()
  if (!service) return res.status(404).json({ error: 'Service introuvable' })
  db.get('services').remove({ id: req.params.id }).write()
  res.json({ message: 'Service supprimé' })
})

// POST /services/:id/activate - activer un service pour un agent (gate: formation + QCM)
router.post('/:id/activate', (req, res) => {
  const { agentId } = req.body
  if (!agentId) return res.status(400).json({ error: 'agentId obligatoire' })

  const service = db.get('services').find({ id: req.params.id }).value()
  if (!service) return res.status(404).json({ error: 'Service introuvable' })
  if (!service.active) return res.status(400).json({ error: 'Service désactivé par l\'admin' })

  const agent = db.get('agents').find({ id: agentId }).value()
  if (!agent) return res.status(404).json({ error: 'Agent introuvable' })

  if (agent.unlockedServices.includes(service.id)) {
    return res.json({ message: 'Service déjà activé', alreadyUnlocked: true })
  }

  // Gate : vérification formation + QCM
  const progress = agent.academyProgress[service.requiredModuleId]
  const module = db.get('academy').find({ id: service.requiredModuleId }).value()

  if (!progress?.watched) {
    return res.status(403).json({
      error: 'Formation obligatoire',
      message: 'Vous devez regarder la vidéo de formation avant d\'activer ce service.',
      step: 'watch_video',
      moduleId: service.requiredModuleId,
      moduleTitle: module?.title
    })
  }

  if (!progress?.qcmPassed) {
    return res.status(403).json({
      error: 'QCM obligatoire',
      message: 'Vous devez réussir le QCM de validation avant d\'activer ce service.',
      step: 'pass_qcm',
      moduleId: service.requiredModuleId,
      moduleTitle: module?.title
    })
  }

  // Activation
  const updatedServices = [...agent.unlockedServices, service.id]
  db.get('agents').find({ id: agentId }).assign({ unlockedServices: updatedServices }).write()

  // Notification automatique
  db.get('notifications').push({
    id: `notif_${uuidv4().split('-')[0]}`,
    agentId,
    title: 'Service activé !',
    message: `Le service "${service.name}" est maintenant disponible dans votre espace.`,
    read: false,
    date: new Date().toISOString(),
    type: 'success'
  }).write()

  res.json({ message: `Service "${service.name}" activé avec succès`, service })
})

module.exports = router
