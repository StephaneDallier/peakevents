'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { LOGO_B64 } from '../lib/logo'
import PageEvents from './PageEvents'
import PageUsers from './PageUsers'
import PageBenevoles from './PageBenevoles'
import PagePostes from './PagePostes'
import PageAffectations from './PageAffectations'
import PagePlanning from './PagePlanning'
import PageMissions from './PageMissions'

const Icons = {
  dashboard: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  events: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  postes: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  benevoles: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  planning: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  affectations: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  users: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  missions: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  admin: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 1.41 14.14M4.93 4.93A10 10 0 0 0 3.52 19.07"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>,
  logout: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  menu: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  close: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
}

function NavSection({ label }) {
  return <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1, padding: '12px 8px 4px' }}>{label}</div>
}

function NavItem({ item, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 10px',
      borderRadius: 8, border: 'none', cursor: 'pointer', textAlign: 'left',
      background: active ? 'rgba(255,255,255,0.15)' : 'transparent',
      color: active ? '#fff' : 'rgba(255,255,255,0.65)',
      fontFamily: 'Inter, sans-serif', fontSize: 14,
      fontWeight: active ? 600 : 400,
      transition: 'all 0.15s', marginBottom: 2,
    }}>
      {item.icon}{item.label}
    </button>
  )
}

