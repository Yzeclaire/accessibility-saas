'use client'

import { useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const router = useRouter()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const supabase = createBrowserClient()

    if (isSignUp) {
      // Inscription
      const { error } = await supabase.auth.signUp({
        email,
        password: 'temporary-password-' + Math.random(), // On utilise magic link, pas de password
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setMessage(`Erreur : ${error.message}`)
      } else {
        setMessage('✅ Compte créé ! Vérifiez votre email pour vous connecter.')
      }
    } else {
      // Connexion avec magic link
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setMessage(`Erreur : ${error.message}`)
      } else {
        setMessage('✅ Email envoyé ! Cliquez sur le lien pour vous connecter.')
      }
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        
        {/* Logo/Titre */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {isSignUp ? 'Créer un compte' : 'Connexion'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isSignUp 
              ? 'Commencez à analyser vos sites gratuitement' 
              : 'Accédez à votre dashboard et historique'}
          </p>
        </div>

        {/* Formulaire */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
          <form onSubmit={handleAuth} className="space-y-6">
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="vous@exemple.com"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors focus:outline-none focus:ring-4 focus:ring-indigo-300"
            >
              {loading ? 'Envoi...' : (isSignUp ? 'Créer mon compte' : 'Envoyer le lien magique')}
            </button>
          </form>

          {message && (
            <div className={`mt-4 p-4 rounded-lg ${
              message.includes('✅') 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' 
                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'
            }`}>
              {message}
            </div>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm"
            >
              {isSignUp ? 'Déjà un compte ? Se connecter' : 'Pas encore de compte ? S\'inscrire'}
            </button>
          </div>

          <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
            Nous vous enverrons un lien de connexion par email. Pas besoin de mot de passe !
          </p>
        </div>

        <div className="mt-6 text-center">
          <a href="/" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 text-sm">
            ← Retour à l&apos;accueil
          </a>
        </div>
      </div>
    </div>
  )
}

