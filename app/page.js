'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { LOGO_B64 } from '../lib/logo'
import AppLayout from './AppLayout'

const inputStyle = { width: '100%', padding: '10px 13px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box', color: '#111' }
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }

export default function Home() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('landing')

  // Login
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  // Register
  const [regFirstName, setRegFirstName] = useState('')
  const [regLastName, setRegLastName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regPassword2, setRegPassword2] = useState('')
  const [regError, setRegError] = useState('')
  const [regSuccess, setRegSuccess] = useState(false)
  const [regLoading, setRegLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) setView('app')
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) setView('app')
      else if (view !== 'register') setView('landing')
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleLogin(e) {
    e.preventDefault()
    setLoginError('')
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword })
    if (error) setLoginError('Email ou mot de passe incorrect')
  }

  async function handleRegister(e) {
    e.preventDefault()
    setRegError('')
    if (!regFirstName.trim() || !regLastName.trim()) { setRegError('Prénom et nom sont obligatoires'); return }
    if (regPassword.length < 6) { setRegError('Le mot de passe doit faire au moins 6 caractères'); return }
    if (regPassword !== regPassword2) { setRegError('Les mots de passe ne correspondent pas'); return }
    setRegLoading(true)
    const { error } = await supabase.auth.signUp({
      email: regEmail,
      password: regPassword,
      options: {
        data: {
          first_name: regFirstName.trim(),
          last_name: regLastName.trim(),
        }
      }
    })
    setRegLoading(false)
    if (error) { setRegError(error.message); return }
    setRegSuccess(true)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ color: '#1C3829', fontSize: 16 }}>Chargement...</div>
    </div>
  )

  // --- LANDING ---
  if (view === 'landing') return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'Inter, sans-serif' }}>
      <nav style={{ background: '#fff', padding: '0 40px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img src={`data:image/png;base64,${LOGO_B64}`} alt="PeakEvents" style={{ height: 44 }} />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setView('register')}
            style={{ background: '#fff', color: '#1C3829', border: '1.5px solid #1C3829', borderRadius: 8, padding: '8px 18px', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
            S's'inscrire
          </button>
          <button onClick={() => setView('login')}
            style={{ background: '#F97316', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
            Se connecter &rarr;
          </button>
        </div>
      </nav>

      <div style={{ position: 'relative', height: 520, overflow: 'hidden' }}>
        <img src="https://images.unsplash.com/photo-1551632811-561732d1e306?w=1400&q=80" alt="Trail running"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)' }} />
        <div style={{ position: 'absolute', top: '50%', left: 60, transform: 'translateY(-50%)', maxWidth: 560 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', background: '#F97316', color: '#fff', borderRadius: 20, padding: '5px 16px', fontSize: 12, fontWeight: 600, marginBottom: 20 }}>
            Événement pilotee &mdash; SwimRun du Verdon 2027
          </div>
          <h1 style={{ fontSize: 52, fontWeight: 800, color: '#fff', lineHeight: 1.1, marginBottom: 16, letterSpacing: -1 }}>
            Organisez vos<br />événements sportifs<br />outdoor
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.85)', marginBottom: 28, lineHeight: 1.6 }}>
            Centralisezz la gestion de vos bénévoles, postes et plannings.<br />Fini les fichiers Excel et les groupes WhatsApp.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => setView('login')}
              style={{ background: '#F97316', color: '#fff', border: 'none', borderRadius: 10, padding: '14px 28px', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
              Voir le tableau de bord &rarr;
            </button>
            <button onClick={() => setView('register')}
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '2px solid rgba(255,255,255,0.5)', borderRadius: 10, padding: '14px 28px', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
              Devenir bénévole
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: '72px 60px', maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: 34, fontWeight: 800, marginBottom: 8, color: '#111' }}>Tout ce dont vous avez besoin</h2>
        <p style={{ textAlign: 'center', color: '#6b7280', fontSize: 16, marginBottom: 48 }}>
          Une plateforme conçue pour simplifier l'organisation d'événements sportifs outdoor.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {[
            { svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>, title: 'Gestion des postes', desc: "Crééz et gérez les postes avec les creneaux horaires et consignes." },
            { svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, title: 'Bénévoles', desc: "Gérez votre annuaire de bénévoles et leurs compétences." },
            { svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, title: 'Planning intelligent', desc: "Visualisez le planning global par poste ou par bénévole." },
            { svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>, title: 'Affectations', desc: "Affectéz les bénévoles aux postes et suivez les postes incomplets." }
          ].map((f, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 14, padding: 24, border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ width: 48, height: 48, background: '#1C3829', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>{f.svg}</div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: '#111' }}>{f.title}</div>
              <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // --- LOGIN ---
  if (view === 'login') return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 36, width: '100%', maxWidth: 400, border: '1px solid #e5e7eb', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
        <div style={{ marginBottom: 24 }}>
          <img src={`data:image/png;base64,${LOGO_B64}`} alt="PeakEvents" style={{ height: 48 }} />
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4, color: '#111' }}>Connexion</div>
        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>Bienvenue, connectez-vous a votre compte</div>
        {loginError && <div style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 8, padding: '10px 13px', fontSize: 13, marginBottom: 12 }}>{loginError}</div>}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Email</label>
            <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} style={inputStyle} placeholder="ton@email.com" required />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Mot de passe</label>
            <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} style={inputStyle} placeholder="••••••••" required />
          </div>
          <button type="submit" style={{ width: '100%', background: '#1C3829', color: '#fff', border: 'none', borderRadius: 8, padding: '12px', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
            Se connecter
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#6b7280' }}>
          Pas encore de compte ?{' '}
          <span onClick={() => setView('register')} style={{ color: '#1C3829', fontWeight: 600, cursor: 'pointer' }}>S's'inscrire</span>
        </div>
        <button onClick={() => setView('landing')} style={{ display: 'block', textAlign: 'center', width: '100%', marginTop: 8, fontSize: 13, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
          Retour
        </button>
      </div>
    </div>
  )

  // --- REGISTER ---
  if (view === 'register') return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 36, width: '100%', maxWidth: 440, border: '1px solid #e5e7eb', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
        <div style={{ marginBottom: 24 }}>
          <img src={`data:image/png;base64,${LOGO_B64}`} alt="PeakEvents" style={{ height: 48 }} />
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4, color: '#111' }}>Créer un compte</div>
        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>Rejoignez PeakEvents en tant que bénévole</div>

        {regSuccess ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 8 }}>Compte créé !</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
              Vous pouvez maintenant vous connecter avec vos identifiants.
            </div>
            <button onClick={() => setView('login')} style={{ background: '#1C3829', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 24px', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
              Se connecter
            </button>
          </div>
        ) : (
          <>
            {regError && <div style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 8, padding: '10px 13px', fontSize: 13, marginBottom: 16 }}>{regError}</div>}
            <form onSubmit={handleRegister}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>Prénom *</label>
                  <input style={inputStyle} value={regFirstName} onChange={e => setRegFirstName(e.target.value)} placeholder="Jean" required />
                </div>
                <div>
                  <label style={labelStyle}>Nom *</label>
                  <input style={inputStyle} value={regLastName} onChange={e => setRegLastName(e.target.value)} placeholder="Dupont" required />
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Email *</label>
                <input type="email" style={inputStyle} value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="jean.dupont@email.com" required />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Mot de passe *</label>
                <input type="password" style={inputStyle} value={regPassword} onChange={e => setRegPassword(e.target.value)} placeholder="6 caractères minimum" required />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Confirmer le mot de passe *</label>
                <input type="password" style={inputStyle} value={regPassword2} onChange={e => setRegPassword2(e.target.value)} placeholder="••••••••" required />
              </div>
              <button type="submit" disabled={regLoading} style={{ width: '100%', background: '#1C3829', color: '#fff', border: 'none', borderRadius: 8, padding: '12px', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'Inter, sans-serif', opacity: regLoading ? 0.6 : 1 }}>
                {regLoading ? 'Creation...' : 'Créer mon compte'}
              </button>
            </form>
            <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#6b7280' }}>
              Déjà un compte ?{' '}
              <span onClick={() => setView('login')} style={{ color: '#1C3829', fontWeight: 600, cursor: 'pointer' }}>Se connecter</span>
            </div>
          </>
        )}
      </div>
    </div>
  )

  if (view === 'app') return <AppLayout session={session} onLogout={handleLogout} />
}
