export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Dashboard
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mt-4">
        Ça marche ! 🎉
      </p>
      <a href="/" className="text-indigo-600 hover:underline mt-4 block">
        ← Retour à l&apos;accueil
      </a>
    </div>
  )
}

