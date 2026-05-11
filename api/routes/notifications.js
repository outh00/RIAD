const express = require('express')
const router = express.Router()
const { v4: uuidv4 } = require('uuid')
const db = require('../db')

// GET /notifications/:agentId - notifications d'un agent
router.get('/:agentId', (req, res) => {
  const agent = db.get('agents').find({ id: req.params.agentId }).value()
  if (!agent) return res.status(404).json({ error: 'Agent introuvable' })

  const notifications = db.get('notifications')
    .filter({ agentId: req.params.agentId })
    .orderBy('date', 'desc')
    .value()

  const unreadCount = notifications.filter(n => !n.read).length
  res.json({ notifications, unreadCount })
})

// PATCH /notifications/:id/read - marquer comme lu
router.patch('/:id/read', (req, res) => {
  const notif = db.get('notifications').find({ id: req.params.id }).value()
  if (!notif) return res.status(404).json({ error: 'Notification introuvable' })

  db.get('notifications').find({ id: req.params.id }).assign({ read: true }).write()
  res.json({ message: 'Notification marquée comme lue' })
})

// PATCH /notifications/agent/:agentId/read-all - tout marquer comme lu
router.patch('/agent/:agentId/read-all', (req, res) => {
  db.get('notifications')
    .filter({ agentId: req.params.agentId })
    .each(n => { n.read = true })
    .write()
  res.json({ message: 'Toutes les notifications marquées comme lues' })
})

// POST /notifications - envoyer une notification (backoffice)
router.post('/', (req, res) => {
  const { agentId, title, message, type = 'info' } = req.body

  if (!title || !message) {
    return res.status(400).json({ error: 'title et message sont obligatoires' })
  }

  const validTypes = ['info', 'success', 'warning', 'error']
  const notifType = validTypes.includes(type) ? type : 'info'

  // Broadcast si pas d'agentId
  const agents = agentId
    ? [db.get('agents').find({ id: agentId }).value()].filter(Boolean)
    : db.get('agents').value()

  if (agentId && agents.length === 0) {
    return res.status(404).json({ error: 'Agent introuvable' })
  }

  const created = agents.map(agent => {
    const notif = {
      id: `notif_${uuidv4().split('-')[0]}`,
      agentId: agent.id,
      title,
      message,
      read: false,
      date: new Date().toISOString(),
      type: notifType
    }
    db.get('notifications').push(notif).write()
    return notif
  })

  res.status(201).json({
    message: `Notification envoyée à ${created.length} agent(s)`,
    notifications: created
  })
})

// DELETE /notifications/:id (backoffice)
router.delete('/:id', (req, res) => {
  const notif = db.get('notifications').find({ id: req.params.id }).value()
  if (!notif) return res.status(404).json({ error: 'Notification introuvable' })
  db.get('notifications').remove({ id: req.params.id }).write()
  res.json({ message: 'Notification supprimée' })
})

module.exports = router
