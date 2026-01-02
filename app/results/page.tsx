import { createClient } from '@/lib/supabase/server'
import { Suspense } from 'react'

interface ResultsPageProps {
  searchParams: Promise<{ url?: string }>
}

async function ResultsContent({ url }: { url: string }) {
  const supabase = await createClient()
  
  const { data: scans } = await supabase
    .from('scans')
    .select('*')
    .eq('url', url)
    .order('created_at', { ascending: false })
    .limit(1)
  
  const scan = scans?.[0]
  
  if (!scan) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Scan introuvable
          </h1>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Aucun résultat trouvé pour cette URL.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-4 focus:ring-indigo-300"
            aria-label="Retour à l'accueil"
          >
            Retour à l&apos;accueil
          </a>
        </div>
      </div>
    )
  }

  const getScoreMessage = (score: number) => {
    if (score >= 90) return { text: 'Excellent ! Votre site est très accessible', color: 'text-green-700 dark:text-green-300', bg: 'bg-green-50 dark:bg-green-900/20', icon: '🎉' }
    if (score >= 70) return { text: 'Bon travail ! Quelques améliorations recommandées', color: 'text-yellow-700 dark:text-yellow-300', bg: 'bg-yellow-50 dark:bg-yellow-900/20', icon: '⚠️' }
    return { text: 'Attention : Des problèmes importants détectés', color: 'text-red-700 dark:text-red-300', bg: 'bg-red-50 dark:bg-red-900/20', icon: '❌' }
  }

  const scoreMsg = getScoreMessage(scan.score)

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Header avec breadcrumb accessible */}
        <nav aria-label="Fil d'Ariane" className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <li><a href="/" className="hover:text-indigo-600 focus:outline-none focus:underline">Accueil</a></li>
            <li aria-hidden="true">›</li>
            <li aria-current="page" className="font-medium text-gray-900 dark:text-white">Résultats</li>
          </ol>
        </nav>

        {/* Titre principal */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
            Rapport d&apos;accessibilité
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-300 break-all bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border-l-4 border-indigo-500">
            {scan.url}
          </p>
        </header>

        {/* Score avec message contextuel */}
        <section aria-labelledby="score-heading" className="mb-8">
          <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-8">
            
            <div className={`${scoreMsg.bg} rounded-lg p-4 mb-6`}>
              <p className={`text-lg font-semibold ${scoreMsg.color} flex items-center gap-2`}>
                <span aria-hidden="true">{scoreMsg.icon}</span>
                {scoreMsg.text}
              </p>
            </div>

            <div className="flex items-center justify-between mb-6">
              <h2 id="score-heading" className="text-2xl font-semibold text-gray-900 dark:text-white">
                Score d&apos;accessibilité
              </h2>
              <div 
                className={`px-6 py-3 rounded-lg ${
                  scan.score >= 90 ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500' :
                  scan.score >= 50 ? 'bg-yellow-100 dark:bg-yellow-900/30 border-2 border-yellow-500' :
                  'bg-red-100 dark:bg-red-900/30 border-2 border-red-500'
                }`}
                role="status"
                aria-live="polite"
              >
                <span className={`text-4xl font-bold ${
                  scan.score >= 90 ? 'text-green-700 dark:text-green-300' :
                  scan.score >= 50 ? 'text-yellow-700 dark:text-yellow-300' :
                  'text-red-700 dark:text-red-300'
                }`}>
                  {scan.score}<span className="text-2xl">/100</span>
                </span>
                <span className="sr-only">Score de {scan.score} sur 100</span>
              </div>
            </div>

            {/* Barre de progression accessible */}
            <div className="w-full">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6 overflow-hidden" role="progressbar" aria-valuenow={scan.score} aria-valuemin={0} aria-valuemax={100} aria-label={`Score d'accessibilité: ${scan.score}%`}>
                <div 
                  className={`h-6 rounded-full transition-all flex items-center justify-end pr-2 ${
                    scan.score >= 90 ? 'bg-green-500' :
                    scan.score >= 50 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${scan.score}%` }}
                >
                  <span className="text-white text-xs font-bold">{scan.score}%</span>
                </div>
              </div>
            </div>

            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Basé sur les critères WCAG 2.1 niveau AA
            </p>
          </div>
        </section>

        {/* Liste des violations avec explications détaillées */}
        <section aria-labelledby="violations-heading">
          <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-8">
            <h2 id="violations-heading" className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Problèmes détectés ({scan.violations?.length || 0})
            </h2>
            
            {scan.violations && scan.violations.length > 0 ? (
              <ol className="space-y-6" role="list">
                {scan.violations.map((violation: any, index: number) => (
                  <li 
                    key={index}
                    className={`border-l-4 p-6 rounded-r-lg ${
                      violation.impact === 'serious' 
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/10' 
                        : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {index + 1}. {violation.description}
                      </h3>
                      <span 
                        className={`px-3 py-1 text-xs font-bold rounded-full whitespace-nowrap ml-4 ${
                          violation.impact === 'serious' 
                            ? 'bg-red-600 text-white'
                            : 'bg-yellow-600 text-white'
                        }`}
                        aria-label={`Gravité: ${violation.impact === 'serious' ? 'Grave' : 'Modéré'}`}
                      >
                        {violation.impact === 'serious' ? '🚨 Grave' : '⚠️ Modéré'}
                      </span>
                    </div>
                    
                    <div className="text-gray-800 dark:text-gray-200 space-y-3 text-base leading-relaxed whitespace-pre-line">
                      {violation.help}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="text-center py-12 bg-green-50 dark:bg-green-900/10 rounded-lg border-2 border-green-200 dark:border-green-800">
                <span className="text-6xl mb-4 block" aria-hidden="true">🎉</span>
                <p className="text-xl font-semibold text-green-800 dark:text-green-300">
                  Aucun problème majeur détecté !
                </p>
                <p className="text-gray-700 dark:text-gray-400 mt-2">
                  Votre site respecte les principales règles d&apos;accessibilité
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Action footer */}
        <div className="mt-10 text-center">
          <a
            href="/"
            className="inline-block px-8 py-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-lg font-semibold rounded-lg transition-colors focus:outline-none focus:ring-4 focus:ring-indigo-300 shadow-lg"
            aria-label="Analyser un nouveau site web"
          >
            ← Analyser un nouveau site
          </a>
        </div>
      </div>
    </main>
  )
}

export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const params = await searchParams
  const url = params.url

  if (!url) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            URL manquante
          </h1>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Veuillez fournir une URL pour afficher les résultats.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-4 focus:ring-indigo-300"
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
        <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center" role="status" aria-live="polite">
          <p className="text-gray-700 dark:text-gray-300 text-lg">Chargement des résultats...</p>
        </div>
      }
    >
      <ResultsContent url={decodeURIComponent(url)} />
    </Suspense>
  )
}
