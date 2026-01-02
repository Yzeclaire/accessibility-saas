import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Vérifie si l'utilisateur est connecté
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  // Récupère les scans de l'utilisateur
  const { data: scans } = await supabase
    .from('scans')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  // Compte les scans du mois en cours
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count: monthlyScans } = await supabase
    .from('scans')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', startOfMonth.toISOString())

  const scansLeft = Math.max(0, 5 - (monthlyScans || 0))

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900">
      
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Mon Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {user.email}
            </span>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Scans restants ce mois</div>
            <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              {scansLeft} / 5
            </div>
            <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all"
                style={{ width: `${(scansLeft / 5) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total des scans</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {scans?.length || 0}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Score moyen</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {scans && scans.length > 0
                ? Math.round(scans.reduce((acc, s) => acc + (s.score || 0), 0) / scans.length)
                : '-'}
              <span className="text-lg">/100</span>
            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="mb-8">
          <a
            href="/"
            className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-4 focus:ring-indigo-300"
          >
            + Nouveau scan
          </a>
        </div>

        {/* Liste des scans */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Mes scans récents
            </h2>
          </div>

          {scans && scans.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {scans.map((scan) => (
                <div key={scan.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {scan.url}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(scan.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 ml-4">
                      {/* Score */}
                      <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        scan.score >= 90 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                        scan.score >= 70 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {scan.score}/100
                      </div>

                      {/* Boutons */}
                      <div className="flex gap-2">
                        <a
                          href={`/results?url=${encodeURIComponent(scan.url)}`}
                          className="px-4 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                        >
                          Voir
                        </a>
                        <form action="/api/rescan" method="POST" className="inline">
                          <input type="hidden" name="url" value={scan.url} />
                          <button
                            type="submit"
                            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            disabled={scansLeft === 0}
                          >
                            🔄 Re-scanner
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
              Aucun scan pour le moment. Commencez par analyser votre premier site !
            </div>
          )}
        </div>

        {scansLeft === 0 && (
          <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 text-center">
            <p className="text-yellow-800 dark:text-yellow-300 font-semibold mb-2">
              🔒 Limite atteinte
            </p>
            <p className="text-yellow-700 dark:text-yellow-400 text-sm">
              Vous avez utilisé vos 5 scans gratuits ce mois. Revenez le mois prochain ou passez à la version premium !
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

