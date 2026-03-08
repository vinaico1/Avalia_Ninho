import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits.length ? `(${digits}` : ''
  if (digits.length <= 7) return `(${digits.slice(0, 2)})${digits.slice(2)}`
  return `(${digits.slice(0, 2)})${digits.slice(2, 7)}-${digits.slice(7)}`
}

export default function Login() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [residence, setResidence] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const API = import.meta.env.VITE_API_URL || ''

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const rawPhone = phone.replace(/\D/g, '')
      const res = await axios.post(`${API}/api/auth/login`, { phone: rawPhone, residence, password })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('residence', res.data.residence)
      navigate('/search')
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) setError(err.response?.data?.error || 'Erro ao fazer login')
      else setError('Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-600 rounded-full mb-4 shadow-lg">
            <span className="text-4xl">🏡</span>
          </div>
          <h1 className="text-3xl font-extrabold text-primary-800">Avalia Ninho</h1>
          <p className="text-primary-600 mt-1">Avalie os melhores prestadores</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          <h2 className="text-xl font-bold text-primary-700 text-center">Entrar</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-3 py-2 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
            <input
              type="tel"
              placeholder="(11)99851-9872"
              value={phone}
              onChange={e => setPhone(formatPhone(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-400 text-gray-800"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Residência</label>
            <input
              type="text"
              placeholder="EJ06"
              value={residence}
              onChange={e => setResidence(e.target.value.toUpperCase())}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-400 text-gray-800 uppercase"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-400 text-gray-800"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white font-bold py-3 rounded-lg transition-colors shadow-md"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          <p className="text-center text-sm text-gray-600">
            Ainda não tem conta?{' '}
            <Link to="/register" className="text-primary-600 font-semibold hover:underline">
              Cadastrar
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
