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

function Avatar({ first, last }) {
  const initials = ((first?.[0] || '') + (last?.[0] || '')).toUpperCase() || '?'
  return (
    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1C3829', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
      {initials}
    </div>
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

function StatusBadge({ status }) {
  const map = {
    accepted: { bg: '#dcfce7', color: '#16a34a', label: 'Accepte' },
    pending: { bg: '#fef9c3', color: '#ca8a04', label: 'En attente' },
    refused: { bg: '#fef2f2', color: '#dc2626', label: 'Refuse' },
  }
  const s = map[status] || map.accepted
  return <span style={{ background: s.bg, color: s.color, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>{s.label}</span>
}

export default function PageBenevoles({ profile, activeEventId, activeEventName }) {
  const [volunteers, setVolunteers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [available, setAvailable] = useState([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [notes, setNotes] = useState('')
  const [addError, setAddError] = useState('')
  const [adding, setAdding] = useState(false)
  const [removeId, setRemoveId] = useState(null)
  const [toast, setToast] = useState('')

  const isAdmin = profile?.role === 'admin'
  const isOrganizer = profile?.role === 'organizer'
  const canManage = isAdmin || isOrganizer

  useEffect(() => {
    if (activeEventId) loadBenevoles()
  }, [activeEventId])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  async function loadBenevoles() {
    setLoading(true)
    // Charger les bénévoles inscrits + leurs profils
    const { data: evVols } = await supabase
      .from('event_volunteers')
      .select('*, profiles(*)')
      .eq('event_id', activeEventId)

    // Charger leurs affectations aux postes
    const { data: asgn } = await supabase
      .from('assignments')
      .select('volunteer_id, shifts(positions(name))')
      .eq('event_id', activeEventId)

    // Construire map affectations par user
    const affMap = {}
    ;(asgn || []).forEach(a => {
      const vid = a.volunteer_id
      if (!affMap[vid]) affMap[vid] = []
      const pname = a.shifts?.positions?.name
      if (pname && !affMap[vid].includes(pname)) affMap[vid].push(pname)
    })

    setVolunteers((evVols || []).map(ev => ({ ...ev, affectations: affMap[ev.user_id] || [] })))
    setLoading(false)
  }

  async function openAddModal() {
    setAddError('')
    setSelectedUserId('')
    setNotes('')
    // Charger les profils pas encore inscrits
    const existingIds = volunteers.map(v => v.user_id)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, role')
      .order('last_name')
    const avail = (profiles || []).filter(p => !existingIds.includes(p.id))
    setAvailable(avail)
    setShowAdd(true)
  }

  async function handleAdd() {
    if (!selectedUserId) { setAddError('Selectionnez un benevole'); return }
    setAdding(true)
    const { error } = await supabase.from('event_volunteers').insert({
      event_id: activeEventId,
      user_id: selectedUserId,
      notes,
      status: 'accepted',
    })
    setAdding(false)
    if (error) { setAddError(error.message); return }
    setShowAdd(false)
    loadBenevoles()
    showToast('Benevole ajoute')
  }

  async function handleRemove(evVolId) {
    await supabase.from('event_volunteers').delete().eq('id', evVolId)
    setRemoveId(null)
    loadBenevoles()
    showToast('Benevole retire')
  }

  if (!activeEventId) {
    return (
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', marginBottom: 4 }}>Benevoles</h1>
        <div style={{ background: '#fff', borderRadius: 12, border: '2px dashed #e5e7eb', padding: 48, textAlign: 'center', marginTop: 20 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📅</div>
          <div style={{ fontWeight: 600, color: '#374151', marginBottom: 4 }}>Aucun evenement actif</div>
          <div style={{ fontSize: 13, color: '#9ca3af' }}>Selectionnez un evenement dans la page Evenements pour voir ses benevoles.</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#1C3829', color: '#fff', borderRadius: 10, padding: '12px 20px', fontSize: 14, fontWeight: 600, zIndex: 2000, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', marginBottom: 4 }}>Benevoles</h1>
          <p style={{ fontSize: 14, color: '#6b7280' }}>
            Annuaire des benevoles &mdash; <strong style={{ color: '#1C3829' }}>{activeEventName || 'evenement actif'}</strong>
            {!loading && <span style={{ marginLeft: 8, background: '#f0fdf4', color: '#16a34a', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>{volunteers.length} inscrits</span>}
          </p>
        </div>
        {canManage && (
          <button onClick={openAddModal} style={btnPrimary}>+ Ajouter un benevole</button>
        )}
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Nom', 'Email', 'Telephone', 'Competences', 'Affectations', 'Statut', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Chargement...</td></tr>
              ) : volunteers.length === 0 ? (
                <tr><td colSpan={7}>
                  <div style={{ padding: 48, textAlign: 'center' }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>👥</div>
                    <div style={{ fontWeight: 600, color: '#374151', marginBottom: 4 }}>Aucun benevole</div>
                    <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 16 }}>Ajoutez des benevoles a cet evenement.</div>
                    {canManage && <button onClick={openAddModal} style={btnPrimary}>+ Ajouter un benevole</button>}
                  </div>
                </td></tr>
              ) : volunteers.map((ev, i) => {
                const p = ev.profiles || {}
                const skills = getSkills(p)
                return (
                  <tr key={ev.id} style={{ borderBottom: i < volunteers.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                    {/* Nom */}
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar first={p.first_name} last={p.last_name} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14, color: '#111' }}>{p.first_name || ''} {p.last_name || ''}</div>
                          {p.comment && <div style={{ fontSize: 12, color: '#9ca3af' }}>{p.comment}</div>}
                        </div>
                      </div>
                    </td>
                    {/* Email */}
                    <td style={{ padding: '13px 16px', fontSize: 12, color: '#6b7280' }}>{p.email || '-'}</td>
                    {/* Tel */}
                    <td style={{ padding: '13px 16px', fontSize: 12 }}>{p.phone || '-'}</td>
                    {/* Compétences */}
                    <td style={{ padding: '13px 16px', maxWidth: 160 }}>
                      {skills.slice(0, 3).map((s, j) => (
                        <span key={j} style={{ background: '#f0fdf4', color: '#15803d', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600, marginRight: 3, display: 'inline-block', marginBottom: 2 }}>{s}</span>
                      ))}
                      {skills.length > 3 && <span style={{ fontSize: 11, color: '#9ca3af' }}>+{skills.length - 3}</span>}
                      {skills.length === 0 && <span style={{ color: '#9ca3af', fontSize: 12 }}>-</span>}
                    </td>
                    {/* Affectations */}
                    <td style={{ padding: '13px 16px', maxWidth: 180 }}>
                      {ev.affectations.length > 0
                        ? ev.affectations.map((a, j) => (
                          <span key={j} style={{ background: '#eff6ff', color: '#2563eb', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600, marginRight: 3, display: 'inline-block', marginBottom: 2 }}>{a}</span>
                        ))
                        : <span style={{ color: '#9ca3af', fontSize: 12 }}>Non affecte</span>}
                    </td>
                    {/* Statut */}
                    <td style={{ padding: '13px 16px' }}>
                      <StatusBadge status={ev.status} />
                    </td>
                    {/* Actions */}
                    <td style={{ padding: '13px 16px' }}>
                      {canManage && (
                        <button onClick={() => setRemoveId(ev.id)} style={btnDanger}>Retirer</button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal ajouter */}
      {showAdd && (
        <Modal title="Ajouter un benevole" onClose={() => setShowAdd(false)}>
          {addError && <div style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 8, padding: '10px 13px', fontSize: 13, marginBottom: 14 }}>{addError}</div>}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Benevole</label>
            <select style={selectStyle} value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}>
              <option value="">- Choisir -</option>
              {available.map(p => (
                <option key={p.id} value={p.id}>{p.first_name || ''} {p.last_name || ''} ({p.role})</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Notes (optionnel)</label>
            <textarea style={textareaStyle} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes sur ce benevole pour cet evenement..." />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setShowAdd(false)} style={btnSecondary}>Annuler</button>
            <button onClick={handleAdd} disabled={adding} style={{ ...btnPrimary, opacity: adding ? 0.6 : 1 }}>
              {adding ? 'Ajout...' : 'Ajouter'}
            </button>
          </div>
        </Modal>
      )}

      {/* Modal retirer */}
      {removeId && (
        <Modal title="Retirer le benevole" onClose={() => setRemoveId(null)}>
          <p style={{ fontSize: 14, color: '#374151', marginBottom: 24 }}>Etes-vous sur de vouloir retirer ce benevole de l'evenement ? Ses affectations seront conservees.</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setRemoveId(null)} style={btnSecondary}>Annuler</button>
            <button onClick={() => handleRemove(removeId)} style={{ ...btnPrimary, background: '#dc2626' }}>Retirer</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
