'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function StatusBadge({ status }) {
  const map = {
    draft: { bg: '#f3f4f6', color: '#6b7280', label: 'Brouillon' },
    published: { bg: '#dcfce7', color: '#16a34a', label: 'Publié' },
    completed: { bg: '#dbeafe', color: '#2563eb', label: 'Terminé' },
    archived: { bg: '#fef3c7', color: '#d97706', label: 'Archivé' },
  }
  const s = map[status] || map.draft
  return <span style={{ background: s.bg, color: s.color, borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 600 }}>{s.label}</span>
}

function SportBadge({ sport }) {
  if (!sport) return null
  const colors = { Trail: ['#dcfce7','#16a34a'], Triathlon: ['#dbeafe','#2563eb'], SwimRun: ['#e0f2fe','#0284c7'], Running: ['#fef9c3','#ca8a04'], Gravel: ['#f3e8ff','#9333ea'], Cyclisme: ['#fce7f3','#db2777'], Natation: ['#e0f2fe','#0891b2'], Autre: ['#f3f4f6','#6b7280'] }
  const [bg, fg] = colors[sport] || colors['Autre']
  return <span style={{ background: bg, color: fg, borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 600 }}>{sport}</span>
}

function getSkills(p) {
  try {
    if (!p.skills) return []
    if (Array.isArray(p.skills)) return p.skills
    if (typeof p.skills === 'string') return JSON.parse(p.skills)
    return []
  } catch { return [] }
}

function Avatar({ first, last, size = 32 }) {
  const initials = ((first?.[0] || '') + (last?.[0] || '')).toUpperCase() || '?'
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: '#1C3829', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: size * 0.35, flexShrink: 0 }}>
      {initials}
    </div>
  )
}

