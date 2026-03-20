'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { LOGO_B64 } from '../lib/logo'
import AppLayout from './AppLayout'

const inputStyle = { width: '100%', padding: '10px 13px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box', color: '#111' }
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function SportBadge({ sport }) {
  if (!sport) return null
  const colors = {
    Trail: ['#dcfce7','#16a34a'], Triathlon: ['#dbeafe','#2563eb'], SwimRun: ['#e0f2fe','#0284c7'],
    Running: ['#fef9c3','#ca8a04'], Gravel: ['#f3e8ff','#9333ea'], Cyclisme: ['#fce7f3','#db2777'],
    Natation: ['#e0f2fe','#0891b2'], Autre: ['#f3f4f6','#6b7280']
  }
  const [bg, fg] = colors[sport] || colors['Autre']
  return <span style={{ background: bg, color: fg, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{sport}</span>
}

function EventCard({ ev, onParticiper }) {
  const sportEmoji = { Trail: '🏔️', Triathlon: '🏊', SwimRun: '🌊', Running: '🏃', Gravel: '🚴', Cyclisme: '🚵', Natation: '🏊', Autre: '🎯' }
  return (
    <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'relative', height: 160, overflow: 'hidden' }}>
        {ev.poster_url ? (
          <img src={ev.poster_url} alt={ev.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1C3829 0%, #2D5A3D 60%, #F97316 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 56 }}>{sportEmoji[ev.sport] || '🎯'}</span>
          </div>
        )}
        {ev.sport && (
          <div style={{ position: 'absolute', top: 10, left: 10 }}><SportBadge sport={ev.sport} /></div>
        )}
      </div>
      <div style={{ padding: '16px 18px', flex: 1 }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: '#111', marginBottom: 6 }}>{ev.name}</div>
        <div style={{ display: 'flex', gap: 10, fontSize: 12, color: '#6b7280', marginBottom: 10, flexWrap: 'wrap' }}>
          {ev.start_date && <span>📅 {formatDate(ev.start_date)}</span>}
          {ev.location && <span>📍 {ev.location}</span>}
        </div>
        {(ev.distance || ev.elevation) && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            {ev.distance && <span style={{ background: '#f0fdf4', color: '#1C3829', borderRadius: 8, padding: '4px 8px', fontSize: 11, fontWeight: 700 }}>{ev.distance} km</span>}
            {ev.elevation && <span style={{ background: '#fff7ed', color: '#ea580c', borderRadius: 8, padding: '4px 8px', fontSize: 11, fontWeight: 700 }}>D+ {ev.elevation} m</span>}
          </div>
        )}
        {ev.description && (
          <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0 }}>{ev.description}</p>
        )}
      </div>
      <div style={{ padding: '12px 18px', borderTop: '1px solid #f3f4f6' }}>
        <button onClick={() => onParticiper(ev)}
          style={{ width: '100%', background: '#1C3829', color: '#fff', border: 'none', borderRadius: 8, padding: '11px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
          🙋 Je veux participer
        </button>
      </div>
    </div>
  )
}

