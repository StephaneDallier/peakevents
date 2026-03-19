'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#111' }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#9ca3af' }}>&times;</button>
        </div>
        {children}
      </div>
    </div>
  )
}

const btnPrimary = { background: '#1C3829', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }
const btnSecondary = { background: '#fff', color: '#374151', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '7px 13px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }
const btnDanger = { background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 8, padding: '6px 11px', fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }
const selectStyle = { width: '100%', padding: '10px 13px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box', color: '#111', background: '#fff' }
const textareaStyle = { width: '100%', padding: '10px 13px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box', color: '#111', height: 72, resize: 'vertical' }

function PersonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

function getSkills(p) {
  try {
    if (!p.skills) return []
    if (Array.isArray(p.skills)) return p.skills
    if (typeof p.skills === 'string') return JSON.parse(p.skills)
    return []
  } catch { return [] }
}

export default function PageBenevoles({ profile, activeEventId, activeEventName }) {
  const [volunteers, setVolunteers] = useState([])
  const [affMap, setAffMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [available, setAvailable] = useState([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [notes, setNotes] = useState('')
  const [addError, setAddError] = useState('')
  const [adding, setAdding] = useState(false)
  const [removeId, setRemoveId] = useState(null)
  const [toast, setToast] = useState('')

  const canManage = profile?.role === 'admin' || profile?.role === 'organizer'

  useEffect(() => {
    if (activeEventId) loadBenevoles()
  }, [activeEventId])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  async function loadBenevoles() {
    setLoading(true)
    const [volRes, affRes] = await Promise.all([
      supabase.from('event_volunteers').select('*, profiles(*)').eq('event_id', activeEventId),
      supabase.from('assignments').select('volunteer_id, shifts(positions(name))').eq('event_id', activeEventId),
    ])

    const map = {}
    ;(affRes.data || []).forEach(a => {
      const vid = a.volunteer_id
      if (!map[vid]) map[vid] = []
      const pname = a.shifts?.positions?.name
      if (pname && !map[vid].includes(pname)) map[vid].push(pname)
    })

    setVolunteers(volRes.data || [])
    setAffMap(map)
    setLoading(false)
  }

  async function openAddModal() {
    setAddError('')
    setSelectedUserId('')
    setNotes('')
    const existingIds = volunteers.map(v => v.user_id)
    const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name, role').order('last_name')
    setAvailable((profiles || []).filter(p => !existingIds.includes(p.id)))
    setShowAdd(true)
  }

  async function handleAdd() {
    if (!selectedUserId) { setAddError('Sélectionnez un bénévole'); return }
    setAdding(true)
    const { error } = await supabase.from('event_volunteers').insert({ event_id: activeEventId, user_id: selectedUserId, notes, status: 'accepted' })
    setAdding(false)
    if (error) { setAddError(error.message); return }
    setShowAdd(false)
    loadBenevoles()
    showToast('Bénévole ajouté')
  }

  async function handleRemove(evVolId) {
    await supabase.from('event_volunteers').delete().eq('id', evVolId)
    setRemoveId(null)
    loadBenevoles()
    showToast('Bénévole retiré')
  }

  if (!activeEventId) return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', marginBottom: 4 }}>Bénévoles</h1>
      <div style={{ background: '#fff', borderRadius: 12, border: '2px dashed #e5e7eb', padding: 48, textAlign: 'center', marginTop: 20 }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>📅</div>
        <div style={{ fontWeight: 600, color: '#374151', marginBottom: 4 }}>Aucun événement actif</div>
        <div style={{ fontSize: 13, color: '#9ca3af' }}>Sélectionnez un événement dans la page Événements.</div>
      </div>
    </div>
  )

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#1C3829', color: '#fff', borderRadius: 10, padding: '12px 20px', fontSize: 14, fontWeight: 600, zIndex: 2000, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
          {toast}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', marginBottom: 4 }}>Bénévoles</h1>
          <p style={{ fontSize: 14, color: '#6b7280' }}>
            Annuaire des bénévoles inscrits à l'événement.
            {!loading && <span style={{ marginLeft: 8, fontWeight: 600, color: '#1C3829' }}>{volunteers.length} inscrits</span>}
          </p>
        </div>
        {canManage && (
          <button onClick={openAddModal} style={btnPrimary}>+ Ajouter un bénévole</button>
        )}
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                {['Nom', 'Email', 'Téléphone', 'Compétences', 'Affectations'].map(h => (
                  <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 13, fontWeight: 500, color: '#9ca3af', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
                {canManage && <th style={{ padding: '12px 20px' }} />}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Chargement...</td></tr>
              ) : volunteers.length === 0 ? (
                <tr><td colSpan={6}>
                  <div style={{ padding: 48, textAlign: 'center' }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>👥</div>
                    <div style={{ fontWeight: 600, color: '#374151', marginBottom: 4 }}>Aucun bénévole</div>
                    <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 16 }}>Ajoutez des bénévoles à cet événement.</div>
                    {canManage && <button onClick={openAddModal} style={btnPrimary}>+ Ajouter un bénévole</button>}
                  </div>
                </td></tr>
              ) : volunteers.map((ev, i) => {
                const p = ev.profiles || {}
                const skills = getSkills(p)
                const affs = affMap[ev.user_id] || []
                return (
                  <tr key={ev.id} style={{ borderBottom: i < volunteers.length - 1 ? '1px solid #f9fafb' : 'none' }}>
                    {/* Nom */}
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <PersonIcon />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14, color: '#111' }}>{p.first_name || ''} {p.last_name || ''}</div>
                          {p.comment && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>{p.comment}</div>}
                        </div>
                      </div>
                    </td>
                    {/* Email */}
                    <td style={{ padding: '14px 20px', fontSize: 13, color: '#6b7280' }}>{p.email || '-'}</td>
                    {/* Tel */}
                    <td style={{ padding: '14px 20px', fontSize: 13, color: '#374151' }}>{p.phone || '-'}</td>
                    {/* Compétences */}
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {skills.length > 0
                          ? skills.map((s, j) => (
                            <span key={j} style={{ background: '#f3f4f6', color: '#374151', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 500 }}>{s}</span>
                          ))
                          : <span style={{ color: '#d1d5db', fontSize: 13 }}>-</span>}
                      </div>
                    </td>
                    {/* Affectations */}
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {affs.length > 0
                          ? affs.map((a, j) => (
                            <span key={j} style={{ background: '#F97316', color: '#fff', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 600 }}>{a}</span>
                          ))
                          : <span style={{ color: '#d1d5db', fontSize: 13 }}>-</span>}
                      </div>
                    </td>
                    {/* Actions */}
                    {canManage && (
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <button onClick={() => setRemoveId(ev.id)} style={btnDanger}>Retirer</button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <Modal title="Ajouter un bénévole" onClose={() => setShowAdd(false)}>
          {addError && <div style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 8, padding: '10px 13px', fontSize: 13, marginBottom: 14 }}>{addError}</div>}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Bénévole</label>
            <select style={selectStyle} value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}>
              <option value="">- Choisir -</option>
              {available.map(p => (
                <option key={p.id} value={p.id}>{p.first_name || ''} {p.last_name || ''} ({p.role})</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Notes (optionnel)</label>
            <textarea style={textareaStyle} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes sur ce bénévole..." />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setShowAdd(false)} style={btnSecondary}>Annuler</button>
            <button onClick={handleAdd} disabled={adding} style={{ ...btnPrimary, opacity: adding ? 0.6 : 1 }}>
              {adding ? 'Ajout...' : 'Ajouter'}
            </button>
          </div>
        </Modal>
      )}

      {removeId && (
        <Modal title="Retirer le bénévole" onClose={() => setRemoveId(null)}>
          <p style={{ fontSize: 14, color: '#374151', marginBottom: 24 }}>Êtes-vous sûr de vouloir retirer ce bénévole de l'événement ?</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setRemoveId(null)} style={btnSecondary}>Annuler</button>
            <button onClick={() => handleRemove(removeId)} style={{ ...btnPrimary, background: '#dc2626' }}>Retirer</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
