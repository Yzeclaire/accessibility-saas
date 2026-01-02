'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(data.error || 'Erreur lors du scan')
        setLoading(false)
        return
      }

      // Redirection vers la page de résultats
      router.push(`/results?url=${encodeURIComponent(url)}`)
    } catch (err) {
      setError('Erreur de connexion')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 relative">
      <div className="absolute top-4 right-4">
        <a
          href="/dashboard"
          className="px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
        >
          Mon Dashboard →
        </a>
      </div>
      <main className="w-full max-w-2xl px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Scanner d&apos;accessibilité{' '}
            <span className="text-indigo-600 dark:text-indigo-400">WCAG</span>{' '}
            gratuit
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mt-4">
            Testez l&apos;accessibilité de votre site web en quelques secondes
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://votre-site.com"
              required
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white text-gray-900"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Analyse...' : 'Tester'}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}
        </form>

        <div className="mt-8 text-center text-gray-600 dark:text-gray-400">
          <p className="text-sm">
            Analyse conforme aux standards WCAG 2.1 • Résultats instantanés
          </p>
        </div>
      </main>
    </div>
  )
}
