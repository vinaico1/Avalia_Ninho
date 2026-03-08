import { useState } from 'react'
import StarRating from './StarRating'
import axios from 'axios'

interface Review {
  stars: number
  comment: string
  created_at: string
  residence: string
}

interface Provider {
  id: number
  name: string
  phone: string
  specialty?: string
  avg_stars: number
  total_evaluations: number
}

interface ProviderCardProps {
  provider: Provider
  onEvaluated: () => void
  myEvalStars?: number
}

export default function ProviderCard({ provider, onEvaluated, myEvalStars }: ProviderCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [myStars, setMyStars] = useState(0)
  const [comment, setComment] = useState('')
  const [reviews, setReviews] = useState<Review[]>([])
  const [myEval, setMyEval] = useState<{ stars: number; comment: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const token = localStorage.getItem('token')
  const headers = { Authorization: `Bearer ${token}` }
  const API = import.meta.env.VITE_API_URL || ''

  async function loadDetails() {
    if (loaded) return
    setLoaded(true)
    const [detailRes, myRes] = await Promise.all([
      axios.get(`${API}/api/providers/${provider.id}`, { headers }),
      axios.get(`${API}/api/providers/${provider.id}/my-evaluation`, { headers })
    ])
    setReviews(detailRes.data.reviews || [])
    if (myRes.data) {
      setMyEval(myRes.data)
      setMyStars(myRes.data.stars)
      setComment(myRes.data.comment || '')
    }
  }

  async function handleExpand() {
    setExpanded(!expanded)
    if (!expanded) await loadDetails()
  }

  async function submitEvaluation() {
    if (!myStars) return
    setSaving(true)
    try {
      await axios.post(`${API}/api/evaluations`, { provider_id: provider.id, stars: myStars, comment }, { headers })
      setMyEval({ stars: myStars, comment })
      setLoaded(false)
      await loadDetails()
      onEvaluated()
    } finally {
      setSaving(false)
    }
  }

  const avg = Number(provider.avg_stars)

  return (
    <div className="bg-white rounded-2xl shadow-md border border-primary-100 overflow-hidden">
      <div
        className="p-4 cursor-pointer flex items-start justify-between hover:bg-primary-50 transition-colors"
        onClick={handleExpand}
      >
        <div className="flex-1">
          <h3 className="font-bold text-primary-800 text-lg">{provider.name}</h3>
          <p className="text-gray-500 text-sm">{provider.phone}</p>
          {provider.specialty && <p className="text-primary-600 text-sm mt-0.5">{provider.specialty}</p>}
        </div>
        <div className="text-right ml-4 space-y-1">
          <StarRating value={avg} readonly size="sm" />
          <p className="text-xs text-gray-500">
            {avg > 0 ? avg.toFixed(1) : '—'} · {provider.total_evaluations} avaliação(ões)
          </p>
          {myEvalStars !== undefined && (
            <div className="flex items-center justify-end gap-1 mt-1">
              <span className="text-xs text-primary-600 font-medium">Minha nota:</span>
              <StarRating value={myEvalStars} readonly size="sm" />
            </div>
          )}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-primary-100 p-4 space-y-4">
          {/* My evaluation */}
          <div className="bg-primary-50 rounded-xl p-4">
            <h4 className="font-semibold text-primary-700 mb-2">
              {myEval ? 'Minha Avaliação (editar)' : 'Avaliar este Prestador'}
            </h4>
            <StarRating value={myStars} onChange={setMyStars} size="lg" />
            <textarea
              className="mt-3 w-full border border-primary-200 rounded-lg p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-400"
              rows={2}
              placeholder="Comentário (opcional)"
              value={comment}
              onChange={e => setComment(e.target.value)}
            />
            <button
              onClick={submitEvaluation}
              disabled={!myStars || saving}
              className="mt-2 w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white font-semibold py-2 rounded-lg transition-colors"
            >
              {saving ? 'Salvando...' : myEval ? 'Atualizar Avaliação' : 'Enviar Avaliação'}
            </button>
          </div>

          {/* Reviews */}
          {reviews.length > 0 && (
            <div>
              <h4 className="font-semibold text-primary-700 mb-2">Avaliações</h4>
              <div className="space-y-2">
                {reviews.map((r, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-primary-700">{r.residence}</span>
                      <StarRating value={r.stars} readonly size="sm" />
                    </div>
                    {r.comment && <p className="text-gray-600 mt-1">{r.comment}</p>}
                    <p className="text-gray-400 text-xs mt-1">{new Date(r.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
