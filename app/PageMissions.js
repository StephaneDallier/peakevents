'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const btnPrimary = { background: '#1C3829', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }
const btnSecondary = { background: '#fff', color: '#374151', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '9px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }
const inputStyle = { width: '100%', padding: '10px 13px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box', color: '#111' }

const REQUEST_TYPES = [
  { id: 'materiel', label: 'Demande de matériel', icon: '🎒', color: '#7c3aed', bg: '#f3e8ff' },
  { id: 'consigne', label: 'Question sur les consignes', icon: '❓', color: '#2563eb', bg: '#eff6ff' },
  { id: 'indispo', label: 'Indisponibilité / Retard', icon: '⚠️', color: '#dc2626', bg: '#fef2f2' },
  { id: 'changement', label: 'Demande de changement de poste', icon: '🔄', color: '#ea580c', bg: '#fff7ed' },
  { id: 'message', label: 'Message libre', icon: '💬', color: '#0891b2', bg: '#e0f2fe' },
]

const STATUS_MISSION = {
  pending: { label: 'Non démarrée', color: '#6b7280', bg: '#f3f4f6' },
  started: { label: 'En cours', color: '#2563eb', bg: '#dbeafe' },
  completed: { label: 'Terminée', color: '#16a34a', bg: '#dcfce7' },
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#111' }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#9ca3af' }}>&times;</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// Vue bénévole
function VueBenevole({ profile }) {
  const [missions, setMissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showRequest, setShowRequest] = useState(null)
  const [reqType, setReqType] = useState('')
  const [reqMessage, setReqMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [toast, setToast] = useState('')
  const [myRequests, setMyRequests] = useState([])

  useEffect(() => { loadMissions() }, [])

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  async function loadMissions() {
    setLoading(true)
    const [missRes, reqRes] = await Promise.all([
      supabase.from('assignments')
        .select('*, shifts(start_time, end_time, positions(name, location, instructions, event_id, events(name)))')
        .eq('volunteer_id', profile.id),
      supabase.from('mission_requests')
        .select('*').eq('volunteer_id', profile.id).order('created_at', { ascending: false })
    ])
    setMissions(missRes.data || [])
    setMyRequests(reqRes.data || [])
    setLoading(false)
  }

  async function handleStatusChange(assignmentId, newStatus) {
    const update = { status: newStatus }
    if (newStatus === 'started') update.started_at = new Date().toISOString()
    if (newStatus === 'completed') update.completed_at = new Date().toISOString()
    await supabase.from('assignments').update(update).eq('id', assignmentId)
    loadMissions()
    showToast(newStatus === 'started' ? 'Mission démarrée ✓' : 'Mission clôturée ✓')
  }

  async function handleSendRequest() {
    if (!reqType || !reqMessage.trim()) return
    setSending(true)
    const mission = showRequest
    await supabase.from('mission_requests').insert({
      assignment_id: mission.id,
      event_id: mission.shifts?.positions?.event_id,
      volunteer_id: profile.id,
      type: reqType,
      message: reqMessage.trim(),
      status: 'pending',
    })
    setSending(false)
    setShowRequest(null)
    setReqType('')
    setReqMessage('')
    loadMissions()
    showToast('Demande envoyée à l\'organisateur ✓')
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>Chargement...</div>

  return (
    <div>
      {toast && <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#1C3829', color: '#fff', borderRadius: 10, padding: '12px 20px', fontSize: 14, fontWeight: 600, zIndex: 2000, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>{toast}</div>}

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', marginBottom: 4 }}>Mes missions</h1>
        <p style={{ fontSize: 14, color: '#6b7280' }}>Consultez vos affectations et gérez vos missions.</p>
      </div>

      {missions.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, border: '2px dashed #e5e7eb', padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
          <div style={{ fontWeight: 600, color: '#374151', marginBottom: 4 }}>Aucune mission</div>
          <div style={{ fontSize: 13, color: '#9ca3af' }}>L'organisateur vous affectera à des postes prochainement.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {missions.map(m => {
            const pos = m.shifts?.positions
            const ev = pos?.events
            const t1 = m.shifts?.start_time?.slice(0, 5) || ''
            const t2 = m.shifts?.end_time?.slice(0, 5) || ''
            const st = STATUS_MISSION[m.status || 'pending']
            const missionReqs = myRequests.filter(r => r.assignment_id === m.id)

            return (
              <div key={m.id} style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                {/* Header mission */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16, color: '#111', marginBottom: 4 }}>{pos?.name || 'Poste'}</div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 13, color: '#6b7280', flexWrap: 'wrap' }}>
                      {ev?.name && <span>📅 {ev.name}</span>}
                      {pos?.location && <span>📍 {pos.location}</span>}
                      {t1 && t2 && <span>🕐 {t1} – {t2}</span>}
                    </div>
                  </div>
                  <span style={{ background: st.bg, color: st.color, borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700, flexShrink: 0, marginLeft: 12 }}>
                    {st.label}
                  </span>
                </div>

                {/* Consignes */}
                {pos?.instructions && (
                  <div style={{ margin: '12px 20px', background: '#f0fdf4', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#1C3829', marginBottom: 4 }}>📋 Consignes</div>
                    <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{pos.instructions}</div>
                  </div>
                )}

                {/* Actions mission */}
                <div style={{ padding: '12px 20px', display: 'flex', gap: 8, flexWrap: 'wrap', borderBottom: '1px solid #f3f4f6' }}>
                  {(!m.status || m.status === 'pending') && (
                    <button onClick={() => handleStatusChange(m.id, 'started')}
                      style={{ background: '#1C3829', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                      ▶ Démarrer la mission
                    </button>
                  )}
                  {m.status === 'started' && (
                    <button onClick={() => handleStatusChange(m.id, 'completed')}
                      style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                      ✓ Clôturer la mission
                    </button>
                  )}
                  {m.status === 'completed' && (
                    <div style={{ fontSize: 13, color: '#16a34a', fontWeight: 600, padding: '9px 0' }}>
                      ✓ Mission terminée {m.completed_at ? `à ${new Date(m.completed_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : ''}
                    </div>
                  )}
                  <button onClick={() => { setShowRequest(m); setReqType(''); setReqMessage('') }}
                    style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 8, padding: '9px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                    💬 Contacter l'organisateur
                  </button>
                </div>

                {/* Demandes envoyées pour cette mission */}
                {missionReqs.length > 0 && (
                  <div style={{ padding: '12px 20px' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Mes demandes</div>
                    {missionReqs.map(r => {
                      const rt = REQUEST_TYPES.find(x => x.id === r.type) || REQUEST_TYPES[4]
                      const statusReq = { pending: { label: 'En attente', color: '#6b7280' }, read: { label: 'Lu', color: '#2563eb' }, resolved: { label: 'Résolu', color: '#16a34a' } }
                      const sr = statusReq[r.status] || statusReq.pending
                      return (
                        <div key={r.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: '1px solid #f9fafb' }}>
                          <span style={{ fontSize: 16, flexShrink: 0 }}>{rt.icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: rt.color, marginBottom: 2 }}>{rt.label}</div>
                            <div style={{ fontSize: 13, color: '#374151' }}>{r.message}</div>
                          </div>
                          <span style={{ fontSize: 11, color: sr.color, fontWeight: 600, flexShrink: 0 }}>{sr.label}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal demande */}
      {showRequest && (
        <Modal title="Contacter l'organisateur" onClose={() => setShowRequest(null)}>
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
            Mission : <strong style={{ color: '#111' }}>{showRequest.shifts?.positions?.name}</strong>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Type de demande</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {REQUEST_TYPES.map(rt => (
                <button key={rt.id} onClick={() => setReqType(rt.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', border: '2px solid', borderRadius: 10, cursor: 'pointer', fontFamily: 'Inter, sans-serif', textAlign: 'left',
                    background: reqType === rt.id ? rt.bg : '#fff',
                    borderColor: reqType === rt.id ? rt.color : '#e5e7eb',
                    color: reqType === rt.id ? rt.color : '#374151',
                    fontWeight: reqType === rt.id ? 700 : 400
                  }}>
                  <span style={{ fontSize: 18 }}>{rt.icon}</span>
                  <span style={{ fontSize: 13 }}>{rt.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Message *</div>
            <textarea style={{ ...inputStyle, height: 80, resize: 'vertical' }} value={reqMessage} onChange={e => setReqMessage(e.target.value)} placeholder="Décrivez votre demande..." />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setShowRequest(null)} style={btnSecondary}>Annuler</button>
            <button onClick={handleSendRequest} disabled={!reqType || !reqMessage.trim() || sending}
              style={{ ...btnPrimary, opacity: (!reqType || !reqMessage.trim() || sending) ? 0.6 : 1 }}>
              {sending ? 'Envoi...' : 'Envoyer'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// Vue organisateur/admin — suivi des missions + demandes
function VueOrganisateur({ profile, activeEventId, activeEventName }) {
  const [missions, setMissions] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('missions')
  const [toast, setToast] = useState('')

  useEffect(() => { if (activeEventId) loadAll() }, [activeEventId])

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  async function loadAll() {
    setLoading(true)
    const [missRes, reqRes] = await Promise.all([
      supabase.from('assignments')
        .select('*, profiles(first_name, last_name), shifts(start_time, end_time, positions(name, location))')
        .eq('event_id', activeEventId)
        .order('status'),
      supabase.from('mission_requests')
        .select('*, profiles(first_name, last_name), assignments(shifts(positions(name)))')
        .eq('event_id', activeEventId)
        .order('created_at', { ascending: false })
    ])
    setMissions(missRes.data || [])
    setRequests(reqRes.data || [])
    setLoading(false)
  }

  async function handleResolve(reqId) {
    await supabase.from('mission_requests').update({ status: 'resolved' }).eq('id', reqId)
    loadAll()
    showToast('Demande marquée comme résolue')
  }

  async function handleMarkRead(reqId) {
    await supabase.from('mission_requests').update({ status: 'read' }).eq('id', reqId)
    loadAll()
  }

  const pending = requests.filter(r => r.status === 'pending').length
  const started = missions.filter(m => m.status === 'started').length
  const completed = missions.filter(m => m.status === 'completed').length

  const tabStyle = (t) => ({
    padding: '8px 16px', border: 'none', borderRadius: 8, cursor: 'pointer',
    fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600,
    background: activeTab === t ? '#1C3829' : 'transparent',
    color: activeTab === t ? '#fff' : '#6b7280',
    position: 'relative'
  })

  return (
    <div>
      {toast && <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#1C3829', color: '#fff', borderRadius: 10, padding: '12px 20px', fontSize: 14, fontWeight: 600, zIndex: 2000, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>{toast}</div>}

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', marginBottom: 4 }}>Suivi des missions</h1>
        <p style={{ fontSize: 14, color: '#6b7280' }}>
          {activeEventName ? <><strong style={{ color: '#1C3829' }}>{activeEventName}</strong> — </> : ''}
          {missions.length} affectation{missions.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total', value: missions.length, color: '#374151', bg: '#f9fafb' },
          { label: 'En cours', value: started, color: '#2563eb', bg: '#eff6ff' },
          { label: 'Terminées', value: completed, color: '#16a34a', bg: '#dcfce7' },
          { label: 'Demandes', value: pending, color: pending > 0 ? '#dc2626' : '#6b7280', bg: pending > 0 ? '#fef2f2' : '#f9fafb' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 10, border: '1px solid #e5e7eb', padding: '12px 16px' }}>
            <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: '#f9fafb', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        <button onClick={() => setActiveTab('missions')} style={tabStyle('missions')}>
          Missions {started > 0 && <span style={{ background: '#2563eb', color: '#fff', borderRadius: 20, padding: '0 6px', fontSize: 10, fontWeight: 700, marginLeft: 4 }}>{started}</span>}
        </button>
        <button onClick={() => setActiveTab('demandes')} style={tabStyle('demandes')}>
          Demandes {pending > 0 && <span style={{ background: '#dc2626', color: '#fff', borderRadius: 20, padding: '0 6px', fontSize: 10, fontWeight: 700, marginLeft: 4 }}>{pending}</span>}
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>Chargement...</div>
      ) : activeTab === 'missions' ? (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          {missions.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#9ca3af' }}>Aucune affectation sur cet événement.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  {['Bénévole', 'Poste', 'Lieu', 'Créneau', 'Statut', 'Horaires'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {missions.map((m, i) => {
                  const st = STATUS_MISSION[m.status || 'pending']
                  const t1 = m.shifts?.start_time?.slice(0, 5) || ''
                  const t2 = m.shifts?.end_time?.slice(0, 5) || ''
                  return (
                    <tr key={m.id} style={{ borderBottom: i < missions.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                      <td style={{ padding: '11px 16px', fontWeight: 600, color: '#111' }}>
                        {m.profiles?.first_name} {m.profiles?.last_name}
                      </td>
                      <td style={{ padding: '11px 16px', color: '#374151' }}>{m.shifts?.positions?.name || '-'}</td>
                      <td style={{ padding: '11px 16px', color: '#6b7280' }}>{m.shifts?.positions?.location || '-'}</td>
                      <td style={{ padding: '11px 16px', color: '#6b7280' }}>{t1 && t2 ? `${t1} – ${t2}` : '-'}</td>
                      <td style={{ padding: '11px 16px' }}>
                        <span style={{ background: st.bg, color: st.color, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>{st.label}</span>
                      </td>
                      <td style={{ padding: '11px 16px', fontSize: 11, color: '#9ca3af' }}>
                        {m.started_at && <div>▶ {new Date(m.started_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>}
                        {m.completed_at && <div>✓ {new Date(m.completed_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {requests.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 12, border: '2px dashed #e5e7eb', padding: 48, textAlign: 'center', color: '#9ca3af' }}>
              Aucune demande pour le moment.
            </div>
          ) : requests.map(r => {
            const rt = REQUEST_TYPES.find(x => x.id === r.type) || REQUEST_TYPES[4]
            const statusReq = { pending: { label: 'En attente', color: '#dc2626', bg: '#fef2f2' }, read: { label: 'Lu', color: '#2563eb', bg: '#eff6ff' }, resolved: { label: 'Résolu', color: '#16a34a', bg: '#dcfce7' } }
            const sr = statusReq[r.status] || statusReq.pending
            return (
              <div key={r.id} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${r.status === 'pending' ? '#fca5a5' : '#e5e7eb'}`, padding: '16px 20px' }}
                onClick={() => r.status === 'pending' && handleMarkRead(r.id)}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 20 }}>{rt.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#111' }}>{r.profiles?.first_name} {r.profiles?.last_name}</div>
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>
                        {rt.label} · {r.assignments?.shifts?.positions?.name} · {new Date(r.created_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ background: sr.bg, color: sr.color, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>{sr.label}</span>
                    {r.status !== 'resolved' && (
                      <button onClick={e => { e.stopPropagation(); handleResolve(r.id) }}
                        style={{ background: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 8, padding: '5px 12px', fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                        ✓ Résolu
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
                  {r.message}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function PageMissions({ profile, activeEventId, activeEventName }) {
  const isOrga = profile?.role === 'admin' || profile?.role === 'organizer'
  if (isOrga) return <VueOrganisateur profile={profile} activeEventId={activeEventId} activeEventName={activeEventName} />
  return <VueBenevole profile={profile} />
}
