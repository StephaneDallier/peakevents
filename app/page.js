'use client'
 
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { LOGO_B64 } from '../lib/logo'
 
export default function Home() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [view, setView] = useState('landing')
 
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
    <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ color: '#1C3829', fontSize: 16 }}>Chargement...</div>
    </div>
  )
 
  if (view === 'landing') return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'Inter, sans-serif' }}>
      {/* Nav */}
      <nav style={{ background: '#fff', padding: '0 40px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img src={`data:image/png;base64,${LOGO_B64}`} alt="PeakEvents" style={{ height: 44 }} />
        </div>
        <button onClick={() => setView('login')}
          style={{ background: '#F97316', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
          Acceder a la plateforme &rarr;
        </button>
      </nav>
 
      {/* Hero avec image */}
      <div style={{ position: 'relative', height: 520, overflow: 'hidden' }}>
        <img
          src="https://images.unsplash.com/photo-1551632811-561732d1e306?w=1400&q=80"
          alt="Trail running"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)' }} />
        <div style={{ position: 'absolute', top: '50%', left: 60, transform: 'translateY(-50%)', maxWidth: 560 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', background: '#F97316', color: '#fff', borderRadius: 20, padding: '5px 16px', fontSize: 12, fontWeight: 600, marginBottom: 20 }}>
            Evenement pilote &mdash; SwimRun du Verdon 2027
          </div>
          <h1 style={{ fontSize: 52, fontWeight: 800, color: '#fff', lineHeight: 1.1, marginBottom: 16, letterSpacing: -1 }}>
            Organisez vos<br />evenements sportifs<br />outdoor
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.85)', marginBottom: 28, lineHeight: 1.6 }}>
            Centralisez la gestion de vos benevoles, postes et plannings.<br />Fini les fichiers Excel et les groupes WhatsApp.
          </p>
          <button onClick={() => setView('login')}
            style={{ background: '#F97316', color: '#fff', border: 'none', borderRadius: 10, padding: '14px 28px', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
            Voir le tableau de bord &rarr;
          </button>
        </div>
      </div>
 
      {/* Features */}
      <div style={{ padding: '72px 60px', maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: 34, fontWeight: 800, marginBottom: 8, color: '#111' }}>Tout ce dont vous avez besoin</h2>
        <p style={{ textAlign: 'center', color: '#6b7280', fontSize: 16, marginBottom: 48 }}>
          Une plateforme concue pour simplifier l'organisation d'evenements sportifs outdoor.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {[
            {
              svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
              title: 'Gestion des postes',
              desc: "Creez et gerez les postes de votre evenement avec les creneaux horaires et consignes."
            },
            {
              svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
              title: 'Benevoles',
              desc: "Gerez votre annuaire de benevoles et leurs competences pour chaque evenement."
            },
            {
              svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
              title: 'Planning intelligent',
              desc: "Visualisez le planning global, par poste ou par benevole en un coup d'oeil."
            },
            {
              svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
              title: 'Affectations',
              desc: "Affectez les benevoles aux postes et suivez les postes complets/incomplets."
            }
          ].map((f, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 14, padding: 24, border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ width: 48, height: 48, background: '#1C3829', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                {f.svg}
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: '#111' }}>{f.title}</div>
              <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
 
  if (view === 'login') return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 36, width: '100%', maxWidth: 400, border: '1px solid #e5e7eb', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
        <div style={{ marginBottom: 24 }}>
          <img src={`data:image/png;base64,${LOGO_B64}`} alt="PeakEvents" style={{ height: 48 }} />
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4, color: '#111' }}>Connexion</div>
        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>Bienvenue, connectez-vous a votre compte</div>
        {error && <div style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 8, padding: '10px 13px', fontSize: 13, marginBottom: 12 }}>{error}</div>}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              style={{ width: '100%', padding: '10px 13px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box' }}
              placeholder="ton@email.com" required />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Mot de passe</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', padding: '10px 13px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box' }}
              placeholder="••••••••" required />
          </div>
          <button type="submit"
            style={{ width: '100%', background: '#1C3829', color: '#fff', border: 'none', borderRadius: 8, padding: '12px', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
            Se connecter
          </button>
        </form>
        <button onClick={() => setView('landing')}
          style={{ display: 'block', textAlign: 'center', width: '100%', marginTop: 14, fontSize: 13, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
          Retour
        </button>
      </div>
    </div>
  )
 
  if (view === 'app') return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <img src={`data:image/png;base64,${LOGO_B64}`} alt="PeakEvents" style={{ height: 56, marginBottom: 16 }} />
        <p style={{ color: '#6b7280', marginBottom: 20 }}>Connecte en tant que {session?.user?.email}</p>
        <button onClick={handleLogout}
          style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 8, padding: '9px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
          Se deconnecter
        </button>
      </div>
    </div>
  )
}