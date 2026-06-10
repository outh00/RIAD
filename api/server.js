const express = require('express')
const cors = require('cors')

const agentsRouter = require('./routes/agents')
const transactionsRouter = require('./routes/transactions')
const servicesRouter = require('./routes/services')
const academyRouter = require('./routes/academy')
const notificationsRouter = require('./routes/notifications')
const objectivesRouter = require('./routes/objectives')
const analyticsRouter = require('./routes/analytics')

const db = require('./db')
const { initRedis, persistToRedis } = require('./db')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: '*', methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'] }))
app.options('*', cors())
app.use(express.json())

// Persist DB to Redis after every mutation
app.use((req, res, next) => {
  if (['POST','PUT','PATCH','DELETE'].includes(req.method)) {
    const orig = res.json.bind(res)
    res.json = (data) => { persistToRedis(); return orig(data) }
  }
  next()
})

app.use('/api/agents', agentsRouter)
app.use('/api/transactions', transactionsRouter)
app.use('/api/services', servicesRouter)
app.use('/api/academy', academyRouter)
app.use('/api/notifications', notificationsRouter)
app.use('/api/objectives', objectivesRouter)
app.use('/api/analytics', analyticsRouter)

app.get('/api/config', (req, res) => {
  res.json(db.get('config').value())
})

// ── Auth (prototype : password générique) ────────────────────────────────────
app.get('/api/auth/agents', (req, res) => {
  const agents = db.get('agents').value().map(a => ({ id: a.id, name: a.name, city: a.city }))
  res.json(agents)
})

app.post('/api/auth/login', (req, res) => {
  const { agentId, password } = req.body
  if (password !== 'password123') return res.status(401).json({ error: 'Mot de passe incorrect' })
  const agent = db.get('agents').find({ id: agentId }).value()
  if (!agent) return res.status(404).json({ error: 'Agent introuvable' })
  res.json({ id: agent.id, name: agent.name, city: agent.city, avatar: agent.avatar })
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Erreur serveur interne' })
})

if (!process.env.VERCEL) {
  initRedis().then(() => {
    app.listen(PORT, () => console.log(`M2T API running on http://localhost:${PORT}`))
  })
}

module.exports = app
