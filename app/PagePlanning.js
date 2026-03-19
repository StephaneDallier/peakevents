'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const START_H = 5
const END_H = 18
const HOURS = Array.from({ length: END_H - START_H + 1 }, (_, i) => START_H + i)
const TOTAL_MIN = HOURS.length * 60
const COLORS_COMPLET = ['#1C3829', '#2D5A3D', '#0891b2', '#1d4ed8', '#7c3aed']
const COLORS_INCOMPLET = ['#F97316', '#ea580c', '#f59e0b', '#dc2626', '#db2777']

export default function PagePlanning({ profile, activeEventId, activeEventName }) {
  const [postes, setPostes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (activeEventId) loadPlanning() }, [activeEventId])

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
      </div>
    </div>
  )

  const postesAvecCreneaux = postes.filter(p => p.shifts?.some(sh => sh.start_time && sh.end_time))

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', marginBottom: 4 }}>Planning</h1>
        <p style={{ fontSize: 14, color: '#6b7280' }}>Vue globale du planning de l'événement.</p>
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
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          {/* En-tête heures */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ width: 200, flexShrink: 0, padding: '12px 20px', fontSize: 13, fontWeight: 600, color: '#374151' }}>Poste</div>
            <div style={{ flex: 1, display: 'flex' }}>
              {HOURS.map(h => (
                <div key={h} style={{ flex: 1, textAlign: 'center', padding: '12px 0', fontSize: 12, fontWeight: 500, color: '#9ca3af', borderLeft: '1px solid #f3f4f6' }}>
                  {h}h
                </div>
              ))}
            </div>
          </div>

          {/* Lignes */}
          {postesAvecCreneaux.map((p, pi) => {
            const req = p.volunteers_required || 0
            const aff = p.shifts?.reduce((s, sh) => s + (sh.assignments?.length || 0), 0) || 0
            const complet = req > 0 && aff >= req
            const color = complet
              ? COLORS_COMPLET[pi % COLORS_COMPLET.length]
              : COLORS_INCOMPLET[pi % COLORS_INCOMPLET.length]

            return (
              <div key={p.id} style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', minHeight: 70 }}>
                {/* Info poste */}
                <div style={{ width: 200, flexShrink: 0, padding: '14px 20px', borderRight: '1px solid #f3f4f6' }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#111', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                  {p.location && <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.location}</div>}
                  <span style={{
                    display: 'inline-block',
                    background: complet ? '#dcfce7' : '#fff7ed',
                    color: complet ? '#16a34a' : '#ea580c',
                    borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 700
                  }}>
                    {aff}/{req}
                  </span>
                </div>

                {/* Timeline */}
                <div style={{ flex: 1, position: 'relative', padding: '8px 0' }}>
                  {/* Colonnes heures */}
                  {HOURS.map((h, i) => (
                    <div key={h} style={{ position: 'absolute', top: 0, bottom: 0, left: `${(i / HOURS.length) * 100}%`, borderLeft: '1px solid #f9fafb', pointerEvents: 'none' }} />
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
                      .filter(Boolean)

                    return (
                      <div key={sh.id} style={{
                        position: 'absolute', top: 8, bottom: 8,
                        left: `${left}%`, width: `${width}%`,
                        background: color, borderRadius: 8,
                        padding: '6px 10px', overflow: 'hidden',
                        display: 'flex', flexDirection: 'column', justifyContent: 'center',
                        cursor: 'default',
                      }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#fff', marginBottom: names.length > 0 ? 2 : 0 }}>
                          {sh.start_time.slice(0, 5)}-{sh.end_time.slice(0, 5)}
                        </div>
                        {names.length > 0 && (
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {names.join(', ')}
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
    </div>
  )
}
