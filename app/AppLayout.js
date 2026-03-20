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
import PageCatalogue from './PageCatalogue'
import PageProfil from './PageProfil'
import PageProjet from './PageProjet'
import PageEventDetail from './PageEventDetail'

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
  projet: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>,
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
          <NavItem item={{ id: 'events', label: 'Événements', icon: Icons.events }} active={page === 'events'} onClick={() => nav('events')} />
          <NavSection label="Événement actif" />
          <NavItem item={{ id: 'postes', label: 'Postes', icon: Icons.postes }} active={page === 'postes'} onClick={() => nav('postes')} />
          <NavItem item={{ id: 'benevoles', label: 'Bénévoles', icon: Icons.benevoles }} active={page === 'benevoles'} onClick={() => nav('benevoles')} />
          <NavItem item={{ id: 'affectations', label: 'Affectations', icon: Icons.affectations }} active={page === 'affectations'} onClick={() => nav('affectations')} />
          <NavItem item={{ id: 'planning', label: 'Planning', icon: Icons.planning }} active={page === 'planning'} onClick={() => nav('planning')} />
          <NavItem item={{ id: 'projet', label: 'Projet', icon: Icons.projet }} active={page === 'projet'} onClick={() => nav('projet')} />
          <NavSection label="Équipe" />
          <NavItem item={{ id: 'users', label: 'Mes bénévoles', icon: Icons.users }} active={page === 'users'} onClick={() => nav('users')} />
        </>)}
        {role === 'volunteer' && (<>
          <NavSection label="Mon espace" />
          <NavItem item={{ id: 'dashboard', label: 'Accueil', icon: Icons.dashboard }} active={page === 'dashboard'} onClick={() => nav('dashboard')} />
          <NavItem item={{ id: 'catalogue', label: 'Les événements', icon: Icons.catalogue }} active={page === 'catalogue'} onClick={() => nav('catalogue')} />
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

function DashboardAdmin({ setPage, stats, activeEventName }) {
  const remplissage = stats.postes > 0 ? Math.round((stats.affectations / (stats.postes * 2)) * 100) : 0
  const remplissagePct = Math.min(remplissage, 100)
  const remplissageColor = remplissagePct >= 80 ? '#16a34a' : remplissagePct >= 40 ? '#F97316' : '#dc2626'

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', marginBottom: 4 }}>Tableau de bord</h1>
        <p style={{ fontSize: 14, color: '#6b7280' }}>Vue d'ensemble &mdash; <strong style={{ color: '#1C3829' }}>{activeEventName || 'aucun événement actif'}</strong></p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Événements" value={stats.events} hint="sur la plateforme" color="#1C3829" onClick={() => setPage('events')} />
        <StatCard label="Utilisateurs" value={stats.users} hint="comptes enregistrés" onClick={() => setPage('users')} />
        <StatCard label="Postes" value={stats.postes} hint="événement actif" color="#7c3aed" onClick={() => setPage('postes')} />
        <StatCard label="Bénévoles" value={stats.benevoles} hint="inscrits sur l'événement" color="#0891b2" onClick={() => setPage('benevoles')} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Remplissage */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 16 }}>Remplissage des postes</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ flex: 1, height: 10, background: '#f3f4f6', borderRadius: 5, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${remplissagePct}%`, background: remplissageColor, borderRadius: 5, transition: 'width 0.5s' }} />
            </div>
            <span style={{ fontSize: 18, fontWeight: 800, color: remplissageColor, minWidth: 45 }}>{remplissagePct}%</span>
          </div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>{stats.affectations} affectations sur {stats.postes} postes</div>
        </div>

        {/* Événements récents */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 12 }}>Répartition des rôles</div>
          {[
            { label: 'Administrateurs', value: stats.admins || 0, color: '#1C3829' },
            { label: 'Organisateurs', value: stats.organizers || 0, color: '#2563eb' },
            { label: 'Bénévoles', value: stats.volunteers || 0, color: '#0891b2' },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: r.color }} />
                <span style={{ fontSize: 13, color: '#374151' }}>{r.label}</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Accès rapides */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 12 }}>Accès rapides</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
          {[
            { label: 'Administration', page: 'admin', icon: '⚙️' },
            { label: 'Événements', page: 'events', icon: '📅' },
            { label: 'Utilisateurs', page: 'users', icon: '👥' },
            { label: 'Postes', page: 'postes', icon: '📍' },
            { label: 'Affectations', page: 'affectations', icon: '✅' },
            { label: 'Planning', page: 'planning', icon: '📊' },
          ].map(a => (
            <button key={a.page} onClick={() => setPage(a.page)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#374151', fontWeight: 500, textAlign: 'left' }}>
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

function DashboardOrganizer({ profile, setPage, stats, activeEventName }) {
  const remplissagePct = stats.postes > 0 ? Math.min(Math.round((stats.affectations / (stats.postes * 2)) * 100), 100) : 0
  const remplissageColor = remplissagePct >= 80 ? '#16a34a' : remplissagePct >= 40 ? '#F97316' : '#dc2626'

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', marginBottom: 4 }}>
          Bonjour {profile?.first_name || 'Organisateur'} !
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280' }}>
          Événement actif : <strong style={{ color: '#1C3829' }}>{activeEventName || 'aucun'}</strong>
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Postes" value={stats.postes} hint="créés" color="#1C3829" onClick={() => setPage('postes')} />
        <StatCard label="Bénévoles" value={stats.benevoles} hint="inscrits" color="#0891b2" onClick={() => setPage('benevoles')} />
        <StatCard label="Affectations" value={stats.affectations} hint="réalisées" color="#16a34a" onClick={() => setPage('affectations')} />
        <StatCard label="Remplissage" value={`${remplissagePct}%`} hint="des postes" color={remplissageColor} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 16 }}>Gestion de l'événement</div>
          {[
            { icon: '📍', label: 'Gérer les postes', page: 'postes' },
            { icon: '👥', label: 'Gérer les bénévoles', page: 'benevoles' },
            { icon: '✅', label: 'Affecter les bénévoles', page: 'affectations' },
            { icon: '📊', label: 'Voir le planning', page: 'planning' },
          ].map(a => (
            <button key={a.page} onClick={() => setPage(a.page)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', marginBottom: 6, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#374151', fontWeight: 500, textAlign: 'left' }}>
              <span>{a.icon}</span>{a.label}
            </button>
          ))}
        </div>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 16 }}>Progression</div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: '#374151' }}>Remplissage des postes</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: remplissageColor }}>{remplissagePct}%</span>
            </div>
            <div style={{ height: 8, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${remplissagePct}%`, background: remplissageColor, borderRadius: 4 }} />
            </div>
          </div>
          {stats.postes === 0 && (
            <div style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic' }}>Commencez par créer des postes.</div>
          )}
          {stats.benevoles === 0 && stats.postes > 0 && (
            <div style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic' }}>Invitez des bénévoles à rejoindre l'événement.</div>
          )}
          {stats.benevoles > 0 && stats.affectations === 0 && (
            <div style={{ fontSize: 13, color: '#F97316', fontStyle: 'italic' }}>Des bénévoles sont inscrits — pensez à les affecter !</div>
          )}
          {stats.affectations > 0 && (
            <div style={{ fontSize: 13, color: '#16a34a' }}>{stats.affectations} affectation(s) réalisée(s) ✓</div>
          )}
        </div>
      </div>
    </div>
  )
}

