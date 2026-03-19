'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const COLORS = ['#1C3829', '#F97316', '#2563EB', '#7C3AED', '#DC2626', '#0891B2', '#2D5A3D', '#CA8A04']
const START_H = 5
const END_H = 22
const HOURS = Array.from({ length: END_H - START_H + 1 }, (_, i) => START_H + i)
const TOTAL_MIN = HOURS.length * 60

export default function PagePlanning({ profile, activeEventId, activeEventName }) {
  const [postes, setPostes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (activeEventId) loadPlanning()
  }, [activeEventId])

  async function loadPlanning() {
    setLoading(true)
    const { data } = await supabase
      .from('positions')
      .select('*, shifts(*, assignments(*, profiles(first_name, last_name)))')
      .eq('event_id', activeEventId)
      .order('name')
    setPostes(data || [])
    setLoading(false)
  }

  if (!activeEventId) return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', marginBottom: 4 }}>Planning</h1>
      <div style={{ background: '#fff', borderRadius: 12, border: '2px dashed #e5e7eb', padding: 48, textAlign: 'center', marginTop: 20 }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>📅</div>
        <div style={{ fontWeight: 600, color: '#374151' }}>Aucun événement actif</div>
        <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>Sélectionnez un événement dans la page Événements.</div>
      </div>
    </div>
  )

  const postesAvecCreneaux = postes.filter(p => p.shifts?.some(sh => sh.start_time && sh.end_time))

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', marginBottom: 4 }}>Planning</h1>
        <p style={{ fontSize: 14, color: '#6b7280' }}>
          Vue globale des créneaux &mdash; <strong style={{ color: '#1C3829' }}>{activeEventName || 'événement actif'}</strong>
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>Chargement...</div>
      ) : postesAvecCreneaux.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, border: '2px dashed #e5e7eb', padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📅</div>
          <div style={{ fontWeight: 600, color: '#374151', marginBottom: 4 }}>Aucun créneau défini</div>
          <div style={{ fontSize: 13, color: '#9ca3af' }}>Définissez des horaires sur vos postes pour voir le planning.</div>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          {/* En-tête heures */}
          <div style={{ display: 'flex', borderBottom: '2px solid #e5e7eb', background: '#f9fafb' }}>
            <div style={{ width: 180, flexShrink: 0, padding: '10px 16px', fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Poste</div>
            <div style={{ flex: 1, display: 'flex', position: 'relative' }}>
              {HOURS.map(h => (
                <div key={h} style={{ flex: 1, textAlign: 'center', padding: '10px 0', fontSize: 11, fontWeight: 600, color: '#9ca3af', borderLeft: '1px solid #f3f4f6' }}>
                  {h}h
                </div>
              ))}
            </div>
          </div>

          {/* Lignes postes */}
          {postesAvecCreneaux.map((p, pi) => {
            const req = p.volunteers_required || 0
            const aff = p.shifts?.reduce((s, sh) => s + (sh.assignments?.length || 0), 0) || 0
            const ok = req > 0 && aff >= req
            const color = COLORS[pi % COLORS.length]

            return (
              <div key={p.id} style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', minHeight: 56 }}>
                {/* Info poste */}
                <div style={{ width: 180, flexShrink: 0, padding: '10px 16px', borderRight: '1px solid #f3f4f6' }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#111', marginBottom: 2 }}>{p.name}</div>
                  {p.location && <div style={{ fontSize: 11, color: '#9ca3af' }}>📍 {p.location}</div>}
                  <span style={{ display: 'inline-block', marginTop: 4, background: ok ? '#dcfce7' : '#fef9c3', color: ok ? '#16a34a' : '#ca8a04', borderRadius: 20, padding: '1px 8px', fontSize: 10, fontWeight: 700 }}>
                    {aff}/{req}
                  </span>
                </div>

                {/* Timeline */}
                <div style={{ flex: 1, position: 'relative' }}>
                  {/* Colonnes heures */}
                  {HOURS.map((h, i) => (
                    <div key={h} style={{ position: 'absolute', top: 0, bottom: 0, left: `${(i / HOURS.length) * 100}%`, width: `${(1 / HOURS.length) * 100}%`, borderLeft: '1px solid #f3f4f6' }} />
                  ))}

                  {/* Blocs créneaux */}
                  {p.shifts?.filter(sh => sh.start_time && sh.end_time).map(sh => {
                    const [h1, m1] = sh.start_time.split(':').map(Number)
                    const [h2, m2] = sh.end_time.split(':').map(Number)
                    const sm = (h1 - START_H) * 60 + m1
                    const em = (h2 - START_H) * 60 + m2
                    const left = Math.max(0, (sm / TOTAL_MIN) * 100)
                    const width = Math.max(1, ((em - sm) / TOTAL_MIN) * 100)
                    const names = (sh.assignments || [])
                      .map(a => `${a.profiles?.first_name || ''} ${a.profiles?.last_name || ''}`.trim())
                      .filter(Boolean).join(', ')

                    return (
                      <div key={sh.id} style={{
                        position: 'absolute', top: 8, bottom: 8,
                        left: `${left}%`, width: `${width}%`,
                        background: color, borderRadius: 6,
                        padding: '4px 8px', overflow: 'hidden',
                        display: 'flex', flexDirection: 'column', justifyContent: 'center',
                      }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {sh.start_time.slice(0, 5)}-{sh.end_time.slice(0, 5)}
                        </div>
                        {names && (
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {names}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Légende */}
      {postesAvecCreneaux.length > 0 && (
        <div style={{ marginTop: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {postesAvecCreneaux.map((p, pi) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#374151' }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: COLORS[pi % COLORS.length], flexShrink: 0 }} />
              {p.name}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
