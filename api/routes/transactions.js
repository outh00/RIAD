const express = require('express')
const router = express.Router()
const { v4: uuidv4 } = require('uuid')
const db = require('../db')

// GET /transactions - toutes les transactions (backoffice), filtrable par agentId
router.get('/', (req, res) => {
  const { agentId, limit = 50, offset = 0 } = req.query
  let query = db.get('transactions')

  if (agentId) query = query.filter({ agentId })

  const total = query.value().length
  const data = query
    .orderBy('date', 'desc')
    .slice(Number(offset), Number(offset) + Number(limit))
    .value()

  res.json({ total, data })
})

// GET /transactions/agent/:agentId - transactions d'un agent spécifique
router.get('/agent/:agentId', (req, res) => {
  const agent = db.get('agents').find({ id: req.params.agentId }).value()
  if (!agent) return res.status(404).json({ error: 'Agent introuvable' })

  const transactions = db.get('transactions')
    .filter({ agentId: req.params.agentId })
    .orderBy('date', 'desc')
    .value()

  res.json(transactions)
})

// POST /transactions - créer une nouvelle transaction
router.post('/', (req, res) => {
  const { agentId, serviceId, client, amount, meta } = req.body

  if (!agentId || !serviceId || !client) {
    return res.status(400).json({ error: 'Champs obligatoires : agentId, serviceId, client' })
  }

  const agent = db.get('agents').find({ id: agentId }).value()
  if (!agent) return res.status(404).json({ error: 'Agent introuvable' })

  const service = db.get('services').find({ id: serviceId }).value()
  if (!service) return res.status(404).json({ error: 'Service introuvable' })

  if (!service.active) return res.status(400).json({ error: 'Service désactivé' })

  // Vérification que le service est déverrouillé pour cet agent
  if (!agent.unlockedServices.includes(serviceId)) {
    const moduleProgress = agent.academyProgress[service.requiredModuleId]
    return res.status(403).json({
      error: 'Service non activé',
      message: 'Vous devez compléter la formation et réussir le QCM pour activer ce service.',
      requiredModuleId: service.requiredModuleId,
      moduleWatched: moduleProgress?.watched || false,
      qcmPassed: moduleProgress?.qcmPassed || false
    })
  }

  const numAmount = Number(amount) || 0
  const commission = parseFloat((numAmount * service.commissionRate).toFixed(2))

  const transaction = {
    id: `txn_${uuidv4().split('-')[0]}`,
    agentId,
    serviceId,
    serviceName: service.name,
    client,
    amount: numAmount,
    commission,
    date: new Date().toISOString(),
    status: 'completed',
    ...(meta && { meta })
  }

  // Sauvegarde transaction
  db.get('transactions').push(transaction).write()

  // Mise à jour solde et stats de l'agent
  db.get('agents').find({ id: agentId }).assign({
    balance: parseFloat((agent.balance + commission).toFixed(2)),
    dailyProgress: agent.dailyProgress + 1,
    totalTransactions: agent.totalTransactions + 1
  }).write()

  res.status(201).json(transaction)
})

// GET /transactions/stats - statistiques globales (backoffice)
router.get('/stats/global', (req, res) => {
  const transactions = db.get('transactions').value()
  const agents = db.get('agents').value()

  const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0)
  const totalCommissions = transactions.reduce((sum, t) => sum + t.commission, 0)
  const today = new Date().toISOString().split('T')[0]
  const todayTxns = transactions.filter(t => t.date.startsWith(today))

  res.json({
    totalTransactions: transactions.length,
    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
    totalCommissions: parseFloat(totalCommissions.toFixed(2)),
    todayTransactions: todayTxns.length,
    todayRevenue: parseFloat(todayTxns.reduce((s, t) => s + t.amount, 0).toFixed(2)),
    activeAgents: agents.length
  })
})

module.exports = router