function DashboardVolunteer({ profile, stats, activeEventName, setPage }) {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', marginBottom: 4 }}>
          Bonjour {profile?.first_name || 'Bénévole'} !
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280' }}>
          {activeEventName ? <>Prochain événement : <strong style={{ color: '#1C3829' }}>{activeEventName}</strong></> : 'Bienvenue sur votre espace bénévole'}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Mes missions" value={stats.missions || 0} hint="affectations en cours" color="#1C3829" onClick={() => setPage('missions')} />
        <StatCard label="Événement" value={activeEventName ? '1' : '0'} hint={activeEventName || 'aucun'} color="#0891b2" />
        <StatCard label="Statut" value={profile?.is_active ? 'Actif' : 'Inactif'} hint="votre compte" color={profile?.is_active ? '#16a34a' : '#dc2626'} />
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 16 }}>Mes actions rapides</div>
        {[
          { icon: '🎯', label: 'Voir mes missions', page: 'missions' },
          { icon: '📊', label: 'Mon planning', page: 'planning' },
        ].map(a => (
          <button key={a.page} onClick={() => setPage(a.page)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '12px 14px', marginBottom: 8, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#374151', fontWeight: 500, textAlign: 'left' }}>
            <span>{a.icon}</span>{a.label}
          </button>
        ))}
        {(stats.missions || 0) === 0 && (
          <div style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic', marginTop: 8 }}>
            Aucune mission pour le moment. L'organisateur vous contactera prochainement.
          </div>
        )}
      </div>
    </div>
  )
}

