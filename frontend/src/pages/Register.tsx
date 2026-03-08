import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits.length ? `(${digits}` : ''
  if (digits.length <= 7) return `(${digits.slice(0, 2)})${digits.slice(2)}`
  return `(${digits.slice(0, 2)})${digits.slice(2, 7)}-${digits.slice(7)}`
}

export default function Register() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [residence, setResidence] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('As senhas não coincidem'); return }
    if (password.length < 6) { setError('Senha deve ter pelo menos 6 caracteres'); return }
    setLoading(true)
    const API = import.meta.env.VITE_API_URL || ''
    try {
      const rawPhone = phone.replace(/\D/g, '')
      const res = await axios.post(`${API}/api/auth/register`, { phone: rawPhone, residence, password })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('residence', res.data.residence)
      navigate('/search')
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) setError(err.response?.data?.error || 'Erro ao cadastrar')
      else setError('Erro ao cadastrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-600 rounded-full mb-4 shadow-lg">
            <span className="text-4xl">🏡</span>
          </div>
          <h1 className="text-3xl font-extrabold text-primary-800">Avalia Ninho</h1>
          <p className="text-primary-600 mt-1">Cadastro de Residente</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          <h2 className="text-xl font-bold text-primary-700 text-center">Criar Conta</h2>
          <p className="text-xs text-gray-500 text-center">Cadastro único por residência</p>

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
            <p className="text-xs text-gray-400 mt-1">Ex: EJ06, AP12, BL03...</p>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Senha</label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-400 text-gray-800"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white font-bold py-3 rounded-lg transition-colors shadow-md"
          >
            {loading ? 'Cadastrando...' : 'Criar Conta'}
          </button>

          <p className="text-center text-sm text-gray-600">
            Já tem conta?{' '}
            <Link to="/login" className="text-primary-600 font-semibold hover:underline">
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