function SidebarContent({ page, setPage, profile, onLogout, activeEventName, onClose }) {
  const role = profile?.role || 'volunteer'
  const initials = ((profile?.first_name?.[0] || '') + (profile?.last_name?.[0] || '')).toUpperCase() || '?'
  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Utilisateur'

  function nav(id) { setPage(id); onClose && onClose() }

  return (
    <div style={{ width: '100%', background: '#1C3829', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '20px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <img src={`data:image/png;base64,${LOGO_B64}`} alt="PeakEvents" style={{ height: 36 }} />
        {onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', padding: 4 }}>
            {Icons.close}
          </button>
        )}
      </div>

      <div style={{ margin: '0 12px 16px', background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 12px', cursor: role !== 'volunteer' ? 'pointer' : 'default' }}
        onClick={() => role !== 'volunteer' && nav('events')}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Événement actif</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>{activeEventName || 'Aucun événement'}</div>
        {role !== 'volunteer' && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>Cliquer pour changer</div>}
      </div>

      <div style={{ flex: 1, padding: '0 8px', overflowY: 'auto' }}>
        {role === 'admin' && (<>
          <NavSection label="Administration" />
          <NavItem item={{ id: 'dashboard', label: 'Tableau de bord', icon: Icons.dashboard }} active={page === 'dashboard'} onClick={() => nav('dashboard')} />
          <NavItem item={{ id: 'admin', label: 'Administration', icon: Icons.admin }} active={page === 'admin'} onClick={() => nav('admin')} />
          <NavItem item={{ id: 'events', label: 'Événements', icon: Icons.events }} active={page === 'events'} onClick={() => nav('events')} />
          <NavItem item={{ id: 'users', label: 'Utilisateurs', icon: Icons.users }} active={page === 'users'} onClick={() => nav('users')} />
          <NavSection label="Événement actif" />
          <NavItem item={{ id: 'postes', label: 'Postes', icon: Icons.postes }} active={page === 'postes'} onClick={() => nav('postes')} />
          <NavItem item={{ id: 'benevoles', label: 'Bénévoles', icon: Icons.benevoles }} active={page === 'benevoles'} onClick={() => nav('benevoles')} />
          <NavItem item={{ id: 'affectations', label: 'Affectations', icon: Icons.affectations }} active={page === 'affectations'} onClick={() => nav('affectations')} />
          <NavItem item={{ id: 'planning', label: 'Planning', icon: Icons.planning }} active={page === 'planning'} onClick={() => nav('planning')} />
        </>)}
        {role === 'organizer' && (<>
          <NavSection label="Mon espace" />
          <NavItem item={{ id: 'dashboard', label: 'Tableau de bord', icon: Icons.dashboard }} active={page === 'dashboard'} onClick={() => nav('dashboard')} />
          <NavItem item={{ id: 'events', label: 'Mes événements', icon: Icons.events }} active={page === 'events'} onClick={() => nav('events')} />
          <NavSection label="Événement actif" />
          <NavItem item={{ id: 'postes', label: 'Postes', icon: Icons.postes }} active={page === 'postes'} onClick={() => nav('postes')} />
          <NavItem item={{ id: 'benevoles', label: 'Bénévoles', icon: Icons.benevoles }} active={page === 'benevoles'} onClick={() => nav('benevoles')} />
          <NavItem item={{ id: 'affectations', label: 'Affectations', icon: Icons.affectations }} active={page === 'affectations'} onClick={() => nav('affectations')} />
          <NavItem item={{ id: 'planning', label: 'Planning', icon: Icons.planning }} active={page === 'planning'} onClick={() => nav('planning')} />
          <NavSection label="Équipe" />
          <NavItem item={{ id: 'users', label: 'Mes bénévoles', icon: Icons.users }} active={page === 'users'} onClick={() => nav('users')} />
        </>)}
        {role === 'volunteer' && (<>
          <NavSection label="Mon espace" />
          <NavItem item={{ id: 'dashboard', label: 'Accueil', icon: Icons.dashboard }} active={page === 'dashboard'} onClick={() => nav('dashboard')} />
          <NavItem item={{ id: 'missions', label: 'Mes missions', icon: Icons.missions }} active={page === 'missions'} onClick={() => nav('missions')} />
          <NavItem item={{ id: 'planning', label: 'Mon planning', icon: Icons.planning }} active={page === 'planning'} onClick={() => nav('planning')} />
        </>)}
      </div>

      <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#F97316', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, color: '#fff', flexShrink: 0 }}>
            {initials}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{fullName}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', textTransform: 'capitalize' }}>
              {role === 'admin' ? 'Administrateur' : role === 'organizer' ? 'Organisateur' : 'Bénévole'}
            </div>
          </div>
        </div>
        <button onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px', borderRadius: 8, border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, sans-serif', fontSize: 13, cursor: 'pointer' }}>
          {Icons.logout} Se déconnecter
        </button>
      </div>
    </div>
  )
}

function StatCard({ label, value, hint, color, onClick }) {
  return (
    <div onClick={onClick} style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', border: '1px solid #e5e7eb', cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 800, color: color || '#111', lineHeight: 1, marginBottom: 4 }}>{value}</div>
      {hint && <div style={{ fontSize: 12, color: '#9ca3af' }}>{hint}</div>}
    </div>
  )
}

function DashboardAdmin({ setPage, stats }) {
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', marginBottom: 4 }}>Tableau de bord</h1>
        <p style={{ fontSize: 14, color: '#6b7280' }}>Vue d'ensemble de la plateforme</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }}>
        <StatCard label="Événements" value={stats.events} hint="sur la plateforme" color="#1C3829" onClick={() => setPage('events')} />
        <StatCard label="Utilisateurs" value={stats.users} hint="comptes actifs" onClick={() => setPage('users')} />
        <StatCard label="Postes" value={stats.postes} hint="événement actif" onClick={() => setPage('postes')} />
        <StatCard label="Bénévoles" value={stats.benevoles} hint="événement actif" onClick={() => setPage('benevoles')} />
      </div>
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 12 }}>Accès rapides</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
          {[
            { label: 'Administration', page: 'admin', icon: '⚙️' },
            { label: 'Événements', page: 'events', icon: '📅' },
            { label: 'Utilisateurs', page: 'users', icon: '👥' },
            { label: 'Postes', page: 'postes', icon: '📍' },
            { label: 'Affectations', page: 'affectations', icon: '✅' },
            { label: 'Planning', page: 'planning', icon: '📊' },
          ].map(a => (
            <button key={a.page} onClick={() => setPage(a.page)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#374151', fontWeight: 500, textAlign: 'left' }}>
              <span>{a.icon}</span>{a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function PageAdmin({ setPage }) {
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', marginBottom: 4 }}>Administration</h1>
        <p style={{ fontSize: 14, color: '#6b7280' }}>Gestion complète de la plateforme PeakEvents</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {[
          { icon: '📅', title: 'Événements', desc: "Créer, modifier et archiver les événements. Affecter des organisateurs.", page: 'events', color: '#1C3829' },
          { icon: '👥', title: 'Utilisateurs', desc: "Gérer les comptes, rôles, invitations et réinitialisations.", page: 'users', color: '#2563eb' },
          { icon: '📍', title: 'Postes', desc: "Créer et gérer les postes avec créneaux horaires.", page: 'postes', color: '#7c3aed' },
          { icon: '👤', title: 'Bénévoles', desc: "Annuaire des bénévoles inscrits sur l'événement actif.", page: 'benevoles', color: '#0891b2' },
          { icon: '✅', title: 'Affectations', desc: "Affecter les bénévoles aux postes.", page: 'affectations', color: '#16a34a' },
          { icon: '📊', title: 'Planning', desc: "Vue Gantt globale de tous les créneaux.", page: 'planning', color: '#f97316' },
        ].map(item => (
          <div key={item.page} onClick={() => setPage(item.page)}
            style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: 24, cursor: 'pointer' }}>
            <div style={{ width: 48, height: 48, background: item.color, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 14 }}>{item.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#111', marginBottom: 6 }}>{item.title}</div>
            <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>{item.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DashboardOrganizer({ profile, setPage }) {
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', marginBottom: 4 }}>Bonjour {profile?.first_name || 'Organisateur'} !</h1>
        <p style={{ fontSize: 14, color: '#6b7280' }}>Bienvenue sur votre espace organisateur</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
        {[
          { icon: '📅', title: 'Mes événements', page: 'events' },
          { icon: '📍', title: 'Postes', page: 'postes' },
          { icon: '👥', title: 'Bénévoles', page: 'benevoles' },
          { icon: '✅', title: 'Affectations', page: 'affectations' },
          { icon: '📊', title: 'Planning', page: 'planning' },
          { icon: '👤', title: 'Mon équipe', page: 'users' },
        ].map(item => (
          <button key={item.page} onClick={() => setPage(item.page)}
            style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 16px', cursor: 'pointer', textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#111' }}>{item.title}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

function DashboardVolunteer({ profile }) {
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', marginBottom: 4 }}>Bonjour {profile?.first_name || 'Bénévole'} !</h1>
        <p style={{ fontSize: 14, color: '#6b7280' }}>Bienvenue sur votre espace bénévole</p>
      </div>
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
        <div style={{ fontWeight: 600, fontSize: 15, color: '#374151', marginBottom: 8 }}>Consultez vos missions</div>
        <div style={{ fontSize: 13, color: '#9ca3af' }}>Utilisez le menu pour accéder à vos missions et votre planning.</div>
      </div>
    </div>
  )
}

export default function AppLayout({ session, onLogout }) {
  const [profile, setProfile] = useState(null)
  const [page, setPage] = useState('dashboard')
  const [activeEventId, setActiveEventId] = useState(null)
  const [activeEventName, setActiveEventName] = useState(null)
  const [stats, setStats] = useState({ events: 0, users: 0, postes: 0, benevoles: 0 })
  const [menuOpen, setMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    function checkMobile() { setIsMobile(window.innerWidth < 768) }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (session?.user?.id) {
      supabase.from('profiles').select('*').eq('id', session.user.id).single()
        .then(({ data }) => { if (data) setProfile(data) })
    }
  }, [session])

  useEffect(() => {
    supabase.from('events').select('id, name').neq('status', 'archived').order('start_date').limit(1)
      .then(({ data }) => { if (data?.[0]) { setActiveEventId(data[0].id); setActiveEventName(data[0].name) } })
    Promise.all([
      supabase.from('events').select('id', { count: 'exact' }),
      supabase.from('profiles').select('id', { count: 'exact' }),
    ]).then(([evts, users]) => setStats(s => ({ ...s, events: evts.count || 0, users: users.count || 0 })))
  }, [])

  useEffect(() => {
    if (activeEventId) {
      Promise.all([
        supabase.from('positions').select('id', { count: 'exact' }).eq('event_id', activeEventId),
        supabase.from('event_volunteers').select('id', { count: 'exact' }).eq('event_id', activeEventId),
      ]).then(([postes, bens]) => setStats(s => ({ ...s, postes: postes.count || 0, benevoles: bens.count || 0 })))
    }
  }, [activeEventId])

  // Fermer le menu quand on change de page sur mobile
  function handleSetPage(p) { setPage(p); setMenuOpen(false) }

  const role = profile?.role || 'volunteer'

  function renderPage() {
    if (page === 'dashboard') {
      if (role === 'admin') return <DashboardAdmin setPage={handleSetPage} stats={stats} />
      if (role === 'organizer') return <DashboardOrganizer profile={profile} setPage={handleSetPage} />
      return <DashboardVolunteer profile={profile} />
    }
    if (page === 'admin') return <PageAdmin setPage={handleSetPage} />
    if (page === 'events') return <PageEvents profile={profile} onSetActiveEvent={(id, name) => { setActiveEventId(id); setActiveEventName(name) }} />
    if (page === 'users') return <PageUsers profile={profile} activeEventId={activeEventId} />
    if (page === 'benevoles') return <PageBenevoles profile={profile} activeEventId={activeEventId} activeEventName={activeEventName} />
    if (page === 'postes') return <PagePostes profile={profile} activeEventId={activeEventId} activeEventName={activeEventName} />
    if (page === 'affectations') return <PageAffectations profile={profile} activeEventId={activeEventId} activeEventName={activeEventName} />
    if (page === 'planning') return <PagePlanning profile={profile} activeEventId={activeEventId} activeEventName={activeEventName} />
    if (page === 'missions') return <PageMissions profile={profile} />
    return null
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f9fafb', fontFamily: 'Inter, sans-serif' }}>

      {/* SIDEBAR DESKTOP */}
      {!isMobile && (
        <div style={{ width: 260, flexShrink: 0, height: '100vh', position: 'sticky', top: 0 }}>
          <SidebarContent page={page} setPage={handleSetPage} profile={profile} onLogout={onLogout} activeEventName={activeEventName} />
        </div>
      )}

      {/* OVERLAY MOBILE */}
      {isMobile && menuOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={() => setMenuOpen(false)} />
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 280 }}>
            <SidebarContent page={page} setPage={handleSetPage} profile={profile} onLogout={onLogout} activeEventName={activeEventName} onClose={() => setMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* MAIN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* TOPBAR MOBILE */}
        {isMobile && (
          <div style={{ background: '#1C3829', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
            <img src={`data:image/png;base64,${LOGO_B64}`} alt="PeakEvents" style={{ height: 30 }} />
            <button onClick={() => setMenuOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', padding: 4 }}>
              {Icons.menu}
            </button>
          </div>
        )}

        <main style={{ flex: 1, padding: isMobile ? '20px 16px' : '32px 40px', overflowY: 'auto' }}>
          {renderPage()}
        </main>
      </div>
    </div>
  )
}
