'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function PageMissions({ profile }) {
  const [missions, setMissions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile?.id) loadMissions()
  }, [profile])

  async function loadMissions() {
    setLoading(true)
    const { data } = await supabase
      .from('assignments')
      .select('*, shifts(start_time, end_time, positions(name, location, instructions, events(name, start_date)))')
      .eq('volunteer_id', profile.id)
    setMissions(data || [])
    setLoading(false)
  }

  function formatDate(d) {
    if (!d) return ''
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', marginBottom: 4 }}>Mes missions</h1>
        <p style={{ fontSize: 14, color: '#6b7280' }}>
          Vos affectations et horaires
          {!loading && missions.length > 0 && (
            <span style={{ marginLeft: 8, background: '#f0fdf4', color: '#16a34a', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>
              {missions.length} mission{missions.length > 1 ? 's' : ''}
            </span>
          )}
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>Chargement...</div>
      ) : missions.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, border: '2px dashed #e5e7eb', padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
          <div style={{ fontWeight: 600, color: '#374151', marginBottom: 4 }}>Aucune mission assignée</div>
          <div style={{ fontSize: 13, color: '#9ca3af' }}>L'organisateur vous contactera pour vous affecter à un poste.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {missions.map(a => {
            const sh = a.shifts
            const pos = sh?.positions
            const event = pos?.events

            return (
              <div key={a.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                {/* Header */}
                <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#111', marginBottom: 4 }}>
                      {pos?.name || '-'}
                    </div>
                    <div style={{ fontSize: 13, color: '#6b7280', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {event?.name && <span>📅 {event.name}</span>}
                      {event?.start_date && <span>{formatDate(event.start_date)}</span>}
                      {pos?.location && <span>📍 {pos.location}</span>}
                    </div>
                  </div>
                  {sh?.start_time && (
                    <div style={{ background: '#1C3829', color: '#fff', borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
                      🕐 {sh.start_time.slice(0, 5)} - {sh.end_time?.slice(0, 5) || '?'}
                    </div>
                  )}
                </div>

                {/* Consignes */}
                {pos?.instructions && (
                  <div style={{ margin: '0 20px 16px', background: '#f0fdf4', borderRadius: 8, padding: '12px 14px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#1C3829', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      📋 Consignes
                    </div>
                    <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
                      {pos.instructions}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
