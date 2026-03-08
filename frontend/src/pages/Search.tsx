import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import ProviderCard from '../components/ProviderCard'

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits.length ? `(${digits}` : ''
  if (digits.length <= 7) return `(${digits.slice(0, 2)})${digits.slice(2)}`
  return `(${digits.slice(0, 2)})${digits.slice(2, 7)}-${digits.slice(7)}`
}

interface Provider {
  id: number
  name: string
  phone: string
  specialty?: string
  avg_stars: number
  total_evaluations: number
}

interface MyEvaluation extends Provider {
  my_stars: number | null
  my_comment: string | null
}

export default function Search() {
  const navigate = useNavigate()
  const residence = localStorage.getItem('residence') || ''
  const token = localStorage.getItem('token')
  const API = import.meta.env.VITE_API_URL || ''
  const headers = { Authorization: `Bearer ${token}` }

  const [query, setQuery] = useState('')
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(false)
  const [allProviders, setAllProviders] = useState<MyEvaluation[]>([])
  const [allLoading, setAllLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newSpecialty, setNewSpecialty] = useState('')
  const [addError, setAddError] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  async function loadAllProviders() {
    setAllLoading(true)
    try {
      const res = await axios.get(`${API}/api/providers`, { headers })
      setAllProviders(res.data)
    } catch {
      // ignore
    } finally {
      setAllLoading(false)
    }
  }

  useEffect(() => {
    loadAllProviders()
  }, [])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (!query.trim()) { setProviders([]); return }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await axios.get(`${API}/api/providers/search?q=${encodeURIComponent(query)}`, { headers })
        setProviders(res.data)
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }, 300)
  }, [query])

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('residence')
    navigate('/login')
  }

  async function handleAddProvider(e: React.FormEvent) {
    e.preventDefault()
    setAddError('')
    setAddLoading(true)
    try {
      const rawPhone = newPhone.replace(/\D/g, '')
      await axios.post(`${API}/api/providers`, { name: newName, phone: rawPhone, specialty: newSpecialty }, { headers })
      setShowAddModal(false)
      setNewName(''); setNewPhone(''); setNewSpecialty('')
      if (query.trim()) {
        const res = await axios.get(`${API}/api/providers/search?q=${encodeURIComponent(query)}`, { headers })
        setProviders(res.data)
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) setAddError(err.response?.data?.error || 'Erro ao cadastrar')
      else setAddError('Erro ao cadastrar')
    } finally {
      setAddLoading(false)
    }
  }

  async function refreshSearch() {
    await loadAllProviders()
    if (!query.trim()) return
    const res = await axios.get(`${API}/api/providers/search?q=${encodeURIComponent(query)}`, { headers })
    setProviders(res.data)
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-primary-700 text-white px-4 py-4 shadow-lg sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏡</span>
            <div>
              <h1 className="font-extrabold text-lg leading-tight">Avalia Ninho</h1>
              <p className="text-primary-200 text-xs">{residence}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="text-primary-200 hover:text-white text-sm font-medium transition-colors">
            Sair
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Search bar */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400 text-lg">🔍</span>
          <input
            type="text"
            placeholder="Buscar por nome ou telefone..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border-2 border-primary-200 rounded-2xl focus:outline-none focus:border-primary-500 bg-white text-gray-800 shadow-sm text-base"
          />
          {loading && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-400 animate-spin">⟳</span>
          )}
        </div>

        {/* Add provider button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full flex items-center justify-center gap-2 bg-primary-100 hover:bg-primary-200 text-primary-700 font-semibold py-2.5 rounded-xl transition-colors border border-primary-200"
        >
          <span className="text-lg">+</span> Cadastrar Prestador
        </button>

        {/* Results */}
        {!query.trim() && (
          <div>
            <h2 className="text-base font-bold text-primary-700 mb-3">Todos os Prestadores</h2>
            {allLoading && (
              <div className="text-center text-gray-400 py-8">Carregando...</div>
            )}
            {!allLoading && allProviders.length === 0 && (
              <div className="text-center text-gray-400 py-10">
                <p className="text-5xl mb-3">🔎</p>
                <p className="font-medium text-gray-500">Nenhum prestador cadastrado ainda</p>
                <p className="text-sm mt-1">Cadastre o primeiro prestador acima</p>
              </div>
            )}
            {!allLoading && allProviders.length > 0 && (
              <div className="space-y-3">
                {allProviders.map(p => (
                  <ProviderCard key={p.id} provider={p} onEvaluated={refreshSearch} myEvalStars={p.my_stars ?? undefined} />
                ))}
              </div>
            )}
          </div>
        )}

        {query.trim() && providers.length === 0 && !loading && (
          <div className="text-center text-gray-400 py-12">
            <p className="text-5xl mb-3">😔</p>
            <p className="font-medium">Nenhum prestador encontrado</p>
            <p className="text-sm mt-1">Tente cadastrar um novo prestador</p>
          </div>
        )}

        <div className="space-y-3">
          {providers.map(p => (
            <ProviderCard key={p.id} provider={p} onEvaluated={refreshSearch} />
          ))}
        </div>
      </div>

      {/* Add Provider Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="p-6">
              <h3 className="text-xl font-bold text-primary-800 mb-4">Cadastrar Prestador</h3>
              {addError && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-3 py-2 text-sm mb-3">
                  {addError}
                </div>
              )}
              <form onSubmit={handleAddProvider} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                  <input
                    type="text"
                    placeholder="Nome completo"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone *</label>
                  <input
                    type="tel"
                    placeholder="(11)99819-7887"
                    value={newPhone}
                    onChange={e => setNewPhone(formatPhone(e.target.value))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Especialidade</label>
                  <input
                    type="text"
                    placeholder="Ex: Encanador, Eletricista..."
                    value={newSpecialty}
                    onChange={e => setNewSpecialty(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowAddModal(false); setAddError('') }}
                    className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={addLoading}
                    className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white font-semibold py-2.5 rounded-lg transition-colors"
                  >
                    {addLoading ? 'Salvando...' : 'Cadastrar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
