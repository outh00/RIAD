const express = require('express')
const router = express.Router()
const db = require('../db')

// GET /agents - liste tous les agents (backoffice)
router.get('/', (req, res) => {
  const agents = db.get('agents').value()
  const services = db.get('services').value()

  const result = agents.map(agent => {
    const unlockedDetails = agent.unlockedServices.map(sId =>
      services.find(s => s.id === sId)
    ).filter(Boolean)
    return { ...agent, unlockedServicesDetails: unlockedDetails }
  })

  res.json(result)
})

// GET /agents/:id - profil complet d'un agent
router.get('/:id', (req, res) => {
  const agent = db.get('agents').find({ id: req.params.id }).value()
  if (!agent) return res.status(404).json({ error: 'Agent introuvable' })
  res.json(agent)
})

// PUT /agents/:id - mise à jour (backoffice)
router.put('/:id', (req, res) => {
  const agent = db.get('agents').find({ id: req.params.id }).value()
  if (!agent) return res.status(404).json({ error: 'Agent introuvable' })

  const forbidden = ['id', 'academyProgress', 'unlockedServices', 'balance']
  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => !forbidden.includes(k))
  )

  db.get('agents').find({ id: req.params.id }).assign(updates).write()
  res.json(db.get('agents').find({ id: req.params.id }).value())
})

// GET /agents/:id/services - services avec statut de déverrouillage
router.get('/:id/services', (req, res) => {
  const agent = db.get('agents').find({ id: req.params.id }).value()
  if (!agent) return res.status(404).json({ error: 'Agent introuvable' })

  const allServices = db.get('services').filter({ active: true }).value()

  const result = allServices.map(service => {
    const isUnlocked = agent.unlockedServices.includes(service.id)
    const moduleProgress = agent.academyProgress[service.requiredModuleId] || null
    const module = db.get('academy').find({ id: service.requiredModuleId }).value()

    return {
      ...service,
      isUnlocked,
      moduleProgress,
      moduleTitle: module ? module.title : null,
      canActivate: moduleProgress?.watched && moduleProgress?.qcmPassed
    }
  })

  res.json(result)
})

module.exports = router
