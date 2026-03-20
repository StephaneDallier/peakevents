'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#111' }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#9ca3af' }}>&times;</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children, hint }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{hint}</div>}
    </div>
  )
}

const inputStyle = { width: '100%', padding: '10px 13px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box', color: '#111' }
const btnPrimary = { background: '#1C3829', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }
const btnSecondary = { background: '#fff', color: '#374151', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '7px 13px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }
const btnDanger = { background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 8, padding: '7px 13px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }
const btnBlue = { background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 8, padding: '7px 11px', fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }

const SPORTS = ['Trail', 'Triathlon', 'SwimRun', 'Running', 'Gravel', 'Cyclisme', 'Natation', 'Autre']

const emptyForm = {
  name: '', start_date: '', end_date: '', location: '', description: '', status: 'draft',
  sport: '', distance: '', elevation: '', poster_url: '', gpx_url: '', roadbook_url: '',
  registration_url: '', website_url: ''
}

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function StatusBadge({ status }) {
  const map = {
    draft: { bg: 'rgba(0,0,0,0.5)', color: '#fff', label: 'Brouillon' },
    published: { bg: 'rgba(22,163,74,0.85)', color: '#fff', label: 'Publié' },
    completed: { bg: 'rgba(37,99,235,0.85)', color: '#fff', label: 'Terminé' },
    archived: { bg: 'rgba(217,119,6,0.85)', color: '#fff', label: 'Archivé' },
  }
  const s = map[status] || map.draft
  return <span style={{ background: s.bg, color: s.color, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>{s.label}</span>
}

function SportBadge({ sport }) {
  if (!sport) return null
  const icons = { Trail: '🏔️', Triathlon: '🏊', SwimRun: '🌊', Running: '🏃', Gravel: '🚴', Cyclisme: '🚵', Natation: '🏊', Autre: '🎯' }
  return (
    <span style={{ background: 'rgba(255,255,255,0.9)', color: '#374151', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
      {icons[sport] || '🎯'} {sport}
    </span>
  )
}

export default function PageEvents({ profile, onSetActiveEvent, onViewDetail, activeEventId }) {
  const [events, setEvents] = useState([])
  const [filtered, setFiltered] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editEvent, setEditEvent] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteId, setDeleteId] = useState(null)
  const [orgModal, setOrgModal] = useState(null)
  const [organizers, setOrganizers] = useState([])
  const [selectedOrg, setSelectedOrg] = useState('')
  const [orgAssigned, setOrgAssigned] = useState([])
  const [activeTab, setActiveTab] = useState('infos')

  const isAdmin = profile?.role === 'admin'
  const canEdit = profile?.role === 'admin' || profile?.role === 'organizer'

  useEffect(() => { loadEvents() }, [])

  async function loadEvents() {
    setLoading(true)
    const { data } = await supabase
      .from('events')
      .select('*,positions(id,volunteers_required,shifts(id,assignments(id)))')
      .order('start_date')
    const evts = data || []
    setEvents(evts)
    setFiltered(evts)
    setLoading(false)
  }

  function applyFilter(f) {
    setFilter(f)
    setFiltered(f === 'all' ? events : events.filter(e => e.status === f))
  }

  function openCreate() { setEditEvent(null); setForm(emptyForm); setError(''); setActiveTab('infos'); setShowModal(true) }

  function openEdit(ev, e) {
    e.stopPropagation()
    setEditEvent(ev)
    setForm({
      name: ev.name || '', start_date: ev.start_date || '', end_date: ev.end_date || '',
      location: ev.location || '', description: ev.description || '', status: ev.status || 'draft',
      sport: ev.sport || '', distance: ev.distance || '', elevation: ev.elevation || '',
      poster_url: ev.poster_url || '', gpx_url: ev.gpx_url || '', roadbook_url: ev.roadbook_url || '',
      registration_url: ev.registration_url || '', website_url: ev.website_url || ''
    })
    setError(''); setActiveTab('infos'); setShowModal(true)
  }

  async function handleSave() {
    if (!form.name || !form.start_date) { setError('Nom et date de début sont obligatoires'); return }
    setSaving(true); setError('')
    const { data: { user } } = await supabase.auth.getUser()
    const payload = {
      name: form.name, start_date: form.start_date, end_date: form.end_date || null,
      location: form.location, description: form.description, status: form.status,
      sport: form.sport || null, distance: form.distance ? parseFloat(form.distance) : null,
      elevation: form.elevation ? parseInt(form.elevation) : null,
      poster_url: form.poster_url || null, gpx_url: form.gpx_url || null,
      roadbook_url: form.roadbook_url || null, registration_url: form.registration_url || null,
      website_url: form.website_url || null, created_by: user?.id,
    }
    let err
    if (editEvent) {
      const { created_by, ...up } = payload
      ;({ error: err } = await supabase.from('events').update(up).eq('id', editEvent.id))
    } else {
      ;({ error: err } = await supabase.from('events').insert(payload))
    }
    setSaving(false)
    if (err) { setError('Erreur : ' + err.message); return }
    setShowModal(false); loadEvents()
  }

  async function handleDelete(id) {
    await supabase.from('events').delete().eq('id', id)
    setDeleteId(null); loadEvents()
  }

  async function openOrgModal(ev, e) {
    e.stopPropagation()
    setSelectedOrg(''); setOrgModal(ev)
    const { data: orgs } = await supabase.from('profiles').select('id, first_name, last_name').eq('role', 'organizer').order('last_name')
    setOrganizers(orgs || [])
    const { data: assigned } = await supabase.from('event_organizers').select('user_id, profiles(first_name, last_name)').eq('event_id', ev.id)
    setOrgAssigned(assigned || [])
  }

  async function handleAssignOrg() {
    if (!selectedOrg || !orgModal) return
    await supabase.from('event_organizers').upsert({ event_id: orgModal.id, user_id: selectedOrg }, { onConflict: 'event_id,user_id' })
    const { data: assigned } = await supabase.from('event_organizers').select('user_id, profiles(first_name, last_name)').eq('event_id', orgModal.id)
    setOrgAssigned(assigned || []); setSelectedOrg('')
  }

  async function handleRemoveOrg(userId) {
    await supabase.from('event_organizers').delete().eq('event_id', orgModal.id).eq('user_id', userId)
    const { data: assigned } = await supabase.from('event_organizers').select('user_id, profiles(first_name, last_name)').eq('event_id', orgModal.id)
    setOrgAssigned(assigned || [])
  }

  function getRemplissage(ev) {
    const req = ev.positions?.reduce((s, p) => s + (p.volunteers_required || 0), 0) || 0
    const aff = ev.positions?.reduce((s, p) => s + (p.shifts?.reduce((ss, sh) => ss + (sh.assignments?.length || 0), 0) || 0), 0) || 0
    const pct = req > 0 ? Math.round(aff / req * 100) : 0
    const color = pct >= 80 ? '#16a34a' : pct >= 40 ? '#F97316' : '#dc2626'
    return { pct, color, aff, req }
  }

  const filters = [{ key: 'all', label: 'Tous' }, { key: 'draft', label: 'Brouillon' }, { key: 'published', label: 'Publié' }, { key: 'completed', label: 'Terminé' }]

  const tabStyle = (t) => ({
    padding: '8px 16px', border: 'none', borderRadius: 8, cursor: 'pointer',
    fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600,
    background: activeTab === t ? '#1C3829' : 'transparent',
    color: activeTab === t ? '#fff' : '#6b7280',
  })

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', marginBottom: 4 }}>Événements</h1>
          <p style={{ fontSize: 14, color: '#6b7280' }}>{filtered.length} événement{filtered.length > 1 ? 's' : ''}</p>
        </div>
        {isAdmin && <button onClick={openCreate} style={btnPrimary}>+ Nouvel événement</button>}
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {filters.map(f => (
          <button key={f.key} onClick={() => applyFilter(f.key)}
            style={{ padding: '6px 14px', borderRadius: 20, border: '1.5px solid', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', background: filter === f.key ? '#1C3829' : '#fff', color: filter === f.key ? '#fff' : '#6b7280', borderColor: filter === f.key ? '#1C3829' : '#e5e7eb' }}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>Chargement...</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, border: '2px dashed #e5e7eb', padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📅</div>
          <div style={{ fontWeight: 600, color: '#374151', marginBottom: 4 }}>Aucun événement</div>
          {isAdmin && <button onClick={openCreate} style={{ ...btnPrimary, marginTop: 12 }}>+ Créer un événement</button>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {filtered.map(ev => {
            const { pct, color, aff, req } = getRemplissage(ev)
            const hasImage = !!ev.poster_url
            const isActive = ev.id === activeEventId

            return (
              <div key={ev.id}
                onClick={() => onViewDetail && onViewDetail(ev.id)}
                style={{ background: '#fff', borderRadius: 16, border: isActive ? '2.5px solid #1C3829' : '1px solid #e5e7eb', overflow: 'hidden', cursor: 'pointer', boxShadow: isActive ? '0 4px 16px rgba(28,56,41,0.15)' : '0 2px 8px rgba(0,0,0,0.06)', transition: 'box-shadow 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = isActive ? '0 4px 16px rgba(28,56,41,0.15)' : '0 2px 8px rgba(0,0,0,0.06)'}>

                {/* Image / Hero */}
                <div style={{ position: 'relative', height: 160, overflow: 'hidden' }}>
                  {hasImage ? (
                    <img src={ev.poster_url} alt={ev.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1C3829 0%, #2D5A3D 60%, #F97316 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 56 }}>
                        {ev.sport === 'Trail' ? '🏔️' : ev.sport === 'Triathlon' ? '🏊' : ev.sport === 'SwimRun' ? '🌊' : ev.sport === 'Running' ? '🏃' : ev.sport === 'Gravel' ? '🚴' : '🎯'}
                      </span>
                    </div>
                  )}
                  {/* Badges overlay */}
                  <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <StatusBadge status={ev.status} />
                    {ev.sport && <SportBadge sport={ev.sport} />}
                    {isActive && (
                      <span style={{ background: '#1C3829', color: '#fff', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>✓ En cours</span>
                    )}
                  </div>
                  {/* Boutons admin overlay */}
                  {canEdit && (
                    <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                      <button onClick={e => openEdit(ev, e)}
                        style={{ background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#374151', fontFamily: 'Inter, sans-serif' }}>
                        ✏️
                      </button>
                      {isAdmin && (
                        <>
                          <button onClick={e => openOrgModal(ev, e)}
                            style={{ background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#2563eb', fontFamily: 'Inter, sans-serif' }}>
                            👤
                          </button>
                          <button onClick={e => { e.stopPropagation(); setDeleteId(ev.id) }}
                            style={{ background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#dc2626', fontFamily: 'Inter, sans-serif' }}>
                            🗑️
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Contenu */}
                <div style={{ padding: '16px 18px' }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: '#111', marginBottom: 6, lineHeight: 1.3 }}>{ev.name}</div>

                  {/* Infos clés */}
                  <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#6b7280', marginBottom: 10, flexWrap: 'wrap' }}>
                    {ev.start_date && <span>📅 {formatDate(ev.start_date)}</span>}
                    {ev.location && <span>📍 {ev.location}</span>}
                  </div>

                  {/* Stats sportives */}
                  {(ev.distance || ev.elevation) && (
                    <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                      {ev.distance && (
                        <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '6px 10px', textAlign: 'center', flex: 1 }}>
                          <div style={{ fontSize: 15, fontWeight: 800, color: '#1C3829' }}>{ev.distance} km</div>
                          <div style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Distance</div>
                        </div>
                      )}
                      {ev.elevation && (
                        <div style={{ background: '#fff7ed', borderRadius: 8, padding: '6px 10px', textAlign: 'center', flex: 1 }}>
                          <div style={{ fontSize: 15, fontWeight: 800, color: '#ea580c' }}>{ev.elevation} m</div>
                          <div style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.4px' }}>D+</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Liens rapides */}
                  {(ev.registration_url || ev.website_url || ev.gpx_url || ev.roadbook_url) && (
                    <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }} onClick={e => e.stopPropagation()}>
                      {ev.registration_url && <a href={ev.registration_url} target="_blank" rel="noopener noreferrer" style={{ background: '#dcfce7', color: '#16a34a', borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 600, textDecoration: 'none' }}>📝 Inscriptions</a>}
                      {ev.website_url && <a href={ev.website_url} target="_blank" rel="noopener noreferrer" style={{ background: '#f3f4f6', color: '#374151', borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 600, textDecoration: 'none' }}>🌐 Site web</a>}
                      {ev.gpx_url && <a href={ev.gpx_url} target="_blank" rel="noopener noreferrer" style={{ background: '#eff6ff', color: '#2563eb', borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 600, textDecoration: 'none' }}>🗺️ GPX</a>}
                      {ev.roadbook_url && <a href={ev.roadbook_url} target="_blank" rel="noopener noreferrer" style={{ background: '#fef9c3', color: '#ca8a04', borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 600, textDecoration: 'none' }}>📋 Roadbook</a>}
                    </div>
                  )}

                  {/* Barre remplissage */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11 }}>
                      <span style={{ color: '#9ca3af' }}>Remplissage bénévoles</span>
                      <span style={{ color, fontWeight: 700 }}>{aff}/{req} ({pct}%)</span>
                    </div>
                    <div style={{ height: 5, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3 }} />
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div style={{ padding: '10px 18px', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>Voir le détail →</span>
                  {!isActive ? (
                    <button onClick={e => { e.stopPropagation(); onSetActiveEvent && onSetActiveEvent(ev.id, ev.name) }}
                      style={{ background: 'none', border: '1px solid #1C3829', borderRadius: 6, cursor: 'pointer', fontSize: 12, color: '#1C3829', fontWeight: 600, fontFamily: 'Inter, sans-serif', padding: '4px 10px' }}>
                      Travailler sur cet événement
                    </button>
                  ) : (
                    <span style={{ fontSize: 12, color: '#1C3829', fontWeight: 700 }}>✓ Événement actif</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal création/édition */}
      {showModal && (
        <Modal title={editEvent ? "Modifier l'événement" : 'Nouvel événement'} onClose={() => setShowModal(false)}>
          {error && <div style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 8, padding: '10px 13px', fontSize: 13, marginBottom: 16 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#f9fafb', borderRadius: 10, padding: 4 }}>
            {[['infos', 'Informations'], ['details', 'Détails sportifs'], ['liens', 'Liens & Docs']].map(([t, l]) => (
              <button key={t} onClick={() => setActiveTab(t)}
                style={{ flex: 1, padding: '8px 12px', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600, background: activeTab === t ? '#1C3829' : 'transparent', color: activeTab === t ? '#fff' : '#6b7280' }}>
                {l}
              </button>
            ))}
          </div>

          {activeTab === 'infos' && (<>
            <Field label="Nom de l'événement *">
              <input style={inputStyle} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: SwimRun du Verdon 2027" />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Date de début *">
                <input style={inputStyle} type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
              </Field>
              <Field label="Date de fin">
                <input style={inputStyle} type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
              </Field>
            </div>
            <Field label="Lieu">
              <input style={inputStyle} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Ex: Verdon, France" />
            </Field>
            <Field label="Statut">
              <select style={inputStyle} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="draft">Brouillon</option>
                <option value="published">Publié</option>
                <option value="completed">Terminé</option>
              </select>
            </Field>
            <Field label="Description">
              <textarea style={{ ...inputStyle, height: 80, resize: 'vertical' }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description de l'événement..." />
            </Field>
          </>)}

          {activeTab === 'details' && (<>
            <Field label="Type de sport">
              <select style={inputStyle} value={form.sport} onChange={e => setForm({ ...form, sport: e.target.value })}>
                <option value="">- Choisir -</option>
                {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Distance (km)">
                <input style={inputStyle} type="number" step="0.1" value={form.distance} onChange={e => setForm({ ...form, distance: e.target.value })} placeholder="Ex: 23.5" />
              </Field>
              <Field label="Dénivelé D+ (m)">
                <input style={inputStyle} type="number" value={form.elevation} onChange={e => setForm({ ...form, elevation: e.target.value })} placeholder="Ex: 1200" />
              </Field>
            </div>
            <Field label="Affiche / Image (URL)" hint="Coller l'URL d'une image hébergée en ligne (JPG, PNG, WebP)">
              <input style={inputStyle} value={form.poster_url} onChange={e => setForm({ ...form, poster_url: e.target.value })} placeholder="https://..." />
            </Field>
            {form.poster_url && (
              <div style={{ marginBottom: 16, borderRadius: 8, overflow: 'hidden', maxHeight: 200 }}>
                <img src={form.poster_url} alt="Aperçu" style={{ width: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
              </div>
            )}
          </>)}

          {activeTab === 'liens' && (<>
            <Field label="Lien inscriptions">
              <input style={inputStyle} value={form.registration_url} onChange={e => setForm({ ...form, registration_url: e.target.value })} placeholder="https://..." />
            </Field>
            <Field label="Site web de l'événement">
              <input style={inputStyle} value={form.website_url} onChange={e => setForm({ ...form, website_url: e.target.value })} placeholder="https://..." />
            </Field>
            <Field label="Trace GPX (URL de téléchargement)">
              <input style={inputStyle} value={form.gpx_url} onChange={e => setForm({ ...form, gpx_url: e.target.value })} placeholder="https://..." />
            </Field>
            <Field label="Roadbook (URL PDF ou lien)">
              <input style={inputStyle} value={form.roadbook_url} onChange={e => setForm({ ...form, roadbook_url: e.target.value })} placeholder="https://..." />
            </Field>
          </>)}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button onClick={() => setShowModal(false)} style={btnSecondary}>Annuler</button>
            <button onClick={handleSave} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Enregistrement...' : editEvent ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </Modal>
      )}

      {/* Modal organisateurs */}
      {orgModal && (
        <Modal title={`Organisateurs — ${orgModal.name}`} onClose={() => setOrgModal(null)}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Organisateurs assignés</div>
            {orgAssigned.length === 0 ? (
              <div style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic', marginBottom: 12 }}>Aucun organisateur assigné</div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                {orgAssigned.map(a => (
                  <div key={a.user_id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#eff6ff', borderRadius: 20, padding: '4px 10px' }}>
                    <span style={{ fontSize: 13, color: '#2563eb', fontWeight: 600 }}>{a.profiles?.first_name} {a.profiles?.last_name}</span>
                    <button onClick={() => handleRemoveOrg(a.user_id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#93c5fd', fontSize: 16, lineHeight: 1, padding: 0 }}>&times;</button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <select value={selectedOrg} onChange={e => setSelectedOrg(e.target.value)}
                style={{ flex: 1, padding: '10px 13px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', color: '#111', background: '#fff' }}>
                <option value="">- Ajouter un organisateur -</option>
                {organizers.filter(o => !orgAssigned.find(a => a.user_id === o.id)).map(o => (
                  <option key={o.id} value={o.id}>{o.first_name} {o.last_name}</option>
                ))}
              </select>
              <button onClick={handleAssignOrg} disabled={!selectedOrg} style={{ ...btnPrimary, opacity: !selectedOrg ? 0.6 : 1 }}>Assigner</button>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => setOrgModal(null)} style={btnSecondary}>Fermer</button>
          </div>
        </Modal>
      )}

      {/* Modal suppression */}
      {deleteId && (
        <Modal title="Supprimer l'événement" onClose={() => setDeleteId(null)}>
          <p style={{ fontSize: 14, color: '#374151', marginBottom: 24 }}>Êtes-vous sûr ? Cette action est irréversible.</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setDeleteId(null)} style={btnSecondary}>Annuler</button>
            <button onClick={() => handleDelete(deleteId)} style={{ ...btnPrimary, background: '#dc2626' }}>Supprimer</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
