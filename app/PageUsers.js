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

const inputStyle = { width: '100%', padding: '10px 13px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box', color: '#111' }
const btnPrimary = { background: '#1C3829', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }
const btnSecondary = { background: '#fff', color: '#374151', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '6px 11px', fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }
const btnDanger = { background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 8, padding: '6px 11px', fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }
const btnOrange = { background: '#FEF3E9', color: '#F97316', border: '1px solid #fed7aa', borderRadius: 8, padding: '6px 11px', fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }

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

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</label>
      {children}
    </div>
  )
}

export default function PageUsers({ profile: currentProfile }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState(null)
  const [editUser, setEditUser] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [resetUser, setResetUser] = useState(null)
  const [assignUser, setAssignUser] = useState(null)
  const [myEvents, setMyEvents] = useState([])
  const [toast, setToast] = useState('')
  const [saving, setSaving] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)

  const isAdmin = currentProfile?.role === 'admin'
  const isOrganizer = currentProfile?.role === 'organizer'
  const canAccess = isAdmin || isOrganizer

  useEffect(() => {
    if (!canAccess) return
    loadUsers()
    loadMyEvents()
  }, [])

  async function loadUsers() {
    setLoading(true)
    if (isAdmin) {
      const { data } = await supabase.from('profiles').select('*').order('last_name')
      setUsers(data || [])
    } else if (isOrganizer) {
      const { data: orgEvents } = await supabase.from('event_organizers').select('event_id').eq('user_id', currentProfile.id)
      const eventIds = (orgEvents || []).map(e => e.event_id)
      if (eventIds.length === 0) { setUsers([]); setLoading(false); return }
      const { data: evVols } = await supabase.from('event_volunteers').select('user_id').in('event_id', eventIds)
      const userIds = [...new Set((evVols || []).map(v => v.user_id))]
      if (userIds.length === 0) { setUsers([]); setLoading(false); return }
      const { data } = await supabase.from('profiles').select('*').in('id', userIds).eq('role', 'volunteer').order('last_name')
      setUsers(data || [])
    }
    setLoading(false)
  }

  async function loadMyEvents() {
    if (isAdmin) {
      const { data } = await supabase.from('events').select('id, name').order('start_date')
      setMyEvents(data || [])
    } else {
      const { data } = await supabase.from('event_organizers').select('event_id, events(id, name)').eq('user_id', currentProfile.id)
      setMyEvents((data || []).map(d => d.events).filter(Boolean))
    }
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  async function changeRole(uid, role) {
    await supabase.from('profiles').update({ role }).eq('id', uid)
    setUsers(prev => prev.map(u => u.id === uid ? { ...u, role } : u))
    showToast('Role mis a jour')
  }

  async function toggleActive(uid, current) {
    await supabase.from('profiles').update({ is_active: !current }).eq('id', uid)
    setUsers(prev => prev.map(u => u.id === uid ? { ...u, is_active: !current } : u))
    showToast(current ? 'Utilisateur desactive' : 'Utilisateur active')
  }

  async function handleDelete(uid) {
    await supabase.from('profiles').delete().eq('id', uid)
    setDeleteId(null)
    setUsers(prev => prev.filter(u => u.id !== uid))
    showToast('Utilisateur supprime')
  }

  function openEdit(u) {
    setEditUser(u)
    setEditForm({ first_name: u.first_name || '', last_name: u.last_name || '', phone: u.phone || '', club: u.club || '', role: u.role || 'volunteer' })
  }

  async function handleSaveEdit() {
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      first_name: editForm.first_name,
      last_name: editForm.last_name,
      phone: editForm.phone,
      club: editForm.club,
      ...(isAdmin ? { role: editForm.role } : {}),
    }).eq('id', editUser.id)
    setSaving(false)
    if (error) { showToast('Erreur : ' + error.message); return }
    setEditUser(null)
    loadUsers()
    showToast('Compte mis a jour')
  }

  async function handleResetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
    setResetUser(null)
    showToast(error ? 'Erreur : ' + error.message : 'Email de reinitialisation envoye')
  }

  async function handleAssign(userId, eventId) {
    const { error } = await supabase.from('event_volunteers').upsert(
      { user_id: userId, event_id: eventId, status: 'accepted' },
      { onConflict: 'user_id,event_id' }
    )
    setAssignUser(null)
    showToast(error ? 'Erreur : ' + error.message : "Benevole assigne a l'evenement")
  }

  async function handleInvite() {
    if (!inviteEmail) return
    setInviting(true)
    const { error } = await supabase.auth.resetPasswordForEmail(inviteEmail, { redirectTo: window.location.origin })
    setInviting(false)
    setShowInvite(false)
    setInviteEmail('')
    showToast(error ? 'Erreur : ' + error.message : 'Invitation envoyee a ' + inviteEmail)
  }

  if (!canAccess) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
        <div style={{ fontWeight: 700, fontSize: 16, color: '#374151' }}>Acces non autorise</div>
      </div>
    )
  }

  const headers = isAdmin
    ? ['Nom', 'Email', 'Telephone', 'Club', 'Competences', 'Role', 'Statut', 'Actions']
    : ['Nom', 'Email', 'Telephone', 'Club', 'Statut', 'Actions']

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#1C3829', color: '#fff', borderRadius: 10, padding: '12px 20px', fontSize: 14, fontWeight: 600, zIndex: 2000, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
          {toast}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', marginBottom: 4 }}>Utilisateurs</h1>
          <p style={{ fontSize: 14, color: '#6b7280' }}>
            {isAdmin ? 'Gestion de tous les comptes de la plateforme.' : 'Benevoles inscrits sur vos evenements.'}
          </p>
        </div>
        <button onClick={() => setShowInvite(true)}
          style={{ background: '#F97316', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'Inter, sans-serif', flexShrink: 0 }}>
          + Inviter par email
        </button>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {headers.map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={headers.length} style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Chargement...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={headers.length}>
                  <div style={{ padding: 48, textAlign: 'center' }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>👥</div>
                    <div style={{ fontWeight: 600, color: '#374151' }}>Aucun utilisateur</div>
                    <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>
                      {isOrganizer ? 'Aucun benevole inscrit sur vos evenements.' : ''}
                    </div>
                  </div>
                </td></tr>
              ) : users.map((u, i) => {
                const isMe = u.id === currentProfile?.id
                const skills = getSkills(u)
                return (
                  <tr key={u.id} style={{ borderBottom: i < users.length - 1 ? '1px solid #f3f4f6' : 'none', background: isMe ? '#f0fdf4' : 'transparent' }}>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar first={u.first_name} last={u.last_name} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14, color: '#111' }}>
                            {u.first_name || ''} {u.last_name || ''}
                            {isMe && <span style={{ marginLeft: 6, fontSize: 11, color: '#16a34a', fontWeight: 600 }}>(moi)</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 12, color: '#6b7280' }}>{u.email || '-'}</td>
                    <td style={{ padding: '13px 16px', fontSize: 12 }}>{u.phone || '-'}</td>
                    <td style={{ padding: '13px 16px', fontSize: 12 }}>{u.club || '-'}</td>
                    {isAdmin && (
                      <td style={{ padding: '13px 16px', maxWidth: 150 }}>
                        {skills.slice(0, 3).map((s, j) => (
                          <span key={j} style={{ background: '#f0fdf4', color: '#15803d', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600, marginRight: 3 }}>{s}</span>
                        ))}
                        {skills.length > 3 && <span style={{ fontSize: 11, color: '#9ca3af' }}>+{skills.length - 3}</span>}
                        {skills.length === 0 && <span style={{ color: '#9ca3af', fontSize: 12 }}>-</span>}
                      </td>
                    )}
                    {isAdmin && (
                      <td style={{ padding: '13px 16px' }}>
                        <select value={u.role || 'volunteer'} onChange={e => changeRole(u.id, e.target.value)} disabled={isMe}
                          style={{ padding: '5px 8px', borderRadius: 6, border: '1.5px solid #e5e7eb', fontSize: 12, fontFamily: 'Inter, sans-serif', cursor: isMe ? 'default' : 'pointer', background: '#fff', opacity: isMe ? 0.6 : 1 }}>
                          <option value="volunteer">Benevole</option>
                          <option value="organizer">Organisateur</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                    )}
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{ background: u.is_active ? '#dcfce7' : '#fef2f2', color: u.is_active ? '#16a34a' : '#dc2626', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
                        {u.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        <button onClick={() => openEdit(u)} style={btnSecondary}>Modifier</button>
                        {!isMe && (
                          <>
                            <button onClick={() => toggleActive(u.id, u.is_active)} style={btnSecondary}>
                              {u.is_active ? 'Desactiver' : 'Activer'}
                            </button>
                            {isAdmin && (
                              <button onClick={() => setResetUser(u)} style={btnOrange}>Mdp</button>
                            )}
                            {(isAdmin || isOrganizer) && (
                              <button onClick={() => setAssignUser(u)} style={btnOrange}>Assigner</button>
                            )}
                            <button onClick={() => setDeleteId(u.id)} style={btnDanger}>Suppr.</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editUser && (
        <Modal title="Modifier le compte" onClose={() => setEditUser(null)}>
          <Field label="Prenom">
            <input style={inputStyle} value={editForm.first_name} onChange={e => setEditForm({ ...editForm, first_name: e.target.value })} />
          </Field>
          <Field label="Nom">
            <input style={inputStyle} value={editForm.last_name} onChange={e => setEditForm({ ...editForm, last_name: e.target.value })} />
          </Field>
          <Field label="Telephone">
            <input style={inputStyle} value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
          </Field>
          <Field label="Club">
            <input style={inputStyle} value={editForm.club} onChange={e => setEditForm({ ...editForm, club: e.target.value })} />
          </Field>
          {isAdmin && (
            <Field label="Role">
              <select style={inputStyle} value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })}>
                <option value="volunteer">Benevole</option>
                <option value="organizer">Organisateur</option>
                <option value="admin">Admin</option>
              </select>
            </Field>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button onClick={() => setEditUser(null)} style={btnSecondary}>Annuler</button>
            <button onClick={handleSaveEdit} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </Modal>
      )}

      {resetUser && (
        <Modal title="Reinitialiser le mot de passe" onClose={() => setResetUser(null)}>
          <p style={{ fontSize: 14, color: '#374151', marginBottom: 20 }}>
            Un email de reinitialisation sera envoye a <strong>{resetUser.email}</strong>.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setResetUser(null)} style={btnSecondary}>Annuler</button>
            <button onClick={() => handleResetPassword(resetUser.email)} style={btnOrange}>Envoyer</button>
          </div>
        </Modal>
      )}

      {assignUser && (
        <Modal title="Assigner a un evenement" onClose={() => setAssignUser(null)}>
          <p style={{ fontSize: 14, color: '#374151', marginBottom: 16 }}>
            Assigner <strong>{assignUser.first_name} {assignUser.last_name}</strong> a :
          </p>
          {myEvents.length === 0 ? (
            <p style={{ fontSize: 13, color: '#9ca3af' }}>Aucun evenement disponible.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {myEvents.map(ev => (
                <button key={ev.id} onClick={() => handleAssign(assignUser.id, ev.id)}
                  style={{ ...btnPrimary, textAlign: 'left', padding: '12px 16px' }}>
                  {ev.name}
                </button>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => setAssignUser(null)} style={btnSecondary}>Fermer</button>
          </div>
        </Modal>
      )}

      {showInvite && (
        <Modal title="Inviter un benevole" onClose={() => setShowInvite(false)}>
          <p style={{ fontSize: 14, color: '#374151', marginBottom: 16 }}>
            Un email sera envoye avec un lien pour creer son mot de passe.
          </p>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Email</label>
            <input style={inputStyle} type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="benevole@email.com" />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setShowInvite(false)} style={btnSecondary}>Annuler</button>
            <button onClick={handleInvite} disabled={inviting || !inviteEmail}
              style={{ background: '#F97316', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'Inter, sans-serif', opacity: inviting || !inviteEmail ? 0.6 : 1 }}>
              {inviting ? 'Envoi...' : "Envoyer l'invitation"}
            </button>
          </div>
        </Modal>
      )}

      {deleteId && (
        <Modal title="Supprimer l'utilisateur" onClose={() => setDeleteId(null)}>
          <p style={{ fontSize: 14, color: '#374151', marginBottom: 24 }}>Etes-vous sur de vouloir supprimer cet utilisateur ? Cette action est irreversible.</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setDeleteId(null)} style={btnSecondary}>Annuler</button>
            <button onClick={() => handleDelete(deleteId)} style={{ ...btnPrimary, background: '#dc2626' }}>Supprimer</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
