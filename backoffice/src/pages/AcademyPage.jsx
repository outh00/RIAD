import { useState, useEffect } from 'react'
import { PlayCircle, HelpCircle } from 'lucide-react'
import { api } from '../api/client'

export default function AcademyPage() {
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    api.academy.list().then(setModules).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700" />
    </div>
  )

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">RIAD Academy — Gestion modules</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map(m => (
          <div
            key={m.id}
            className={`bg-white rounded-2xl p-5 shadow-sm border cursor-pointer hover:border-blue-200 transition-all ${selected?.id === m.id ? 'border-blue-400' : 'border-gray-100'}`}
            onClick={() => setSelected(selected?.id === m.id ? null : m)}
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                {m.serviceId}
              </span>
              <span className="text-xs text-gray-400">{m.questionCount} questions</span>
            </div>
            <h3 className="font-semibold text-gray-800 text-sm mb-1">{m.title}</h3>
            <div className="flex items-center gap-3 text-xs text-gray-400 mt-3">
              <span className="flex items-center gap-1"><PlayCircle size={12} />{Math.floor(m.duration / 60)}min</span>
              <span className="flex items-center gap-1"><HelpCircle size={12} />Score min : {m.passingScore}%</span>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-blue-200">
          <h2 className="font-semibold text-gray-800 mb-1">{selected.title}</h2>
          <p className="text-sm text-gray-500 mb-4">Vidéo : <a href={selected.videoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{selected.videoUrl || 'Non définie'}</a></p>
          <p className="text-sm font-medium text-gray-700 mb-3">Questions QCM ({selected.questionCount})</p>
          <p className="text-sm text-gray-500 italic">Aperçu du contenu — modification via l'API disponible.</p>
        </div>
      )}
    </div>
  )
}