export default function AppLayout({ session, onLogout }) {
  const [profile, setProfile] = useState(null)
  const [page, setPage] = useState('dashboard')
  const [activeEventId, setActiveEventId] = useState(null)
  const [activeEventName, setActiveEventName] = useState(null)

  function setActiveEvent(id, name) {
    setActiveEventId(id)
    setActiveEventName(name)
    localStorage.setItem('peakevents_active_id', id)
    localStorage.setItem('peakevents_active_name', name)
  }
  const [stats, setStats] = useState({ events: 0, users: 0, postes: 0, benevoles: 0, affectations: 0, admins: 0, organizers: 0, volunteers: 0, missions: 0 })
  const [selectedEventId, setSelectedEventId] = useState(null)
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
    // Charger l'événement actif depuis localStorage d'abord
    const savedId = localStorage.getItem('peakevents_active_id')
    const savedName = localStorage.getItem('peakevents_active_name')
    if (savedId && savedName) {
      setActiveEventId(savedId)
      setActiveEventName(savedName)
    } else {
      // Sinon prendre le premier événement non archivé
      supabase.from('events').select('id, name').neq('status', 'archived').order('start_date').limit(1)
        .then(({ data }) => {
          if (data?.[0]) {
            setActiveEventId(data[0].id)
            setActiveEventName(data[0].name)
            localStorage.setItem('peakevents_active_id', data[0].id)
            localStorage.setItem('peakevents_active_name', data[0].name)
          }
        })
    }
    Promise.all([
      supabase.from('events').select('id', { count: 'exact' }),
      supabase.from('profiles').select('id, role', { count: 'exact' }),
    ]).then(([evts, users]) => {
      const allUsers = users.data || []
      setStats(s => ({
        ...s,
        events: evts.count || 0,
        users: users.count || 0,
        admins: allUsers.filter(u => u.role === 'admin').length,
        organizers: allUsers.filter(u => u.role === 'organizer').length,
        volunteers: allUsers.filter(u => u.role === 'volunteer').length,
      }))
    })
  }, [])

  useEffect(() => {
    if (activeEventId) {
      Promise.all([
        supabase.from('positions').select('id', { count: 'exact' }).eq('event_id', activeEventId),
        supabase.from('event_volunteers').select('id', { count: 'exact' }).eq('event_id', activeEventId),
        supabase.from('assignments').select('id', { count: 'exact' }).eq('event_id', activeEventId),
      ]).then(([postes, bens, asgn]) => setStats(s => ({ ...s, postes: postes.count || 0, benevoles: bens.count || 0, affectations: asgn.count || 0 })))
    }
  }, [activeEventId])

  useEffect(() => {
    if (profile?.id && profile?.role === 'volunteer') {
      supabase.from('assignments').select('id', { count: 'exact' }).eq('volunteer_id', profile.id)
        .then(({ count }) => setStats(s => ({ ...s, missions: count || 0 })))
    }
  }, [profile])

  const role = profile?.role || 'volunteer'

  function handleSetPage(p) {
    setPage(p)
    setMenuOpen(false)
    // Revenir au sommaire des événements quand on clique sur la nav
    if (p === 'events') setSelectedEventId(null)
  }

  function renderPage() {
    if (page === 'dashboard') {
      if (role === 'admin') return <DashboardAdmin setPage={handleSetPage} stats={stats} activeEventName={activeEventName} />
      if (role === 'organizer') return <DashboardOrganizer profile={profile} setPage={handleSetPage} stats={stats} activeEventName={activeEventName} />
      return <DashboardVolunteer profile={profile} stats={stats} activeEventName={activeEventName} setPage={handleSetPage} />
    }
    if (page === 'admin') return <PageAdmin setPage={handleSetPage} />
    if (page === 'events' && selectedEventId) return <PageEventDetail eventId={selectedEventId} profile={profile} activeEventId={activeEventId} onBack={() => setSelectedEventId(null)} onSetActiveEvent={(id, name) => { setActiveEvent(id, name); setSelectedEventId(null) }} />
    if (page === 'events') return <PageEvents profile={profile} onSetActiveEvent={(id, name) => setActiveEvent(id, name)} onViewDetail={(id) => setSelectedEventId(id)} activeEventId={activeEventId} />
    if (page === 'users') return <PageUsers profile={profile} activeEventId={activeEventId} />
    if (page === 'benevoles') return <PageBenevoles profile={profile} activeEventId={activeEventId} activeEventName={activeEventName} />
    if (page === 'postes') return <PagePostes profile={profile} activeEventId={activeEventId} activeEventName={activeEventName} />
    if (page === 'affectations') return <PageAffectations profile={profile} activeEventId={activeEventId} activeEventName={activeEventName} />
    if (page === 'planning') return <PagePlanning profile={profile} activeEventId={activeEventId} activeEventName={activeEventName} />
    if (page === 'missions') return <PageMissions profile={profile} />
    if (page === 'catalogue') return <PageCatalogue profile={profile} />
    if (page === 'profil') return <PageProfil profile={profile} onProfileUpdate={() => { supabase.from('profiles').select('*').eq('id', session?.user?.id).single().then(({ data }) => { if (data) setProfile(data) }) }} />
    if (page === 'projet') return <PageProjet profile={profile} activeEventId={activeEventId} activeEventName={activeEventName} />
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
