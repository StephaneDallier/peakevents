'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#111' }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#9ca3af' }}>&times;</button>
        </div>
        {children}
      </div>
    </div>
  )
}

const selectStyle = { width: '100%', padding: '10px 13px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box', color: '#111', background: '#fff' }
const btnPrimary = { background: '#1C3829', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }
const btnSecondary = { background: '#fff', color: '#374151', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '7px 13px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }
const btnSuccess = { background: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac', borderRadius: 8, padding: '6px 12px', fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }
const btnDanger = { background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 8, padding: '4px 8px', fontWeight: 600, fontSize: 11, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }


function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    function check() { setIsMobile(window.innerWidth < 768) }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return isMobile
}

export default function PageAffectations({ profile, activeEventId, activeEventName }) {
  const [allEvents, setAllEvents] = useState([])
  const [currentEventId, setCurrentEventId] = useState(activeEventId)
  const [currentEventName, setCurrentEventName] = useState(activeEventName)

  useEffect(() => {
    setCurrentEventId(activeEventId)
    setCurrentEventName(activeEventName)
  }, [activeEventId, activeEventName])

  useEffect(() => {
    supabase.from('events').select('id, name').neq('status', 'archived').order('start_date')
      .then(({ data }) => setAllEvents(data || []))
  }, [])

  const [postes, setPostes] = useState([])
  const [loading, setLoading] = useState(true)
  const [affectModal, setAffectModal] = useState(null) // { shiftId, posteName }
  const [available, setAvailable] = useState([])
  const [selectedVol, setSelectedVol] = useState('')
  const [affectError, setAffectError] = useState('')
  const [affecting, setAffecting] = useState(false)
  const [toast, setToast] = useState('')

  const isMobile = useIsMobile()
  const canManage = profile?.role === 'admin' || profile?.role === 'organizer'

  useEffect(() => {
    if (currentEventId) loadPostes()
  }, [currentEventId])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  async function loadPostes() {
    setLoading(true)
    const { data } = await supabase
      .from('positions')
      .select('*, shifts(*, assignments(id, volunteer_id, profiles(first_name, last_name)))')
      .eq('event_id', currentEventId)
      .order('name')
    setPostes(data || [])
    setLoading(false)
  }

  async function openAffectModal(shiftId, posteName) {
    setAffectError('')
    setSelectedVol('')
    // Charger bénévoles de l'événement pas encore affectés à ce créneau
    const { data: evVols } = await supabase
      .from('event_volunteers')
      .select('user_id, profiles(first_name, last_name)')
      .eq('event_id', currentEventId)
      .eq('status', 'accepted')
    const { data: existing } = await supabase
      .from('assignments')
      .select('volunteer_id')
      .eq('shift_id', shiftId)
    const exIds = (existing || []).map(a => a.volunteer_id)
    const avail = (evVols || []).filter(v => !exIds.includes(v.user_id))
    setAvailable(avail)
    setAffectModal({ shiftId, posteName })
  }

  async function handleAffect() {
    if (!selectedVol) { setAffectError('Sélectionnez un bénévole'); return }
    setAffecting(true)
    const { error } = await supabase.from('assignments').insert({
      shift_id: affectModal.shiftId,
      volunteer_id: selectedVol,
      event_id: currentEventId,
    })
    setAffecting(false)
    if (error) { setAffectError(error.message); return }
    setAffectModal(null)
    loadPostes()
    showToast('Bénévole affecté')
  }

  async function handleRetirer(assignmentId) {
    await supabase.from('assignments').delete().eq('id', assignmentId)
    loadPostes()
    showToast('Affectation retirée')
  }

  if (!currentEventId) return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', marginBottom: 4 }}>Affectations</h1>
          {/* Sélecteur d'événement */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
            <span style={{ fontSize: 13, color: '#6b7280' }}>Événement :</span>
            <select value={currentEventId || ''}
              onChange={e => { const ev = allEvents.find(x => x.id === e.target.value); setCurrentEventId(e.target.value); setCurrentEventName(ev?.name || '') }}
              style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, fontFamily: 'Inter, sans-serif', color: '#111', background: '#fff', cursor: 'pointer' }}>
              <option value="">- Choisir -</option>
              {allEvents.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
            </select>
          </div>
      <div style={{ background: '#fff', borderRadius: 12, border: '2px dashed #e5e7eb', padding: 48, textAlign: 'center', marginTop: 20 }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
        <div style={{ fontWeight: 600, color: '#374151', marginBottom: 4 }}>Aucun événement actif</div>
        <div style={{ fontSize: 13, color: '#9ca3af' }}>Sélectionnez un événement dans la page Événements.</div>
      </div>
    </div>
  )

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#1C3829', color: '#fff', borderRadius: 10, padding: '12px 20px', fontSize: 14, fontWeight: 600, zIndex: 2000, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
          {toast}
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', marginBottom: 4 }}>Affectations</h1>
          {/* Sélecteur d'événement */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
            <span style={{ fontSize: 13, color: '#6b7280' }}>Événement :</span>
            <select value={currentEventId || ''}
              onChange={e => { const ev = allEvents.find(x => x.id === e.target.value); setCurrentEventId(e.target.value); setCurrentEventName(ev?.name || '') }}
              style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, fontFamily: 'Inter, sans-serif', color: '#111', background: '#fff', cursor: 'pointer' }}>
              <option value="">- Choisir -</option>
              {allEvents.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
            </select>
          </div>
        <p style={{ fontSize: 14, color: '#6b7280' }}>
          Affectez les bénévoles aux postes &mdash; <strong style={{ color: '#1C3829' }}>{currentEventName || 'événement actif'}</strong>
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>Chargement...</div>
      ) : postes.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, border: '2px dashed #e5e7eb', padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📍</div>
          <div style={{ fontWeight: 600, color: '#374151', marginBottom: 4 }}>Aucun poste créé</div>
          <div style={{ fontSize: 13, color: '#9ca3af' }}>Créez d'abord des postes dans la page Postes.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {postes.map(p => {
            const req = p.volunteers_required || 0
            const shifts = p.shifts || []
            const totalAff = shifts.reduce((s, sh) => s + (sh.assignments?.length || 0), 0)
            const complet = req > 0 && totalAff >= req

            return (
              <div key={p.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                {/* Header poste */}
                <div style={{ padding: '14px 20px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#111' }}>{p.name}</div>
                    {p.location && <span style={{ fontSize: 12, color: '#6b7280' }}>📍 {p.location}</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, color: complet ? '#16a34a' : '#ca8a04', fontWeight: 600 }}>
                      👥 {totalAff}/{req}
                    </span>
                    <span style={{ background: complet ? '#dcfce7' : '#fef9c3', color: complet ? '#16a34a' : '#ca8a04', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                      {complet ? 'Complet' : 'Incomplet'}
                    </span>
                  </div>
                </div>

                {/* Créneaux */}
                {shifts.length === 0 ? (
                  <div style={{ padding: '16px 20px', fontSize: 13, color: '#9ca3af', fontStyle: 'italic' }}>
                    Aucun créneau défini pour ce poste.
                  </div>
                ) : (
                  shifts.map(sh => {
                    const t1 = sh.start_time?.slice(0, 5) || ''
                    const t2 = sh.end_time?.slice(0, 5) || ''
                    const assignments = sh.assignments || []

                    return (
                      <div key={sh.id} style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
                        {/* Créneau horaire */}
                        {(t1 || t2) && (
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ background: '#1C3829', color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 11 }}>🕐 {t1} - {t2}</span>
                          </div>
                        )}

                        {/* Bénévoles affectés */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                          {assignments.map(a => (
                            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#eff6ff', borderRadius: 20, padding: '4px 10px 4px 10px' }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: '#2563eb' }}>
                                {a.profiles?.first_name || ''} {a.profiles?.last_name || ''}
                              </span>
                              {canManage && (
                                <button onClick={() => handleRetirer(a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#93c5fd', fontSize: 14, lineHeight: 1, padding: 0 }} title="Retirer">
                                  &times;
                                </button>
                              )}
                            </div>
                          ))}
                          {canManage && (
                            <button onClick={() => openAffectModal(sh.id, p.name)} style={btnSuccess}>
                              + Affecter un bénévole
                            </button>
                          )}
                          {assignments.length === 0 && !canManage && (
                            <span style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic' }}>Aucun bénévole affecté</span>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal affectation */}
      {affectModal && (
        <Modal title={`Affecter à : ${affectModal.posteName}`} onClose={() => setAffectModal(null)}>
          {affectError && <div style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 8, padding: '10px 13px', fontSize: 13, marginBottom: 14 }}>{affectError}</div>}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Bénévole</label>
            {available.length === 0 ? (
              <div style={{ fontSize: 13, color: '#9ca3af', padding: '12px 0' }}>
                Tous les bénévoles inscrits sont déjà affectés à ce créneau.
              </div>
            ) : (
              <select style={selectStyle} value={selectedVol} onChange={e => setSelectedVol(e.target.value)}>
                <option value="">- Choisir -</option>
                {available.map(v => (
                  <option key={v.user_id} value={v.user_id}>
                    {v.profiles?.first_name || ''} {v.profiles?.last_name || ''}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setAffectModal(null)} style={btnSecondary}>Annuler</button>
            {available.length > 0 && (
              <button onClick={handleAffect} disabled={affecting || !selectedVol}
                style={{ ...btnPrimary, opacity: affecting || !selectedVol ? 0.6 : 1 }}>
                {affecting ? 'Affectation...' : 'Affecter'}
              </button>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
