import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: { url: string }
}) {
  const supabase = await createClient()
  
  const { data: scans } = await supabase
    .from('scans')
    .select('*')
    .eq('url', searchParams.url)
    .order('created_at', { ascending: false })
    .limit(1)
  
  const scan = scans?.[0]
  
  if (!scan) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Résultats de l'analyse
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 break-all">
            {scan.url}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Score d'accessibilité
            </h2>
            <div className={`px-4 py-2 rounded-full ${
              scan.score >= 90 ? 'bg-green-100 dark:bg-green-900/20' :
              scan.score >= 50 ? 'bg-yellow-100 dark:bg-yellow-900/20' :
              'bg-red-100 dark:bg-red-900/20'
            }`}>
              <span className={`text-3xl font-bold ${
                scan.score >= 90 ? 'text-green-600 dark:text-green-400' :
                scan.score >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                'text-red-600 dark:text-red-400'
              }`}>
                {scan.score}/100
              </span>
            </div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
            <div 
              className={`h-4 rounded-full transition-all ${
                scan.score >= 90 ? 'bg-green-500' :
                scan.score >= 50 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${scan.score}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            Erreurs détectées ({scan.violations?.length || 0})
          </h2>
          
          {scan.violations && scan.violations.length > 0 ? (
            <div className="space-y-4">
              {scan.violations.map((violation: any, index: number) => (
                <div 
                  key={index}
                  className={`border-l-4 p-4 rounded-r-lg ${
                    violation.impact === 'serious' ? 'border-red-500 bg-red-50 dark:bg-red-900/10' :
                    'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {violation.description}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      violation.impact === 'serious' 
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                    }`}>
                      {violation.impact === 'serious' ? 'Grave' : 'Modéré'}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">
                    {violation.help}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">
              Aucune erreur majeure détectée ! 🎉
            </p>
          )}
        </div>

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
