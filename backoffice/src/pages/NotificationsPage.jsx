import { useState, useEffect } from 'react'
import { Send, Trash2 } from 'lucide-react'
import { api } from '../api/client'

const typeOptions = [
  { value: 'info', label: '📘 Info', color: 'bg-blue-100 text-blue-700' },
  { value: 'success', label: '✅ Succès', color: 'bg-blue-100 text-blue-700' },
  { value: 'warning', label: '⚠️ Avertissement', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'error', label: '🚨 Urgent', color: 'bg-red-100 text-red-700' },
]

export default function NotificationsPage() {
  const [agents, setAgents] = useState([])
  const [form, setForm] = useState({ agentId: '', title: '', message: '', type: 'info' })
  const [sending, setSending] = useState(false)
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    api.agents.list().then(setAgents)
  }, [])

  const handleSend = async () => {
    if (!form.title || !form.message) return
    setSending(true)
    try {
      const res = await api.notifications.send({
        agentId: form.agentId || undefined,
        title: form.title,
        message: form.message,
        type: form.type,
      })
      setFeedback({ type: 'success', text: res.message })
      setForm({ agentId: '', title: '', message: '', type: 'info' })
    } catch {
      setFeedback({ type: 'error', text: 'Erreur lors de l\'envoi' })
    } finally {
      setSending(false)
      setTimeout(() => setFeedback(null), 4000)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-bold text-gray-900">Envoyer des notifications</h1>

      {feedback && (
        <div className={`p-4 rounded-xl text-sm font-medium ${feedback.type === 'success' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'}`}>
          {feedback.text}
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
        {/* Destinataire */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Destinataire</label>
          <select
            value={form.agentId}
            onChange={e => setForm(f => ({ ...f, agentId: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
          >
            <option value="">📢 Tous les agents (broadcast)</option>
            {agents.map(a => (
              <option key={a.id} value={a.id}>{a.name} — {a.city}</option>
            ))}
          </select>
        </div>

        {/* Type */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Type</label>
          <div className="flex gap-2 flex-wrap">
            {typeOptions.map(t => (
              <button
                key={t.value}
                onClick={() => setForm(f => ({ ...f, type: t.value }))}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all border-2 ${form.type === t.value ? `${t.color} border-current` : 'bg-gray-100 text-gray-500 border-transparent'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Titre */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Titre</label>
          <input
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Ex: Nouveau service disponible"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
          />
        </div>

        {/* Message */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Message</label>
          <textarea
            value={form.message}
            onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            placeholder="Contenu de la notification..."
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 resize-none"
          />
        </div>

        <button
          onClick={handleSend}
          disabled={sending || !form.title || !form.message}
          className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Send size={16} />
          {sending ? 'Envoi en cours...' : form.agentId ? 'Envoyer à cet agent' : 'Broadcast à tous les agents'}
        </button>
      </div>
    </div>
  )
}
