const express = require('express')
const cors = require('cors')

const agentsRouter = require('./routes/agents')
const transactionsRouter = require('./routes/transactions')
const servicesRouter = require('./routes/services')
const academyRouter = require('./routes/academy')
const notificationsRouter = require('./routes/notifications')
const objectivesRouter = require('./routes/objectives')
const analyticsRouter = require('./routes/analytics')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: '*', methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'] }))
app.options('*', cors())
app.use(express.json())

app.use('/api/agents', agentsRouter)
app.use('/api/transactions', transactionsRouter)
app.use('/api/services', servicesRouter)
app.use('/api/academy', academyRouter)
app.use('/api/notifications', notificationsRouter)
app.use('/api/objectives', objectivesRouter)
app.use('/api/analytics', analyticsRouter)

app.get('/api/config', (req, res) => {
  const db = require('./db')
  res.json(db.get('config').value())
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Erreur serveur interne' })
})

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`M2T API running on http://localhost:${PORT}`)
  })
}

module.exports = app
