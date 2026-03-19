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

function Section({ title, children, action }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: 16 }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#111' }}>{title}</div>
        {action}
      </div>
      <div style={{ padding: '16px 20px' }}>{children}</div>
    </div>
  )
}

export default function PageEventDetail({ eventId, onBack, onSetActiveEvent, profile }) {
  const [event, setEvent] = useState(null)
  const [organizers, setOrganizers] = useState([])
  const [volunteers, setVolunteers] = useState([])
  const [postes, setPostes] = useState([])
  const [loading, setLoading] = useState(true)

  const isAdmin = profile?.role === 'admin'

  useEffect(() => {
    if (eventId) loadAll()
  }, [eventId])

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

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af', fontFamily: 'Inter, sans-serif' }}>Chargement...</div>
  )

  if (!event) return (
    <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af', fontFamily: 'Inter, sans-serif' }}>Événement introuvable.</div>
  )

  const totalReq = postes.reduce((s, p) => s + (p.volunteers_required || 0), 0)
  const totalAff = postes.reduce((s, p) => s + (p.shifts?.reduce((ss, sh) => ss + (sh.assignments?.length || 0), 0) || 0), 0)
  const remplissagePct = totalReq > 0 ? Math.min(Math.round(totalAff / totalReq * 100), 100) : 0
  const remplissageColor = remplissagePct >= 80 ? '#16a34a' : remplissagePct >= 40 ? '#F97316' : '#dc2626'

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 13, fontFamily: 'Inter, sans-serif', padding: 0, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            ← Retour aux événements
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', margin: 0 }}>{event.name}</h1>
            <StatusBadge status={event.status} />
          </div>
          <div style={{ fontSize: 14, color: '#6b7280', marginTop: 4, display: 'flex', gap: 16 }}>
            {event.start_date && <span>📅 {formatDate(event.start_date)}{event.end_date && event.end_date !== event.start_date ? ` → ${formatDate(event.end_date)}` : ''}</span>}
            {event.location && <span>📍 {event.location}</span>}
          </div>
        </div>
        <button onClick={() => onSetActiveEvent(event.id, event.name)}
          style={{ background: '#1C3829', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'Inter, sans-serif', flexShrink: 0 }}>
          ✓ Définir comme actif
        </button>
      </div>

      {/* Stats rapides */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Organisateurs', value: organizers.length, color: '#2563eb' },
          { label: 'Bénévoles inscrits', value: volunteers.length, color: '#0891b2' },
          { label: 'Postes', value: postes.length, color: '#7c3aed' },
          { label: 'Remplissage', value: `${remplissagePct}%`, color: remplissageColor },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', padding: '14px 18px' }}>
            <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Description */}
      {event.description && (
        <Section title="Description">
          <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, margin: 0 }}>{event.description}</p>
        </Section>
      )}

      {/* Organisateurs */}
      <Section title={`Organisateurs (${organizers.length})`}>
        {organizers.length === 0 ? (
          <div style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic' }}>Aucun organisateur assigné{isAdmin ? ' — utilisez le bouton "Organisateurs" dans la liste des événements.' : '.'}</div>
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
      <Section title={`Bénévoles inscrits (${volunteers.length})`}>
        {volunteers.length === 0 ? (
          <div style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic' }}>Aucun bénévole inscrit sur cet événement.</div>
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
                      {skills.slice(0, 3).map((s, i) => (
                        <span key={i} style={{ background: '#f0fdf4', color: '#15803d', borderRadius: 20, padding: '2px 7px', fontSize: 10, fontWeight: 600 }}>{s}</span>
                      ))}
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
      <Section title={`Postes (${postes.length})`}>
        {postes.length === 0 ? (
          <div style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic' }}>Aucun poste créé pour cet événement.</div>
        ) : (
          <>
            {/* Barre remplissage globale */}
            <div style={{ marginBottom: 16, padding: '12px 14px', background: '#f9fafb', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                <span style={{ color: '#374151', fontWeight: 600 }}>Remplissage global</span>
                <span style={{ color: remplissageColor, fontWeight: 700 }}>{totalAff}/{totalReq} ({remplissagePct}%)</span>
              </div>
              <div style={{ height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${remplissagePct}%`, background: remplissageColor, borderRadius: 4 }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {postes.map(p => {
                const req = p.volunteers_required || 0
                const aff = p.shifts?.reduce((s, sh) => s + (sh.assignments?.length || 0), 0) || 0
                const pct = req > 0 ? Math.min(Math.round(aff / req * 100), 100) : 0
                const color = pct >= 80 ? '#16a34a' : pct >= 40 ? '#F97316' : '#dc2626'
                const t1 = p.shifts?.[0]?.start_time?.slice(0, 5) || ''
                const t2 = p.shifts?.[0]?.end_time?.slice(0, 5) || ''
                const bens = p.shifts?.flatMap(sh => sh.assignments?.map(a => a.profiles) || []) || []

                return (
                  <div key={p.id} style={{ background: '#f9fafb', borderRadius: 10, border: '1px solid #f3f4f6', padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#111' }}>{p.name}</div>
                        {p.location && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>📍 {p.location}</div>}
                      </div>
                      <span style={{ background: pct >= 100 ? '#dcfce7' : '#fef9c3', color: pct >= 100 ? '#16a34a' : '#ca8a04', borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                        {pct >= 100 ? 'Complet' : 'Incomplet'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
                      {t1 && t2 && <span>🕐 {t1} - {t2}</span>}
                      <span style={{ color, fontWeight: 600 }}>👥 {aff}/{req}</span>
                    </div>
                    <div style={{ height: 4, background: '#e5e7eb', borderRadius: 2, overflow: 'hidden', marginBottom: bens.length > 0 ? 8 : 0 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2 }} />
                    </div>
                    {bens.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {bens.map((b, i) => (
                          <span key={i} style={{ background: '#eff6ff', color: '#2563eb', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>
                            {b?.first_name} {b?.last_name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </Section>
    </div>
  )
}
