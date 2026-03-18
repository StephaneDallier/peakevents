'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { LOGO_B64 } from '../lib/logo'
import PageEvents from './PageEvents'
import PageUsers from './PageUsers'
import PageBenevoles from './PageBenevoles'

// --- ICONES SVG ---
const Icons = {
  dashboard: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  events: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  postes: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  benevoles: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  planning: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  affectations: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  users: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  missions: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  logout: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
}

// --- SIDEBAR ---
function Sidebar({ page, setPage, profile, onLogout, activeEventName }) {
  const role = profile?.role || 'volunteer'

  const navAdmin = [
    { id: 'dashboard', label: 'Tableau de bord', icon: Icons.dashboard },
    { id: 'events', label: 'Evenements', icon: Icons.events },
    { id: 'users', label: 'Utilisateurs', icon: Icons.users },
  ]
  const navOrganizer = [
    { id: 'dashboard', label: 'Tableau de bord', icon: Icons.dashboard },
    { id: 'postes', label: 'Postes', icon: Icons.postes },
    { id: 'benevoles', label: 'Benevoles', icon: Icons.benevoles },
    { id: 'planning', label: 'Planning', icon: Icons.planning },
    { id: 'affectations', label: 'Affectations', icon: Icons.affectations },
  ]
  const navVolunteer = [
    { id: 'dashboard', label: 'Mon espace', icon: Icons.dashboard },
    { id: 'missions', label: 'Mes missions', icon: Icons.missions },
    { id: 'planning', label: 'Mon planning', icon: Icons.planning },
  ]

  const nav = role === 'admin' ? navAdmin : role === 'organizer' ? navOrganizer : navVolunteer
  const initials = ((profile?.first_name?.[0] || '') + (profile?.last_name?.[0] || '')).toUpperCase() || '?'
  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Utilisateur'

  return (
    <div style={{ width: 260, flexShrink: 0, background: '#1C3829', display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0 }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px' }}>
        <img src={`data:image/png;base64,${LOGO_B64}`} alt="PeakEvents" style={{ height: 36 }} />
      </div>

      {/* Evenement actif */}
      <div style={{ margin: '0 12px 16px', background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 12px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Evenement actif</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>{activeEventName || 'Aucun evenement'}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>14 juin 2027</div>
      </div>

      {/* Navigation */}
      <div style={{ flex: 1, padding: '0 8px', overflowY: 'auto' }}>
        {role === 'admin' && <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1, padding: '6px 8px 4px' }}>Administration</div>}
        {role === 'organizer' && <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1, padding: '6px 8px 4px' }}>Organisation</div>}
        {role === 'volunteer' && <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1, padding: '6px 8px 4px' }}>Mon espace</div>}
        {nav.map(item => (
          <button key={item.id} onClick={() => setPage(item.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 10px',
              borderRadius: 8, border: 'none', cursor: 'pointer', textAlign: 'left',
              background: page === item.id ? 'rgba(255,255,255,0.15)' : 'transparent',
              color: page === item.id ? '#fff' : 'rgba(255,255,255,0.65)',
              fontFamily: 'Inter, sans-serif', fontSize: 14,
              fontWeight: page === item.id ? 600 : 400,
              transition: 'all 0.15s', marginBottom: 2,
            }}>
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      {/* Avatar + logout */}
      <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#F97316', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, color: '#fff', flexShrink: 0 }}>
            {initials}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{fullName}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', textTransform: 'capitalize' }}>{role}</div>
          </div>
        </div>
        <button onClick={onLogout}
          style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px', borderRadius: 8, border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, sans-serif', fontSize: 13, cursor: 'pointer' }}>
          {Icons.logout} Se deconnecter
        </button>
      </div>
    </div>
  )
}

// --- STAT CARD ---
function StatCard({ label, value, hint, color }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', border: '1px solid #e5e7eb' }}>
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 800, color: color || '#111', lineHeight: 1, marginBottom: 4 }}>{value}</div>
      {hint && <div style={{ fontSize: 12, color: '#9ca3af' }}>{hint}</div>}
    </div>
  )
}

// --- DASHBOARD ADMIN ---
function DashboardAdmin() {
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', marginBottom: 4 }}>Tableau de bord</h1>
        <p style={{ fontSize: 14, color: '#6b7280' }}>Vue d'ensemble de la plateforme</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard label="Evenements actifs" value="1" hint="SwimRun Verdon 2027" color="#1C3829" />
        <StatCard label="Benevoles inscrits" value="0" hint="Sur l'evenement actif" />
        <StatCard label="Postes crees" value="0" hint="Tous evenements" />
        <StatCard label="Utilisateurs" value="3" hint="dont 1 admin" />
      </div>
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 16 }}>Evenements recents</div>
        <div style={{ background: '#f9fafb', borderRadius: 8, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#111' }}>SwimRun du Verdon</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>14 juin 2027 &middot; Verdon, France</div>
          </div>
          <div style={{ background: '#dcfce7', color: '#16a34a', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 600 }}>Actif</div>
        </div>
      </div>
    </div>
  )
}

