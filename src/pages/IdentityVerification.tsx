import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UploadCloud, CheckCircle, AlertCircle } from 'lucide-react'
import api from '../services/api'
import { authService } from '../services/authService'
import { useAuth } from '../contexts/AuthContext'

type DocKind = 'passport' | 'national_id' | 'driver_license'

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })

async function uploadKycImage(kind: 'id_front' | 'id_back' | 'selfie', file: File): Promise<string> {
  const dataUrl = await fileToDataUrl(file)
  const r = await api.post<{ success: boolean; data: { url: string } }>('/uploads/kyc', { kind, data: dataUrl })
  return r.data.data.url
}

export default function IdentityVerification() {
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()

  const [fullName, setFullName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [documentType, setDocumentType] = useState<DocKind>('passport')
  const [documentNumber, setDocumentNumber] = useState('')
  const [idFront, setIdFront] = useState<File | null>(null)
  const [idBack, setIdBack] = useState<File | null>(null)
  const [selfie, setSelfie] = useState<File | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const alreadyVerified = useMemo(() => user?.kycStatus === 'APPROVED', [user?.kycStatus])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!idFront || !idBack || !selfie) {
      setError('Please upload ID front, ID back, and a selfie photo.')
      return
    }

    setLoading(true)
    try {
      const [idFrontUrl, idBackUrl, selfieUrl] = await Promise.all([
        uploadKycImage('id_front', idFront),
        uploadKycImage('id_back', idBack),
        uploadKycImage('selfie', selfie),
      ])

      await authService.submitKyc({
        fullName,
        dateOfBirth,
        documentType,
        documentNumber,
        idFrontUrl,
        idBackUrl,
        selfieUrl,
      })

      await refreshUser()
      setSuccess(true)
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to submit KYC.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 px-6 py-10 text-white">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Identity Verification</h1>
            <p className="text-sm text-gray-400 mt-1">Complete verification to unlock trading, deposits, and withdrawals.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/app/settings')}
            className="px-4 py-2 text-sm rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
          >
            Back to settings
          </button>
        </div>

        {alreadyVerified && (
          <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5" />
            <div>
              <p className="text-emerald-300 font-semibold text-sm">Your account is verified.</p>
              <p className="text-emerald-200/80 text-sm">No further action is required.</p>
            </div>
          </div>
        )}

        {!alreadyVerified && (
          <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Full name</label>
                <input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                  placeholder="e.g. John Doe"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Date of birth</label>
                <input
                  required
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Document type</label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value as DocKind)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-colors appearance-none"
                >
                  <option value="passport">Passport</option>
                  <option value="national_id">National ID</option>
                  <option value="driver_license">Driver's license</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Document number</label>
                <input
                  required
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                  placeholder="e.g. A12345678"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">ID front</p>
                <input type="file" accept="image/*" onChange={(e) => setIdFront(e.target.files?.[0] || null)} />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">ID back</p>
                <input type="file" accept="image/*" onChange={(e) => setIdBack(e.target.files?.[0] || null)} />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Selfie</p>
                <input type="file" accept="image/*" onChange={(e) => setSelfie(e.target.files?.[0] || null)} />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5" />
                <span>Submission received. Your verification is now under review.</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/20 flex justify-center items-center gap-2 disabled:opacity-50"
              title={loading ? 'Submitting...' : 'Submit verification'}
            >
              <UploadCloud className="w-5 h-5" />
              {loading ? 'Submitting...' : 'Submit verification'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

