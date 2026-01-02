import { Suspense } from 'react'

interface ResultsPageProps {
  searchParams: Promise<{ url?: string }>
}

function ResultsContent({ url }: { url: string }) {
  // Données factices pour le MVP
  const score = 75
  const errors = [
    {
      id: 1,
      type: 'Contraste des couleurs',
      severity: 'error',
      message:
        'Le contraste entre le texte et l\'arrière-plan est insuffisant (ratio: 3.2:1). Minimum requis: 4.5:1.',
      element: 'body > main > h1',
    },
    {
      id: 2,
      type: 'Images sans texte alternatif',
      severity: 'error',
      message:
        '3 images n\'ont pas d\'attribut alt ou ont un alt vide.',
      element: 'img[src="/logo.png"]',
    },
    {
      id: 3,
      type: 'Formulaires sans labels',
      severity: 'error',
      message:
        'Le champ de recherche n\'a pas de label associé.',
      element: 'input[type="search"]',
    },
  ]

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400'
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/20'
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/20'
    return 'bg-red-100 dark:bg-red-900/20'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Résultats de l&apos;analyse
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 break-all">
            {url}
          </p>
        </div>

        {/* Score Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Score d&apos;accessibilité
            </h2>
            <div
              className={`px-4 py-2 rounded-full ${getScoreBgColor(score)}`}
            >
              <span className={`text-3xl font-bold ${getScoreColor(score)}`}>
                {score}/100
              </span>
            </div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all ${
                score >= 80
                  ? 'bg-green-500'
                  : score >= 60
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
              }`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>

        {/* Errors List */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            Erreurs détectées ({errors.length})
          </h2>
          <div className="space-y-4">
            {errors.map((error) => (
              <div
                key={error.id}
                className="border-l-4 border-red-500 bg-red-50 dark:bg-red-900/10 p-4 rounded-r-lg"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {error.type}
                  </h3>
                  <span className="px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded">
                    Erreur
                  </span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  {error.message}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                  {error.element}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-8 text-center">
          <a
            href="/"
            className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
          >
            Nouveau scan
          </a>
        </div>
      </div>
    </div>
  )
}

export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const params = await searchParams
  const url = params.url

  if (!url) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            URL manquante
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Veuillez fournir une URL pour afficher les résultats.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
          >
            Retour à l&apos;accueil
          </a>
        </div>
      </div>
    )
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
          <p className="text-gray-600 dark:text-gray-300">Chargement...</p>
        </div>
      }
    >
      <ResultsContent url={decodeURIComponent(url)} />
    </Suspense>
  )
}

