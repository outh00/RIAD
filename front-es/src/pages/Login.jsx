import { useState, useEffect } from 'react'
import { ShoppingBag, Eye, EyeOff, LogIn } from 'lucide-react'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export default function Login() {
  const [agents, setAgents] = useState([])
  const [agentId, setAgentId] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch(`${BASE_URL}/auth/agents`)
      .then(r => r.json())
      .then(data => { setAgents(data); if (data.length) setAgentId(data[0].id) })
      .catch(() => {})
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erreur de connexion'); return }
      localStorage.setItem('m2t_agent_id', data.id)
      localStorage.setItem('m2t_agent_name', data.name)
      window.location.replace('/')
    } catch {
      setError('Impossible de contacter le serveur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #1e2d6b 0%, #0f172a 100%)' }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg" style={{ backgroundColor: '#f97316' }}>
            <ShoppingBag size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-wide">RIAD</h1>
          <p className="text-blue-300 text-sm mt-1">Espace Agent · by M2T</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Connexion</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Agent selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Votre identifiant
              </label>
              <select
                value={agentId}
                onChange={e => setAgentId(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 bg-gray-50"
              >
                {agents.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} — {a.city}
                  </option>
                ))}
              </select>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:border-blue-400 bg-gray-50"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !agentId || !password}
              className="w-full py-3.5 rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ backgroundColor: '#1e2d6b' }}
            >
              {loading
                ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                : <><LogIn size={16} /> Se connecter</>
              }
            </button>
          </form>
        </div>

        <p className="text-center text-blue-400 text-xs mt-6">
          © 2026 M2T · Tous droits réservés
        </p>
      </div>
    </div>
  )
}
