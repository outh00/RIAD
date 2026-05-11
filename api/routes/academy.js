const express = require('express')
const router = express.Router()
const { v4: uuidv4 } = require('uuid')
const db = require('../db')

// GET /academy - liste tous les modules
router.get('/', (req, res) => {
  const modules = db.get('academy').value()
  res.json(modules.map(m => ({ ...m, qcm: undefined, questionCount: m.qcm.length })))
})

// GET /academy/modules/:moduleId - détail module (sans réponses correctes)
router.get('/modules/:moduleId', (req, res) => {
  const module = db.get('academy').find({ id: req.params.moduleId }).value()
  if (!module) return res.status(404).json({ error: 'Module introuvable' })

  // On masque les réponses correctes côté client
  const safeQcm = module.qcm.map(({ correct, ...q }) => q)
  res.json({ ...module, qcm: safeQcm })
})

// GET /academy/agent/:agentId - progression academy d'un agent
router.get('/agent/:agentId', (req, res) => {
  const agent = db.get('agents').find({ id: req.params.agentId }).value()
  if (!agent) return res.status(404).json({ error: 'Agent introuvable' })

  const modules = db.get('academy').value()

  const result = modules.map(module => {
    const progress = agent.academyProgress[module.id] || {
      watched: false,
      qcmPassed: false,
      score: null
    }
    const service = db.get('services').find({ requiredModuleId: module.id }).value()
    return {
      ...module,
      qcm: undefined,
      questionCount: module.qcm.length,
      progress,
      serviceId: service?.id,
      serviceName: service?.name,
      serviceUnlocked: agent.unlockedServices.includes(service?.id)
    }
  })

  res.json(result)
})

// POST /academy/modules/:moduleId/progress - marquer la vidéo comme vue
router.post('/modules/:moduleId/progress', (req, res) => {
  const { agentId } = req.body
  if (!agentId) return res.status(400).json({ error: 'agentId obligatoire' })

  const module = db.get('academy').find({ id: req.params.moduleId }).value()
  if (!module) return res.status(404).json({ error: 'Module introuvable' })

  const agent = db.get('agents').find({ id: agentId }).value()
  if (!agent) return res.status(404).json({ error: 'Agent introuvable' })

  const currentProgress = agent.academyProgress[req.params.moduleId] || {}
  const updated = {
    ...agent.academyProgress,
    [req.params.moduleId]: {
      ...currentProgress,
      watched: true,
      watchedAt: currentProgress.watchedAt || new Date().toISOString()
    }
  }

  db.get('agents').find({ id: agentId }).assign({ academyProgress: updated }).write()
  res.json({ message: 'Progression enregistrée', moduleId: req.params.moduleId })
})

// POST /academy/modules/:moduleId/qcm - soumettre le QCM
router.post('/modules/:moduleId/qcm', (req, res) => {
  const { agentId, answers } = req.body
  if (!agentId || !Array.isArray(answers)) {
    return res.status(400).json({ error: 'agentId et answers (tableau) obligatoires' })
  }

  const module = db.get('academy').find({ id: req.params.moduleId }).value()
  if (!module) return res.status(404).json({ error: 'Module introuvable' })

  const agent = db.get('agents').find({ id: agentId }).value()
  if (!agent) return res.status(404).json({ error: 'Agent introuvable' })

  // Vérifier que la vidéo a été vue avant le QCM
  const progress = agent.academyProgress[req.params.moduleId]
  if (!progress?.watched) {
    return res.status(403).json({
      error: 'Formation obligatoire',
      message: 'Vous devez regarder la vidéo de formation avant de passer le QCM.'
    })
  }

  // Calcul du score
  let correct = 0
  const details = module.qcm.map((q, i) => {
    const isCorrect = answers[i] === q.correct
    if (isCorrect) correct++
    return {
      question: q.question,
      yourAnswer: q.options[answers[i]] ?? 'Non répondu',
      correctAnswer: q.options[q.correct],
      isCorrect
    }
  })

  const score = Math.round((correct / module.qcm.length) * 100)
  const passed = score >= module.passingScore

  // Mise à jour progression
  const updatedProgress = {
    ...agent.academyProgress,
    [req.params.moduleId]: {
      ...progress,
      qcmPassed: passed || progress.qcmPassed,
      score: Math.max(score, progress.score || 0),
      passedAt: passed && !progress.qcmPassed ? new Date().toISOString() : progress.passedAt
    }
  }

  db.get('agents').find({ id: agentId }).assign({ academyProgress: updatedProgress }).write()

  // Auto-activation du service si QCM réussi
  let serviceActivated = null
  if (passed) {
    const service = db.get('services').find({ requiredModuleId: req.params.moduleId }).value()
    if (service && !agent.unlockedServices.includes(service.id)) {
      const updatedServices = [...agent.unlockedServices, service.id]
      db.get('agents').find({ id: agentId }).assign({ unlockedServices: updatedServices }).write()

      db.get('notifications').push({
        id: `notif_${uuidv4().split('-')[0]}`,
        agentId,
        title: 'Service activé automatiquement !',
        message: `Félicitations ! Le service "${service.name}" est maintenant disponible.`,
        read: false,
        date: new Date().toISOString(),
        type: 'success'
      }).write()

      serviceActivated = service.name
    }
  }

  res.json({
    score,
    passed,
    passingScore: module.passingScore,
    correctAnswers: correct,
    totalQuestions: module.qcm.length,
    details,
    serviceActivated,
    message: passed
      ? `Bravo ! Vous avez obtenu ${score}% et réussi le QCM.`
      : `Score insuffisant (${score}%). Il faut ${module.passingScore}% pour valider. Réessayez !`
  })
})

// POST /academy/modules - ajouter un module (backoffice)
router.post('/modules', (req, res) => {
  const { title, serviceId, description, videoUrl, duration, passingScore, qcm } = req.body
  if (!title || !serviceId || !qcm || !Array.isArray(qcm)) {
    return res.status(400).json({ error: 'title, serviceId et qcm[] sont obligatoires' })
  }

  const newModule = {
    id: `module_${uuidv4().split('-')[0]}`,
    title,
    serviceId,
    description: description || '',
    videoUrl: videoUrl || '',
    duration: duration || 0,
    thumbnail: null,
    passingScore: passingScore || 70,
    qcm
  }

  db.get('academy').push(newModule).write()

  // Lier le module au service
  const service = db.get('services').find({ id: serviceId }).value()
  if (service) {
    db.get('services').find({ id: serviceId }).assign({ requiredModuleId: newModule.id }).write()
  }

  res.status(201).json(newModule)
})

// PUT /academy/modules/:moduleId - modifier un module (backoffice)
router.put('/modules/:moduleId', (req, res) => {
  const module = db.get('academy').find({ id: req.params.moduleId }).value()
  if (!module) return res.status(404).json({ error: 'Module introuvable' })

  const forbidden = ['id']
  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => !forbidden.includes(k))
  )
  db.get('academy').find({ id: req.params.moduleId }).assign(updates).write()
  res.json(db.get('academy').find({ id: req.params.moduleId }).value())
})

module.exports = router
