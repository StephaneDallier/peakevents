'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [view, setView] = useState('landing') // landing | login | app

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) setView('app')
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) setView('app')
      else setView('landing')
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('Email ou mot de passe incorrect')
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-white text-lg">Chargement...</div>
    </div>
  )

  // LANDING
  if (view === 'landing') return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-800">
        <div className="text-2xl font-bold text-emerald-400">PeakEvents</div>
        <button onClick={() => setView('login')} className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-lg font-medium transition">
          Se connecter
        </button>
      </nav>
      <div className="flex flex-col items-center justify-center px-8 py-32 text-center">
        <h1 className="text-5xl font-bold mb-6">Gérez vos événements<br/>outdoor sans effort</h1>
        <p className="text-gray-400 text-xl mb-10 max-w-xl">Coordinateurs, bénévoles, plannings — tout au même endroit pour vos événements trail, triathlon et swimrun.</p>
        <button onClick={() => setView('login')} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl text-lg font-semibold transition">
          Commencer maintenant
        </button>
      </div>
    </div>
  )

  // LOGIN
  if (view === 'login') return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-md">
        <div className="text-2xl font-bold text-emerald-400 mb-2">PeakEvents</div>
        <h2 className="text-white text-xl font-semibold mb-6">Connexion</h2>
        {error && <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-emerald-500"
              placeholder="ton@email.com" required />
          </div>
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Mot de passe</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-emerald-500"
              placeholder="••••••••" required />
          </div>
          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-lg font-semibold transition">
            Se connecter
          </button>
        </form>
        <button onClick={() => setView('landing')} className="text-gray-500 hover:text-gray-300 text-sm mt-4 block text-center w-full transition">
          Retour
        </button>
      </div>
    </div>
  )

  // APP (connecté)
  if (view === 'app') return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-2xl font-bold text-emerald-400 mb-4">PeakEvents</div>
        <p className="text-gray-400 mb-6">Connecté en tant que {session?.user?.email}</p>
        <button onClick={handleLogout} className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition">
          Se déconnecter
        </button>
      </div>
    </div>
  )
}