// --- DASHBOARD ORGANIZER ---
function DashboardOrganizer({ profile }) {
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', marginBottom: 4 }}>
          Bonjour {profile?.first_name || 'Organisateur'} !
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280' }}>SwimRun du Verdon &mdash; 14 juin 2027</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard label="Postes crees" value="0" hint="Creez votre premier poste" color="#1C3829" />
        <StatCard label="Creneaux definis" value="0" hint="-" />
        <StatCard label="Benevoles affectes" value="0" hint="-" />
        <StatCard label="Postes incomplets" value="0" hint="Tout est bon !" color="#16a34a" />
      </div>
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 8 }}>Prochaines etapes</div>
        {[
          { num: 1, text: 'Creez vos postes (ravitaillement, securite, accueil...)' },
          { num: 2, text: 'Definissez les creneaux horaires et le nombre de benevoles' },
          { num: 3, text: 'Invitez vos benevoles sur la plateforme' },
          { num: 4, text: 'Affectez les benevoles aux postes' },
        ].map(s => (
          <div key={s.num} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#1C3829', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{s.num}</div>
            <div style={{ fontSize: 14, color: '#374151', paddingTop: 3 }}>{s.text}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// --- DASHBOARD VOLUNTEER ---
function DashboardVolunteer({ profile }) {
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', marginBottom: 4 }}>
          Bonjour {profile?.first_name || 'Benevole'} !
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280' }}>Votre espace benevole &mdash; SwimRun du Verdon 2027</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard label="Mes missions" value="0" hint="Aucune affectation pour l'instant" />
        <StatCard label="Prochain evenement" value="14 juin" hint="SwimRun du Verdon 2027" color="#1C3829" />
        <StatCard label="Statut" value="Inscrit" hint="Bienvenue !" color="#16a34a" />
      </div>
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 12 }}>Mes affectations</div>
        <div style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af', fontSize: 14 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
          Aucune affectation pour le moment.<br />L'organisateur vous contactera prochainement.
        </div>
      </div>
    </div>
  )
}

// --- PAGE PLACEHOLDER ---
function PagePlaceholder({ title }) {
  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', marginBottom: 4 }}>{title}</h1>
      <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 28 }}>Cette page est en cours de developpement.</p>
      <div style={{ background: '#fff', borderRadius: 12, border: '2px dashed #e5e7eb', padding: 48, textAlign: 'center', color: '#9ca3af' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🚧</div>
        <div style={{ fontSize: 15, fontWeight: 600 }}>A venir</div>
      </div>
    </div>
  )
}

// --- APP LAYOUT PRINCIPAL ---
export default function AppLayout({ session, onLogout }) {
  const [profile, setProfile] = useState(null)
  const [page, setPage] = useState('dashboard')
  const [activeEventId, setActiveEventId] = useState(null)
  const [activeEventName, setActiveEventName] = useState('SwimRun du Verdon')

  useEffect(() => {
    if (session?.user?.id) {
      supabase.from('profiles').select('*').eq('id', session.user.id).single()
        .then(({ data }) => { if (data) setProfile(data) })
    }
  }, [session])

  const role = profile?.role || 'volunteer'

  function renderPage() {
    if (page === 'dashboard') {
      if (role === 'admin') return <DashboardAdmin />
      if (role === 'organizer') return <DashboardOrganizer profile={profile} />
      return <DashboardVolunteer profile={profile} />
    }
    if (page === 'events') return <PageEvents profile={profile} onSetActiveEvent={(id, name) => { setActiveEventId(id); setActiveEventName(name) }} />
    if (page === 'users') return <PageUsers profile={profile} activeEventId={activeEventId} />
    if (page === 'benevoles') return <PageBenevoles profile={profile} activeEventId={activeEventId} activeEventName={activeEventName} />
    const titles = {
      events: 'Evenements',
      users: 'Utilisateurs',
      postes: 'Postes',
      benevoles: 'Benevoles',
      planning: 'Planning',
      affectations: 'Affectations',
      missions: 'Mes missions',
    }
    return <PagePlaceholder title={titles[page] || page} />
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f9fafb', fontFamily: 'Inter, sans-serif' }}>
      <Sidebar page={page} setPage={setPage} profile={profile} onLogout={onLogout} activeEventName={activeEventName} />
      <main style={{ flex: 1, padding: '32px 40px', overflowY: 'auto' }}>
        {renderPage()}
      </main>
    </div>
  )
}
