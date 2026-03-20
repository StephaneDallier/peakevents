'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function formatDate(d) {
  if (!d) return '-'
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
  return <span style={{ background: bg, color: fg, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>{sport}</span>
}

export default function PageCatalogue({ profile }) {
  const [events, setEvents] = useState([])
  const [myInscriptions, setMyInscriptions] = useState({})
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(null)
  const [toast, setToast] = useState('')

  useEffect(() => { loadAll() }, [])

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  async function loadAll() {
    setLoading(true)
    const [evtsRes, inscRes] = await Promise.all([
      supabase.from('events').select('*').eq('status', 'published').order('start_date'),
      profile?.id
        ? supabase.from('event_volunteers').select('event_id, status').eq('user_id', profile.id)
        : Promise.resolve({ data: [] })
    ])
    setEvents(evtsRes.data || [])
    const map = {}
    ;(inscRes.data || []).forEach(i => { map[i.event_id] = i.status })
    setMyInscriptions(map)
    setLoading(false)
  }

  async function handleDemande(eventId) {
    if (!profile?.id) return
    setRequesting(eventId)
    const { error } = await supabase.from('event_volunteers').upsert(
      { event_id: eventId, user_id: profile.id, status: 'pending' },
      { onConflict: 'event_id,user_id' }
    )
    setRequesting(null)
    if (error) { showToast('Erreur : ' + error.message); return }
    setMyInscriptions(prev => ({ ...prev, [eventId]: 'pending' }))
    showToast('Demande envoyée ! L\'organisateur vous contactera.')
  }

  async function handleAnnuler(eventId) {
    await supabase.from('event_volunteers').delete()
      .eq('event_id', eventId).eq('user_id', profile.id)
    setMyInscriptions(prev => { const n = { ...prev }; delete n[eventId]; return n })
    showToast('Demande annulée')
  }

  const sportEmoji = { Trail: '🏔️', Triathlon: '🏊', SwimRun: '🌊', Running: '🏃', Gravel: '🚴', Cyclisme: '🚵', Natation: '🏊', Autre: '🎯' }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#1C3829', color: '#fff', borderRadius: 10, padding: '12px 20px', fontSize: 14, fontWeight: 600, zIndex: 2000, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>{toast}</div>
      )}

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', marginBottom: 4 }}>Événements</h1>
        <p style={{ fontSize: 14, color: '#6b7280' }}>Découvrez les événements et proposez votre participation.</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>Chargement...</div>
      ) : events.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, border: '2px dashed #e5e7eb', padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📅</div>
          <div style={{ fontWeight: 600, color: '#374151', marginBottom: 4 }}>Aucun événement disponible</div>
          <div style={{ fontSize: 13, color: '#9ca3af' }}>Les événements publiés apparaîtront ici.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {events.map(ev => {
            const statut = myInscriptions[ev.id]
            const isInscrit = statut === 'accepted'
            const isPending = statut === 'pending'
            const hasImage = !!ev.poster_url

            return (
              <div key={ev.id} style={{
                background: '#fff', borderRadius: 16, overflow: 'hidden',
                border: isInscrit ? '2px solid #16a34a' : isPending ? '2px solid #F97316' : '1px solid #e5e7eb',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}>
                {/* Image */}
                <div style={{ position: 'relative', height: 160, overflow: 'hidden' }}>
                  {hasImage ? (
                    <img src={ev.poster_url} alt={ev.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1C3829 0%, #2D5A3D 60%, #F97316 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 56 }}>{sportEmoji[ev.sport] || '🎯'}</span>
                    </div>
                  )}
                  <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6 }}>
                    {ev.sport && <SportBadge sport={ev.sport} />}
                    {isInscrit && <span style={{ background: '#16a34a', color: '#fff', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>✓ Inscrit</span>}
                    {isPending && <span style={{ background: '#F97316', color: '#fff', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>⏳ En attente</span>}
                  </div>
                </div>

                {/* Contenu */}
                <div style={{ padding: '16px 18px' }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: '#111', marginBottom: 6 }}>{ev.name}</div>
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
                          <div style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase' }}>Distance</div>
                        </div>
                      )}
                      {ev.elevation && (
                        <div style={{ background: '#fff7ed', borderRadius: 8, padding: '6px 10px', textAlign: 'center', flex: 1 }}>
                          <div style={{ fontSize: 15, fontWeight: 800, color: '#ea580c' }}>{ev.elevation} m</div>
                          <div style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase' }}>D+</div>
                        </div>
                      )}
                    </div>
                  )}

                  {ev.description && (
                    <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {ev.description}
                    </p>
                  )}

                  {/* Liens */}
                  {(ev.registration_url || ev.website_url || ev.gpx_url) && (
                    <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                      {ev.website_url && <a href={ev.website_url} target="_blank" rel="noopener noreferrer" style={{ background: '#f3f4f6', color: '#374151', borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 600, textDecoration: 'none' }}>🌐 Site web</a>}
                      {ev.gpx_url && <a href={ev.gpx_url} target="_blank" rel="noopener noreferrer" style={{ background: '#eff6ff', color: '#2563eb', borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 600, textDecoration: 'none' }}>🗺️ GPX</a>}
                      {ev.roadbook_url && <a href={ev.roadbook_url} target="_blank" rel="noopener noreferrer" style={{ background: '#fef9c3', color: '#ca8a04', borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 600, textDecoration: 'none' }}>📋 Roadbook</a>}
                    </div>
                  )}
                </div>

                {/* Footer — bouton action */}
                <div style={{ padding: '12px 18px', borderTop: '1px solid #f3f4f6' }}>
                  {isInscrit ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>✓ Vous participez à cet événement</span>
                    </div>
                  ) : isPending ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, color: '#F97316', fontWeight: 600 }}>⏳ Demande en attente de validation</span>
                      <button onClick={() => handleAnnuler(ev.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#9ca3af', fontFamily: 'Inter, sans-serif', textDecoration: 'underline' }}>
                        Annuler
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleDemande(ev.id)}
                      disabled={requesting === ev.id}
                      style={{ width: '100%', background: '#1C3829', color: '#fff', border: 'none', borderRadius: 8, padding: '11px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Inter, sans-serif', opacity: requesting === ev.id ? 0.6 : 1 }}>
                      {requesting === ev.id ? 'Envoi...' : '🙋 Je veux participer'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
