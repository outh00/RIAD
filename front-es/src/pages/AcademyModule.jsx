import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, XCircle, PlayCircle } from 'lucide-react'
import { api } from '../api/client'

export default function AcademyModule() {
  const { moduleId } = useParams()
  const navigate = useNavigate()
  const [module, setModule] = useState(null)
  const [progress, setProgress] = useState(null)
  const [videoWatched, setVideoWatched] = useState(false)
  const [showQcm, setShowQcm] = useState(false)
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.academy.module(moduleId),
      api.academy.list(),
    ]).then(([mod, all]) => {
      setModule(mod)
      const found = all.find(m => m.id === moduleId)
      if (found) {
        setProgress(found.progress)
        setVideoWatched(found.progress?.watched || false)
      }
    }).catch(console.error).finally(() => setLoading(false))
  }, [moduleId])

  const handleVideoEnd = async () => {
    if (!videoWatched) {
      await api.academy.markWatched(moduleId)
      setVideoWatched(true)
    }
  }

  const handleSubmitQcm = async () => {
    if (Object.keys(answers).length < module.qcm.length) {
      alert('Veuillez répondre à toutes les questions.')
      return
    }
    setSubmitting(true)
    try {
      const answersArr = module.qcm.map((_, i) => answers[i] ?? -1)
      const res = await api.academy.submitQcm(moduleId, answersArr)
      setResult(res)
    } catch (err) {
      alert(err.message || 'Erreur lors de la soumission')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700" />
    </div>
  )

  if (!module) return <p className="text-center text-gray-500 py-12">Module introuvable</p>

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => navigate('/academy')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} />
        Retour à la liste
      </button>

      <div>
        <h1 className="text-xl font-bold text-gray-900">{module.title}</h1>
        <p className="text-sm text-gray-500 mt-1">{module.description}</p>
      </div>

      {/* Étapes */}
      <div className="flex items-center gap-4 text-sm">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${videoWatched ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
          {videoWatched ? <CheckCircle size={14} /> : <PlayCircle size={14} />}
          1. Vidéo
        </div>
        <div className="h-px flex-1 bg-gray-200" />
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${progress?.qcmPassed ? 'bg-green-100 text-green-700' : videoWatched ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>
          {progress?.qcmPassed ? <CheckCircle size={14} /> : '2.'} QCM
        </div>
        <div className="h-px flex-1 bg-gray-200" />
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${progress?.qcmPassed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
          {progress?.qcmPassed ? <CheckCircle size={14} /> : '3.'} Service activé
        </div>
      </div>

      {/* Vidéo */}
      {!result?.passed && (
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
          <div className="aspect-video bg-gray-900 flex items-center justify-center">
            {module.videoUrl ? (
              <iframe
                src={module.videoUrl}
                className="w-full h-full"
                allow="autoplay; fullscreen"
                onEnded={handleVideoEnd}
                title={module.title}
              />
            ) : (
              <div className="text-center text-gray-400">
                <PlayCircle size={48} className="mx-auto mb-2" />
                <p className="text-sm">Vidéo non disponible</p>
              </div>
            )}
          </div>
          <div className="p-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Durée : {Math.floor(module.duration / 60)}min {module.duration % 60}s
            </p>
            {!videoWatched ? (
              <button
                onClick={handleVideoEnd}
                className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Marquer comme vue ✓
              </button>
            ) : (
              <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                <CheckCircle size={14} /> Vidéo vue
              </span>
            )}
          </div>
        </div>
      )}

      {/* QCM */}
      {videoWatched && !progress?.qcmPassed && !result && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">QCM de validation</h2>
            <span className="text-xs text-gray-500">{module.qcm.length} questions — Score minimum : {module.passingScore}%</span>
          </div>

          {!showQcm ? (
            <button
              onClick={() => setShowQcm(true)}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              Démarrer le QCM
            </button>
          ) : (
            <div className="space-y-6">
              {module.qcm.map((q, qi) => (
                <div key={q.id}>
                  <p className="text-sm font-medium text-gray-800 mb-3">
                    {qi + 1}. {q.question}
                  </p>
                  <div className="space-y-2">
                    {q.options.map((opt, oi) => (
                      <label
                        key={oi}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                          answers[qi] === oi
                            ? 'border-blue-400 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q${qi}`}
                          value={oi}
                          checked={answers[qi] === oi}
                          onChange={() => setAnswers(a => ({ ...a, [qi]: oi }))}
                          className="accent-blue-600"
                        />
                        <span className="text-sm text-gray-700">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              <button
                onClick={handleSubmitQcm}
                disabled={submitting || Object.keys(answers).length < module.qcm.length}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Correction en cours...' : 'Valider le QCM'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Résultat QCM */}
      {result && (
        <div className={`rounded-2xl p-5 border ${result.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-3 mb-4">
            {result.passed
              ? <CheckCircle size={28} className="text-green-600" />
              : <XCircle size={28} className="text-red-500" />
            }
            <div>
              <p className={`font-bold text-lg ${result.passed ? 'text-green-700' : 'text-red-600'}`}>
                Score : {result.score}%
              </p>
              <p className="text-sm text-gray-600">{result.message}</p>
            </div>
          </div>

          {result.serviceActivated && (
            <div className="bg-green-100 text-green-700 rounded-xl p-3 text-sm font-medium mb-4">
              🎉 Service "{result.serviceActivated}" activé automatiquement !
            </div>
          )}

          <div className="space-y-3">
            {result.details.map((d, i) => (
              <div key={i} className={`p-3 rounded-xl text-sm ${d.isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
                <p className="font-medium text-gray-800 mb-1">{module.qcm[i]?.question}</p>
                <p className={d.isCorrect ? 'text-green-700' : 'text-red-600'}>
                  {d.isCorrect ? '✓' : '✗'} Votre réponse : {d.yourAnswer}
                </p>
                {!d.isCorrect && (
                  <p className="text-gray-600">Bonne réponse : {d.correctAnswer}</p>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-4">
            {!result.passed && (
              <button
                onClick={() => { setResult(null); setAnswers({}) }}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Réessayer
              </button>
            )}
            <button
              onClick={() => navigate('/academy')}
              className="flex-1 py-2.5 bg-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-300 transition-colors"
            >
              Retour
            </button>
          </div>
        </div>
      )}

      {/* Déjà validé */}
      {progress?.qcmPassed && !result && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
          <CheckCircle size={36} className="text-green-500 mx-auto mb-2" />
          <p className="font-bold text-green-700">Formation validée avec {progress.score}%</p>
          <p className="text-sm text-gray-500 mt-1">Le service associé est actif dans votre espace.</p>
          <button onClick={() => navigate('/services')} className="mt-3 text-sm text-blue-600 hover:underline">
            Voir mes services →
          </button>
        </div>
      )}
    </div>
  )
}