export default function Home() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('landing')
  const [publicEvents, setPublicEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)

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
    // Charger événements publics sans authentification
    supabase.from('events').select('*').eq('status', 'published').order('start_date')
      .then(({ data }) => setPublicEvents(data || []))
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
      email: regEmail, password: regPassword,
      options: { data: { first_name: regFirstName.trim(), last_name: regLastName.trim() } }
    })
    setRegLoading(false)
    if (error) { setRegError(error.message); return }
    setRegSuccess(true)
  }

  async function handleLogout() { await supabase.auth.signOut() }

  // Quand un visiteur clique "Je veux participer" sur un événement public
  function handleParticiper(ev) {
    setSelectedEvent(ev)
    setView('register')
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ color: '#1C3829', fontSize: 16 }}>Chargement...</div>
    </div>
  )

  // --- APP ---
  if (view === 'app') return <AppLayout session={session} onLogout={handleLogout} />

  // --- LOGIN ---
  if (view === 'login') return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 36, width: '100%', maxWidth: 400, border: '1px solid #e5e7eb', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
        <div style={{ marginBottom: 24 }}>
          <img src={`data:image/png;base64,${LOGO_B64}`} alt="PeakEvents" style={{ height: 48 }} />
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4, color: '#111' }}>Connexion</div>
        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>Bienvenue, connectez-vous à votre compte</div>
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
          <span onClick={() => setView('register')} style={{ color: '#1C3829', fontWeight: 600, cursor: 'pointer' }}>S'inscrire</span>
        </div>
        <button onClick={() => setView('landing')} style={{ display: 'block', textAlign: 'center', width: '100%', marginTop: 8, fontSize: 13, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
          ← Retour à l'accueil
        </button>
      </div>
    </div>
  )

  // --- REGISTER ---
  if (view === 'register') return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 36, width: '100%', maxWidth: 440, border: '1px solid #e5e7eb', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
        <div style={{ marginBottom: 20 }}>
          <img src={`data:image/png;base64,${LOGO_B64}`} alt="PeakEvents" style={{ height: 40 }} />
        </div>
        {selectedEvent && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>🎯</span>
            <div>
              <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>Vous souhaitez participer à</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{selectedEvent.name}</div>
            </div>
          </div>
        )}
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4, color: '#111' }}>Créer un compte</div>
        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>Rejoignez PeakEvents en tant que bénévole</div>
        {regSuccess ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 8 }}>Compte créé !</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>Vous pouvez maintenant vous connecter.</div>
            <button onClick={() => setView('login')} style={{ background: '#1C3829', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 24px', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
              Se connecter
            </button>
          </div>
        ) : (
          <>
            {regError && <div style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 8, padding: '10px 13px', fontSize: 13, marginBottom: 14 }}>{regError}</div>}
            <form onSubmit={handleRegister}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>Prénom *</label>
                  <input style={inputStyle} value={regFirstName} onChange={e => setRegFirstName(e.target.value)} placeholder="Jean" required />
                </div>
                <div>
                  <label style={labelStyle}>Nom *</label>
                  <input style={inputStyle} value={regLastName} onChange={e => setRegLastName(e.target.value)} placeholder="Dupont" required />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Email *</label>
                <input type="email" style={inputStyle} value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="jean.dupont@email.com" required />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Mot de passe *</label>
                <input type="password" style={inputStyle} value={regPassword} onChange={e => setRegPassword(e.target.value)} placeholder="6 caractères minimum" required />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>Confirmer le mot de passe *</label>
                <input type="password" style={inputStyle} value={regPassword2} onChange={e => setRegPassword2(e.target.value)} placeholder="••••••••" required />
              </div>
              <button type="submit" disabled={regLoading} style={{ width: '100%', background: '#1C3829', color: '#fff', border: 'none', borderRadius: 8, padding: '12px', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'Inter, sans-serif', opacity: regLoading ? 0.6 : 1 }}>
                {regLoading ? 'Création...' : 'Créer mon compte'}
              </button>
            </form>
            <div style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: '#6b7280' }}>
              Déjà un compte ?{' '}
              <span onClick={() => setView('login')} style={{ color: '#1C3829', fontWeight: 600, cursor: 'pointer' }}>Se connecter</span>
            </div>
            <button onClick={() => { setView('landing'); setSelectedEvent(null) }} style={{ display: 'block', textAlign: 'center', width: '100%', marginTop: 6, fontSize: 13, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
              ← Retour à l'accueil
            </button>
          </>
        )}
      </div>
    </div>
  )

  // --- LANDING ---
  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'Inter, sans-serif' }}>
      {/* Navbar */}
      <nav style={{ background: '#fff', padding: '0 40px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 50 }}>
        <img src={`data:image/png;base64,${LOGO_B64}`} alt="PeakEvents" style={{ height: 44 }} />
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={() => setView('login')}
            style={{ background: 'none', color: '#374151', border: 'none', padding: '8px 14px', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
            Se connecter
          </button>
          <button onClick={() => { setSelectedEvent(null); setView('register') }}
            style={{ background: '#1C3829', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
            Devenir bénévole →
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ position: 'relative', height: 'clamp(320px, 55vw, 500px)', overflow: 'hidden' }}>
        <img src="https://images.unsplash.com/photo-1551632811-561732d1e306?w=1400&q=80" alt="Trail running"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)' }} />
        <div style={{ position: 'absolute', top: '50%', left: 'clamp(16px, 4vw, 60px)', transform: 'translateY(-50%)', maxWidth: 'min(560px, 90vw)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', background: '#F97316', color: '#fff', borderRadius: 20, padding: '5px 16px', fontSize: 12, fontWeight: 600, marginBottom: 16 }}>
            Événement pilote — SwimRun du Verdon 2027
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 800, color: '#fff', lineHeight: 1.1, marginBottom: 14, letterSpacing: -1 }}>
            Organisez vos événements<br />sportifs outdoor
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.85)', marginBottom: 24, lineHeight: 1.6 }}>
            Centralisez la gestion de vos bénévoles, postes et plannings.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => setView('login')}
              style={{ background: '#F97316', color: '#fff', border: 'none', borderRadius: 10, padding: '13px 26px', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
              Tableau de bord →
            </button>
            <button onClick={() => { setSelectedEvent(null); setView('register') }}
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '2px solid rgba(255,255,255,0.5)', borderRadius: 10, padding: '13px 26px', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
              Devenir bénévole
            </button>
          </div>
        </div>
      </div>

      {/* Événements publics */}
      {publicEvents.length > 0 && (
        <div style={{ padding: 'clamp(32px, 5vw, 64px) clamp(16px, 4vw, 60px)', maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: '#111', marginBottom: 8 }}>Événements à venir</h2>
            <p style={{ fontSize: 16, color: '#6b7280' }}>Ces événements recherchent des bénévoles. Rejoignez l'aventure !</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20, marginBottom: 32 }}>
            {publicEvents.map(ev => (
              <EventCard key={ev.id} ev={ev} onParticiper={handleParticiper} />
            ))}
          </div>
          <div style={{ textAlign: 'center' }}>
            <button onClick={() => { setSelectedEvent(null); setView('register') }}
              style={{ background: '#1C3829', color: '#fff', border: 'none', borderRadius: 10, padding: '13px 32px', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
              Créer mon compte bénévole →
            </button>
          </div>
        </div>
      )}

      {/* Features */}
      <div style={{ padding: 'clamp(32px, 5vw, 64px) clamp(16px, 4vw, 60px)', maxWidth: 1200, margin: '0 auto', background: publicEvents.length > 0 ? '#fff' : undefined, borderTop: publicEvents.length > 0 ? '1px solid #f3f4f6' : undefined }}>
        <h2 style={{ textAlign: 'center', fontSize: 30, fontWeight: 800, marginBottom: 8, color: '#111' }}>Tout ce dont vous avez besoin</h2>
        <p style={{ textAlign: 'center', color: '#6b7280', fontSize: 15, marginBottom: 40 }}>Une plateforme conçue pour les événements sportifs outdoor.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {[
            { icon: '📍', title: 'Gestion des postes', desc: 'Créez et gérez les postes avec créneaux horaires et consignes.' },
            { icon: '👥', title: 'Bénévoles', desc: 'Gérez votre annuaire de bénévoles et leurs compétences.' },
            { icon: '📊', title: 'Planning Gantt', desc: 'Visualisez le planning global par poste en temps réel.' },
            { icon: '✅', title: 'Affectations', desc: 'Affectez les bénévoles aux postes et suivez le remplissage.' },
            { icon: '📋', title: 'Mode projet', desc: 'Gérez vos tâches et jalons en vue Kanban ou Timeline.' },
            { icon: '🏔️', title: 'Trail & SwimRun', desc: 'Conçu pour les événements outdoor : trail, triathlon, SwimRun.' },
          ].map((f, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 14, padding: 20, border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: '#111' }}>{f.title}</div>
              <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ background: '#1C3829', padding: '24px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <img src={`data:image/png;base64,${LOGO_B64}`} alt="PeakEvents" style={{ height: 32 }} />
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>© 2026 PeakEvents — Tous droits réservés</div>
        <button onClick={() => setView('login')} style={{ background: 'none', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, padding: '8px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
          Connexion
        </button>
      </div>
    </div>
  )
}
