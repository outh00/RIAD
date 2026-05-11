const express = require('express')
const router = express.Router()
const db = require('../db')

// GET /analytics/crosssell/:agentId
router.get('/crosssell/:agentId', (req, res) => {
  const agent = db.get('agents').find({ id: req.params.agentId }).value()
  if (!agent) return res.status(404).json({ error: 'Agent introuvable' })

  const allAgents = db.get('agents').value()
  const cityAgents = allAgents.filter(a => a.city === agent.city)
  const cityAgentIds = new Set(cityAgents.map(a => a.id))

  const cutoff = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  const cityTxns = db.get('transactions')
    .filter(t => cityAgentIds.has(t.agentId) && t.date >= cutoff && t.status === 'completed')
    .value()

  const services = db.get('services').value()

  // Fréquence des services dans la zone
  const serviceCount = {}
  cityTxns.forEach(t => {
    serviceCount[t.serviceId] = (serviceCount[t.serviceId] || 0) + 1
  })

  // Co-occurrence client → services (même prénom+nom, même ville)
  const clientServices = {}
  cityTxns.forEach(t => {
    const key = t.client.trim().toLowerCase()
    if (!clientServices[key]) clientServices[key] = new Set()
    clientServices[key].add(t.serviceId)
  })

  // Compter les paires de services
  const pairCount = {}
  const pairFromA = {} // combien de clients ont fait A
  Object.values(clientServices).forEach(svcSet => {
    const arr = [...svcSet]
    arr.forEach(s => { pairFromA[s] = (pairFromA[s] || 0) + 1 })
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        const pair = [arr[i], arr[j]].sort().join('|')
        pairCount[pair] = (pairCount[pair] || 0) + 1
      }
    }
  })

  const crossSellPairs = Object.entries(pairCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([pair, count]) => {
      const [idA, idB] = pair.split('|')
      const svcA = services.find(s => s.id === idA)
      const svcB = services.find(s => s.id === idB)
      const clientsWithA = pairFromA[idA] || 1
      const convRate = Math.min(99, Math.round((count / clientsWithA) * 100))
      return {
        serviceA: { id: idA, name: svcA?.name || idA },
        serviceB: { id: idB, name: svcB?.name || idB },
        occurrences: count,
        conversionRate: convRate,
      }
    })

  const topServices = Object.entries(serviceCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id, count]) => ({ id, name: services.find(s => s.id === id)?.name || id, count }))

  res.json({
    city: agent.city,
    cityAgentsCount: cityAgents.length,
    totalCityTransactions: cityTxns.length,
    topServices,
    crossSellPairs,
  })
})

module.exports = router