function Section({ title, count, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: 16 }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#111' }}>{title}</div>
        {count !== undefined && <span style={{ background: '#f3f4f6', color: '#6b7280', borderRadius: 20, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>{count}</span>}
      </div>
      <div style={{ padding: '16px 20px' }}>{children}</div>
    </div>
  )
}

export default function PageEventDetail({ eventId, onBack, onSetActiveEvent, profile, activeEventId }) {
  const [event, setEvent] = useState(null)
  const [organizers, setOrganizers] = useState([])
  const [volunteers, setVolunteers] = useState([])
  const [postes, setPostes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showImageModal, setShowImageModal] = useState(false)
  const [newImageUrl, setNewImageUrl] = useState('')
  const [savingImage, setSavingImage] = useState(false)
  const [toast, setToast] = useState('')

  const isAdmin = profile?.role === 'admin'
  const isOrgOfEvent = organizers.some(o => o.user_id === profile?.id)
  const canEdit = isAdmin || isOrgOfEvent

  useEffect(() => { if (eventId) loadAll() }, [eventId])

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 2500) }

  async function loadAll() {
    setLoading(true)
    const [evtRes, orgRes, volRes, postesRes] = await Promise.all([
      supabase.from('events').select('*').eq('id', eventId).single(),
      supabase.from('event_organizers').select('user_id, profiles(first_name, last_name, email)').eq('event_id', eventId),
      supabase.from('event_volunteers').select('user_id, status, profiles(first_name, last_name, email, skills)').eq('event_id', eventId),
      supabase.from('positions').select('*, shifts(*, assignments(id, profiles(first_name, last_name)))').eq('event_id', eventId).order('name'),
    ])
    setEvent(evtRes.data)
    setOrganizers(orgRes.data || [])
    setVolunteers(volRes.data || [])
    setPostes(postesRes.data || [])
    setLoading(false)
  }

  async function handleSaveImage() {
    setSavingImage(true)
    const { error } = await supabase.from('events').update({ poster_url: newImageUrl || null }).eq('id', eventId)
    setSavingImage(false)
    if (error) { showToast('Erreur lors de la mise à jour'); return }
    setEvent(prev => ({ ...prev, poster_url: newImageUrl || null }))
    setShowImageModal(false)
    showToast('Image mise à jour')
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af', fontFamily: 'Inter, sans-serif' }}>Chargement...</div>
  if (!event) return <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af', fontFamily: 'Inter, sans-serif' }}>Événement introuvable.</div>

  const totalReq = postes.reduce((s, p) => s + (p.volunteers_required || 0), 0)
  const totalAff = postes.reduce((s, p) => s + (p.shifts?.reduce((ss, sh) => ss + (sh.assignments?.length || 0), 0) || 0), 0)
  const remplissagePct = totalReq > 0 ? Math.min(Math.round(totalAff / totalReq * 100), 100) : 0
  const remplissageColor = remplissagePct >= 80 ? '#16a34a' : remplissagePct >= 40 ? '#F97316' : '#dc2626'
  const sportEmoji = { Trail: '🏔️', Triathlon: '🏊', SwimRun: '🌊', Running: '🏃', Gravel: '🚴', Cyclisme: '🚵', Natation: '🏊' }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#1C3829', color: '#fff', borderRadius: 10, padding: '12px 20px', fontSize: 14, fontWeight: 600, zIndex: 2000, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>{toast}</div>
      )}

      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 13, fontFamily: 'Inter, sans-serif', padding: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4 }}>
        ← Retour aux événements
      </button>

      {/* Hero card principale */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: 16, display: 'flex' }}>

        {/* Photo côté gauche */}
        <div style={{ width: 260, flexShrink: 0, position: 'relative' }}>
          {event.poster_url ? (
            <img src={event.poster_url} alt={event.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', minHeight: 240 }} />
          ) : (
            <div style={{ width: '100%', minHeight: 240, height: '100%', background: 'linear-gradient(135deg, #1C3829 0%, #2D5A3D 60%, #F97316 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 64 }}>{sportEmoji[event.sport] || '🎯'}</span>
            </div>
          )}
          {/* Bouton changer image — admin ou organisateur de l'événement seulement */}
          {canEdit && (
            <button
              onClick={() => { setNewImageUrl(event.poster_url || ''); setShowImageModal(true) }}
              style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}>
              🖼️ Changer l'image
            </button>
          )}
        </div>

        {/* Infos à droite */}
        <div style={{ flex: 1, padding: '24px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111', margin: 0 }}>{event.name}</h1>
                <StatusBadge status={event.status} />
                {event.sport && <SportBadge sport={event.sport} />}
              </div>
              {event.id === activeEventId ? (
                <span style={{ background: '#f0fdf4', color: '#1C3829', border: '1px solid #bbf7d0', borderRadius: 8, padding: '9px 16px', fontWeight: 600, fontSize: 13, fontFamily: 'Inter, sans-serif', flexShrink: 0, marginLeft: 12 }}>
                  ✓ Événement actif
                </span>
              ) : (
                <button onClick={() => onSetActiveEvent(event.id, event.name)}
                  style={{ background: '#1C3829', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif', flexShrink: 0, marginLeft: 12 }}>
                  Travailler sur cet événement
                </button>
              )}
            </div>

            <div style={{ fontSize: 14, color: '#6b7280', display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
              {event.start_date && <span>📅 {formatDate(event.start_date)}{event.end_date && event.end_date !== event.start_date ? ` → ${formatDate(event.end_date)}` : ''}</span>}
              {event.location && <span>📍 {event.location}</span>}
            </div>

            {/* Stats sportives */}
            {(event.distance || event.elevation) && (
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                {event.distance && (
                  <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '10px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#1C3829' }}>{event.distance} km</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Distance</div>
                  </div>
                )}
                {event.elevation && (
                  <div style={{ background: '#fff7ed', borderRadius: 10, padding: '10px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#ea580c' }}>{event.elevation} m</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.4px' }}>D+</div>
                  </div>
                )}
                <div style={{ background: '#f9fafb', borderRadius: 10, padding: '10px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: remplissageColor }}>{remplissagePct}%</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Remplissage</div>
                </div>
              </div>
            )}

            {event.description && (
              <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, margin: '0 0 16px 0' }}>{event.description}</p>
            )}
          </div>

          {/* Liens */}
          {(event.registration_url || event.website_url || event.gpx_url || event.roadbook_url) && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {event.registration_url && <a href={event.registration_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: '#dcfce7', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#16a34a', textDecoration: 'none' }}>📝 Inscriptions</a>}
              {event.website_url && <a href={event.website_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: '#f3f4f6', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#374151', textDecoration: 'none' }}>🌐 Site web</a>}
              {event.gpx_url && <a href={event.gpx_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: '#eff6ff', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#2563eb', textDecoration: 'none' }}>🗺️ Trace GPX</a>}
              {event.roadbook_url && <a href={event.roadbook_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: '#fef9c3', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#ca8a04', textDecoration: 'none' }}>📋 Roadbook</a>}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Organisateurs', value: organizers.length, color: '#2563eb' },
          { label: 'Bénévoles', value: volunteers.length, color: '#0891b2' },
          { label: 'Postes', value: postes.length, color: '#7c3aed' },
          { label: 'Remplissage', value: `${remplissagePct}%`, color: remplissageColor },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', padding: '14px 18px' }}>
            <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Organisateurs */}
      <Section title="Organisateurs" count={organizers.length}>
        {organizers.length === 0 ? (
          <div style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic' }}>Aucun organisateur assigné.</div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {organizers.map(o => (
              <div key={o.user_id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#eff6ff', borderRadius: 10, padding: '10px 14px' }}>
                <Avatar first={o.profiles?.first_name} last={o.profiles?.last_name} size={34} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#1d4ed8' }}>{o.profiles?.first_name} {o.profiles?.last_name}</div>
                  <div style={{ fontSize: 11, color: '#93c5fd' }}>{o.profiles?.email}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Bénévoles */}
      <Section title="Bénévoles inscrits" count={volunteers.length}>
        {volunteers.length === 0 ? (
          <div style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic' }}>Aucun bénévole inscrit.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
            {volunteers.map(v => {
              const skills = getSkills(v.profiles || {})
              return (
                <div key={v.user_id} style={{ background: '#f9fafb', borderRadius: 10, padding: '12px 14px', border: '1px solid #f3f4f6' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: skills.length > 0 ? 8 : 0 }}>
                    <Avatar first={v.profiles?.first_name} last={v.profiles?.last_name} size={28} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#111' }}>{v.profiles?.first_name} {v.profiles?.last_name}</div>
                      <span style={{ background: v.status === 'accepted' ? '#dcfce7' : '#fef9c3', color: v.status === 'accepted' ? '#16a34a' : '#ca8a04', borderRadius: 20, padding: '1px 7px', fontSize: 10, fontWeight: 600 }}>
                        {v.status === 'accepted' ? 'Accepté' : 'En attente'}
                      </span>
                    </div>
                  </div>
                  {skills.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {skills.slice(0, 3).map((s, i) => <span key={i} style={{ background: '#f0fdf4', color: '#15803d', borderRadius: 20, padding: '2px 7px', fontSize: 10, fontWeight: 600 }}>{s}</span>)}
                      {skills.length > 3 && <span style={{ fontSize: 10, color: '#9ca3af' }}>+{skills.length - 3}</span>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Section>

      {/* Postes */}
      <Section title="Postes" count={postes.length}>
        {postes.length === 0 ? (
          <div style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic' }}>Aucun poste créé.</div>
        ) : (
          <>
            <div style={{ marginBottom: 16, padding: '12px 14px', background: '#f9fafb', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                <span style={{ color: '#374151', fontWeight: 600 }}>Remplissage global</span>
                <span style={{ color: remplissageColor, fontWeight: 700 }}>{totalAff}/{totalReq} ({remplissagePct}%)</span>
              </div>
              <div style={{ height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${remplissagePct}%`, background: remplissageColor, borderRadius: 4 }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
              {postes.map(p => {
                const req = p.volunteers_required || 0
                const aff = p.shifts?.reduce((s, sh) => s + (sh.assignments?.length || 0), 0) || 0
                const pct = req > 0 ? Math.min(Math.round(aff / req * 100), 100) : 0
                const color = pct >= 100 ? '#16a34a' : pct >= 50 ? '#F97316' : '#dc2626'
                const t1 = p.shifts?.[0]?.start_time?.slice(0, 5) || ''
                const t2 = p.shifts?.[0]?.end_time?.slice(0, 5) || ''
                const bens = p.shifts?.flatMap(sh => sh.assignments?.map(a => a.profiles) || []) || []
                return (
                  <div key={p.id} style={{ background: '#f9fafb', borderRadius: 10, border: '1px solid #f3f4f6', padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#111' }}>{p.name}</div>
                      <span style={{ background: pct >= 100 ? '#dcfce7' : '#fff7ed', color: pct >= 100 ? '#16a34a' : '#ea580c', borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>
                        {pct >= 100 ? 'Complet' : 'Incomplet'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
                      {p.location && <span>📍 {p.location}</span>}
                      {t1 && t2 && <span>🕐 {t1}-{t2}</span>}
                      <span style={{ color, fontWeight: 600 }}>👥 {aff}/{req}</span>
                    </div>
                    <div style={{ height: 4, background: '#e5e7eb', borderRadius: 2, overflow: 'hidden', marginBottom: bens.length > 0 ? 8 : 0 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2 }} />
                    </div>
                    {bens.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {bens.map((b, i) => <span key={i} style={{ background: '#eff6ff', color: '#2563eb', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{b?.first_name} {b?.last_name}</span>)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </Section>

      {/* Modal changement image */}
      {showImageModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#111' }}>Changer l'image</div>
              <button onClick={() => setShowImageModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#9ca3af' }}>&times;</button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }}>URL de l'image</label>
              <input
                style={{ width: '100%', padding: '10px 13px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box', color: '#111' }}
                value={newImageUrl}
                onChange={e => setNewImageUrl(e.target.value)}
                placeholder="https://exemple.com/affiche.jpg"
              />
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>Coller l'URL d'une image hébergée en ligne (JPG, PNG, WebP)</div>
            </div>
            {newImageUrl && (
              <div style={{ marginBottom: 16, borderRadius: 8, overflow: 'hidden', maxHeight: 180, background: '#f9fafb' }}>
                <img src={newImageUrl} alt="Aperçu" style={{ width: '100%', objectFit: 'cover', display: 'block' }} onError={e => e.target.style.display = 'none'} />
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              {event.poster_url && (
                <button onClick={() => { setNewImageUrl(''); handleSaveImage() }}
                  style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 8, padding: '9px 14px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                  Supprimer
                </button>
              )}
              <div style={{ flex: 1 }} />
              <button onClick={() => setShowImageModal(false)}
                style={{ background: '#fff', color: '#374151', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '9px 14px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                Annuler
              </button>
              <button onClick={handleSaveImage} disabled={savingImage}
                style={{ background: '#1C3829', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'Inter, sans-serif', opacity: savingImage ? 0.6 : 1 }}>
                {savingImage ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
