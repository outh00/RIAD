const express = require('express')
const router = express.Router()
const { v4: uuidv4 } = require('uuid')
const db = require('../db')

function periodFilter(txns, period) {
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const month = now.toISOString().substring(0, 7)
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  weekStart.setHours(0, 0, 0, 0)

  if (period === 'daily') return txns.filter(t => t.date.startsWith(today))
  if (period === 'weekly') return txns.filter(t => new Date(t.date) >= weekStart)
  return txns.filter(t => t.date.startsWith(month))
}

function enrichObjective(obj, transactions) {
  const services = db.get('services').value()
  let txns = periodFilter(transactions, obj.period)
  if (obj.serviceId) txns = txns.filter(t => t.serviceId === obj.serviceId)
  else if (obj.category) {
    const sids = services.filter(s => s.category === obj.category).map(s => s.id)
    txns = txns.filter(t => sids.includes(t.serviceId))
  }
  const currentAmount = parseFloat(txns.reduce((s, t) => s + t.amount, 0).toFixed(2))
  const currentCount = txns.length
  return {
    ...obj,
    currentAmount,
    currentCount,
    pctAmount: obj.targetAmount ? Math.min(100, Math.round(currentAmount / obj.targetAmount * 100)) : null,
    pctCount:  obj.targetCount  ? Math.min(100, Math.round(currentCount  / obj.targetCount  * 100)) : null,
  }
}

// GET /objectives/agent/:agentId
router.get('/agent/:agentId', (req, res) => {
  const agent = db.get('agents').find({ id: req.params.agentId }).value()
  if (!agent) return res.status(404).json({ error: 'Agent introuvable' })
  const txns = db.get('transactions').filter({ agentId: req.params.agentId }).value()
  const objectives = db.get('objectives').filter({ agentId: req.params.agentId }).value()
  res.json(objectives.map(o => enrichObjective(o, txns)))
})

// GET /objectives — backoffice: all agents
router.get('/', (req, res) => {
  const agents = db.get('agents').value()
  const allTxns = db.get('transactions').value()
  const allObjs = db.get('objectives').value()
  res.json(agents.map(agent => {
    const txns = allTxns.filter(t => t.agentId === agent.id)
    const objectives = allObjs.filter(o => o.agentId === agent.id)
    return {
      agentId: agent.id,
      agentName: agent.name,
      city: agent.city,
      objectives: objectives.map(o => enrichObjective(o, txns)),
    }
  }))
})

// POST /objectives/agent/:agentId — personal objective
router.post('/agent/:agentId', (req, res) => {
  const { label, serviceId, category, targetAmount, targetCount, period } = req.body
  if (!label || !period) return res.status(400).json({ error: 'label et period obligatoires' })
  const agent = db.get('agents').find({ id: req.params.agentId }).value()
  if (!agent) return res.status(404).json({ error: 'Agent introuvable' })
  const obj = {
    id: `obj_${uuidv4().split('-')[0]}`,
    agentId: req.params.agentId,
    serviceId: serviceId || null,
    category: category || null,
    label,
    targetAmount: targetAmount ? Number(targetAmount) : null,
    targetCount:  targetCount  ? Number(targetCount)  : null,
    period,
    source: 'agent',
    createdAt: new Date().toISOString(),
  }
  db.get('objectives').push(obj).write()
  res.status(201).json(obj)
})

// POST /objectives/bo — BO sets objective for one or all agents
router.post('/bo', (req, res) => {
  const { agentId, label, serviceId, category, targetAmount, targetCount, period } = req.body
  if (!label || !period) return res.status(400).json({ error: 'label et period obligatoires' })
  const agents = agentId
    ? [db.get('agents').find({ id: agentId }).value()].filter(Boolean)
    : db.get('agents').value()
  if (!agents.length) return res.status(404).json({ error: 'Aucun agent trouvé' })
  const created = []
  agents.forEach(agent => {
    if (serviceId) db.get('objectives').remove({ agentId: agent.id, serviceId, source: 'bo' }).write()
    else if (category) db.get('objectives').remove({ agentId: agent.id, category, source: 'bo' }).write()
    const obj = {
      id: `obj_${uuidv4().split('-')[0]}`,
      agentId: agent.id,
      serviceId: serviceId || null,
      category: category || null,
      label,
      targetAmount: targetAmount ? Number(targetAmount) : null,
      targetCount:  targetCount  ? Number(targetCount)  : null,
      period,
      source: 'bo',
      createdAt: new Date().toISOString(),
    }
    db.get('objectives').push(obj).write()
    created.push(obj)
  })
  res.status(201).json({ created: created.length, objectives: created })
})

// PUT /objectives/:id
router.put('/:id', (req, res) => {
  const obj = db.get('objectives').find({ id: req.params.id }).value()
  if (!obj) return res.status(404).json({ error: 'Objectif introuvable' })
  const forbidden = ['id', 'agentId', 'source', 'createdAt']
  const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => !forbidden.includes(k)))
  db.get('objectives').find({ id: req.params.id }).assign(updates).write()
  res.json(db.get('objectives').find({ id: req.params.id }).value())
})

// DELETE /objectives/:id
router.delete('/:id', (req, res) => {
  const obj = db.get('objectives').find({ id: req.params.id }).value()
  if (!obj) return res.status(404).json({ error: 'Objectif introuvable' })
  db.get('objectives').remove({ id: req.params.id }).write()
  res.json({ message: 'Objectif supprimé' })
})

module.exports = router
