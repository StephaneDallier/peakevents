'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function Modal({ title, onClose, children, wide }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: wide ? 560 : 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
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
const btnSecondary = { background: '#fff', color: '#374151', border: '1.5px solid #e5e7eb', borderRadius: 6, padding: '4px 8px', fontWeight: 600, fontSize: 11, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }
const btnDanger = { background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 6, padding: '4px 8px', fontWeight: 600, fontSize: 11, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }

function Avatar({ first, last }) {
  const initials = ((first?.[0] || '') + (last?.[0] || '')).toUpperCase() || '?'
  return (
    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1C3829', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
      {initials}
    </div>
  )
}

function Field({ label, children, hint }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>{hint}</div>}
    </div>
  )
}

function RoleBadge({ role }) {
  const map = {
    admin: { bg: '#fef2f2', color: '#dc2626', label: 'Admin' },
    organizer: { bg: '#eff6ff', color: '#2563eb', label: 'Organisateur' },
    volunteer: { bg: '#f0fdf4', color: '#16a34a', label: 'Bénévole' },
  }
  const s = map[role] || map.volunteer
  return <span style={{ background: s.bg, color: s.color, borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{s.label}</span>
}

const emptyCreateForm = {
  first_name: '', last_name: '', email: '', password: '',
  phone: '', club: '', role: 'volunteer', comment: ''
}

export default function PageUsers({ profile: currentProfile }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState(null)
  const [editUser, setEditUser] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [assignUser, setAssignUser] = useState(null)
  const [myEvents, setMyEvents] = useState([])
  const [toast, setToast] = useState('')
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  // Modal création
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState(emptyCreateForm)
  const [createError, setCreateError] = useState('')
  const [creating, setCreating] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const isAdmin = currentProfile?.role === 'admin'
  const isOrganizer = currentProfile?.role === 'organizer'
  const canAccess = isAdmin || isOrganizer

  // Rôles disponibles selon le rôle de l'utilisateur connecté
  const availableRoles = isAdmin
    ? [{ value: 'volunteer', label: 'Bénévole' }, { value: 'organizer', label: 'Organisateur' }, { value: 'admin', label: 'Administrateur' }]
    : [{ value: 'volunteer', label: 'Bénévole' }, { value: 'organizer', label: 'Organisateur' }]

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
      const { data } = await supabase.from('profiles').select('*').in('id', userIds).order('last_name')
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

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 2500) }

  // --- CREATION COMPTE ---
  async function handleCreate() {
    if (!createForm.first_name.trim() || !createForm.last_name.trim()) {
      setCreateError('Prénom et nom sont obligatoires')
      return
    }
    if (!createForm.email.trim()) {
      setCreateError("L'email est obligatoire")
      return
    }
    if (!createForm.password || createForm.password.length < 6) {
      setCreateError('Le mot de passe doit faire au moins 6 caractères')
      return
    }
    setCreating(true)
    setCreateError('')

    // Créer le compte via Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: createForm.email.trim(),
      password: createForm.password,
      options: {
        data: {
          first_name: createForm.first_name.trim(),
          last_name: createForm.last_name.trim(),
          phone: createForm.phone.trim(),
          club: createForm.club.trim(),
          role: createForm.role,
          comment: createForm.comment.trim(),
        }
      }
    })

    if (error) {
      setCreating(false)
      setCreateError('Erreur : ' + error.message)
      return
    }

    // Mettre à jour le profil avec le bon rôle (le trigger crée le profil mais on force le rôle)
    if (data?.user?.id) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        first_name: createForm.first_name.trim(),
        last_name: createForm.last_name.trim(),
        phone: createForm.phone.trim() || null,
        club: createForm.club.trim() || null,
        role: createForm.role,
        comment: createForm.comment.trim() || null,
        is_active: true,
      })
    }

    setCreating(false)
    setShowCreate(false)
    setCreateForm(emptyCreateForm)
    loadUsers()
    showToast(`Compte créé : ${createForm.first_name} ${createForm.last_name}`)
  }

  // --- EDITION ---
  function openEdit(u) {
    setEditUser(u)
    setEditForm({
      first_name: u.first_name || '',
      last_name: u.last_name || '',
      phone: u.phone || '',
      club: u.club || '',
      comment: u.comment || '',
      role: u.role || 'volunteer'
    })
  }

  async function handleSaveEdit() {
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      first_name: editForm.first_name,
      last_name: editForm.last_name,
      phone: editForm.phone,
      club: editForm.club,
      comment: editForm.comment,
      ...(isAdmin ? { role: editForm.role } : {}),
    }).eq('id', editUser.id)
    setSaving(false)
    if (error) { showToast('Erreur : ' + error.message); return }
    setEditUser(null)
    loadUsers()
    showToast('Compte mis à jour')
  }

  async function changeRole(uid, role) {
    await supabase.from('profiles').update({ role }).eq('id', uid)
    setUsers(prev => prev.map(u => u.id === uid ? { ...u, role } : u))
    showToast('Rôle mis à jour')
  }

  async function toggleActive(uid, current) {
    await supabase.from('profiles').update({ is_active: !current }).eq('id', uid)
    setUsers(prev => prev.map(u => u.id === uid ? { ...u, is_active: !current } : u))
    showToast(current ? 'Compte désactivé' : 'Compte activé')
  }

  async function handleDelete(uid) {
    await supabase.from('profiles').delete().eq('id', uid)
    setDeleteId(null)
    setUsers(prev => prev.filter(u => u.id !== uid))
    showToast('Utilisateur supprimé')
  }

  async function handleAssign(userId, eventId) {
    const { error } = await supabase.from('event_volunteers').upsert(
      { user_id: userId, event_id: eventId, status: 'accepted' },
      { onConflict: 'user_id,event_id' }
    )
    setAssignUser(null)
    showToast(error ? 'Erreur : ' + error.message : "Bénévole assigné à l'événement")
  }

  if (!canAccess) return (
    <div style={{ fontFamily: 'Inter, sans-serif', padding: 40, textAlign: 'center', color: '#9ca3af' }}>
      <div style={{ fontSize: 36, marginBottom: 8 }}>🔒</div>
      <div style={{ fontWeight: 600 }}>Accès non autorisé</div>
    </div>
  )

  const filtered = users.filter(u => {
    if (!search) return true
    const q = search.toLowerCase()
    return (u.first_name + ' ' + u.last_name + ' ' + (u.email || '')).toLowerCase().includes(q)
  })

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#1C3829', color: '#fff', borderRadius: 10, padding: '12px 20px', fontSize: 14, fontWeight: 600, zIndex: 2000, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>{toast}</div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', marginBottom: 4 }}>Utilisateurs</h1>
          <p style={{ fontSize: 14, color: '#6b7280' }}>{filtered.length} compte{filtered.length > 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { setCreateForm(emptyCreateForm); setCreateError(''); setShowCreate(true) }} style={btnPrimary}>
          + Créer un compte
        </button>
      </div>

      {/* Recherche */}
      <div style={{ marginBottom: 16 }}>
        <input
          style={{ ...inputStyle, maxWidth: 320 }}
          placeholder="Rechercher un utilisateur..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Nom', 'Email', 'Téléphone', 'Club', 'Rôle', 'Statut', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Chargement...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Aucun utilisateur</td></tr>
              ) : filtered.map((u, i) => (
                <tr key={u.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f9fafb' : 'none' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar first={u.first_name} last={u.last_name} />
                      <div>
                        <div style={{ fontWeight: 600, color: '#111' }}>{u.first_name} {u.last_name}</div>
                        {u.comment && <div style={{ fontSize: 11, color: '#9ca3af' }}>{u.comment}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#6b7280' }}>{u.email || <span style={{ color: '#d1d5db', fontStyle: 'italic' }}>—</span>}</td>
                  <td style={{ padding: '12px 16px', color: '#6b7280' }}>{u.phone || '—'}</td>
                  <td style={{ padding: '12px 16px', color: '#6b7280' }}>{u.club || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    {isAdmin ? (
                      <select value={u.role} onChange={e => changeRole(u.id, e.target.value)}
                        style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: '3px 6px', fontSize: 11, fontFamily: 'Inter, sans-serif', cursor: 'pointer', background: '#fff' }}>
                        <option value="volunteer">Bénévole</option>
                        <option value="organizer">Organisateur</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <RoleBadge role={u.role} />
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: u.is_active ? '#dcfce7' : '#f3f4f6', color: u.is_active ? '#16a34a' : '#9ca3af', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>
                      {u.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      <button onClick={() => openEdit(u)} style={btnSecondary}>Modifier</button>
                      <button onClick={() => toggleActive(u.id, u.is_active)} style={{ ...btnSecondary, color: u.is_active ? '#dc2626' : '#16a34a', borderColor: u.is_active ? '#fca5a5' : '#bbf7d0' }}>
                        {u.is_active ? 'Désactiver' : 'Activer'}
                      </button>
                      <button onClick={() => setAssignUser(u)} style={{ ...btnSecondary, color: '#F97316', borderColor: '#fed7aa' }}>Assigner</button>
                      {isAdmin && u.id !== currentProfile?.id && (
                        <button onClick={() => setDeleteId(u.id)} style={btnDanger}>Suppr.</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CREATION */}
      {showCreate && (
        <Modal title="Créer un compte" onClose={() => setShowCreate(false)} wide>
          {createError && (
            <div style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 8, padding: '10px 13px', fontSize: 13, marginBottom: 14 }}>{createError}</div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Prénom *">
              <input style={inputStyle} value={createForm.first_name} onChange={e => setCreateForm({ ...createForm, first_name: e.target.value })} placeholder="Jean" />
            </Field>
            <Field label="Nom *">
              <input style={inputStyle} value={createForm.last_name} onChange={e => setCreateForm({ ...createForm, last_name: e.target.value })} placeholder="Dupont" />
            </Field>
          </div>
          <Field label="Email *" hint="Peut être fictif pour les tests (ex: test@peakevents.fr)">
            <input style={inputStyle} type="email" value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} placeholder="jean.dupont@email.com" />
          </Field>
          <Field label="Mot de passe *" hint="Minimum 6 caractères">
            <div style={{ position: 'relative' }}>
              <input
                style={{ ...inputStyle, paddingRight: 44 }}
                type={showPassword ? 'text' : 'password'}
                value={createForm.password}
                onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#9ca3af' }}>
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </Field>
          <Field label="Rôle *">
            <div style={{ display: 'flex', gap: 8 }}>
              {availableRoles.map(r => (
                <button key={r.value} type="button" onClick={() => setCreateForm({ ...createForm, role: r.value })}
                  style={{
                    flex: 1, padding: '10px 8px', border: '2px solid', borderRadius: 8, cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600, textAlign: 'center',
                    background: createForm.role === r.value ? '#1C3829' : '#fff',
                    color: createForm.role === r.value ? '#fff' : '#374151',
                    borderColor: createForm.role === r.value ? '#1C3829' : '#e5e7eb',
                  }}>
                  {r.label}
                </button>
              ))}
            </div>
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Téléphone">
              <input style={inputStyle} value={createForm.phone} onChange={e => setCreateForm({ ...createForm, phone: e.target.value })} placeholder="06 00 00 00 00" />
            </Field>
            <Field label="Club / Association">
              <input style={inputStyle} value={createForm.club} onChange={e => setCreateForm({ ...createForm, club: e.target.value })} placeholder="Club Trail Verdon" />
            </Field>
          </div>
          <Field label="Commentaire">
            <input style={inputStyle} value={createForm.comment} onChange={e => setCreateForm({ ...createForm, comment: e.target.value })} placeholder="Infirmière, PSC1 valide..." />
          </Field>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button onClick={() => setShowCreate(false)} style={{ ...btnPrimary, background: '#fff', color: '#374151', border: '1.5px solid #e5e7eb' }}>Annuler</button>
            <button onClick={handleCreate} disabled={creating} style={{ ...btnPrimary, opacity: creating ? 0.6 : 1 }}>
              {creating ? 'Création...' : 'Créer le compte'}
            </button>
          </div>
        </Modal>
      )}

      {/* MODAL EDITION */}
      {editUser && (
        <Modal title="Modifier le compte" onClose={() => setEditUser(null)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Prénom">
              <input style={inputStyle} value={editForm.first_name} onChange={e => setEditForm({ ...editForm, first_name: e.target.value })} />
            </Field>
            <Field label="Nom">
              <input style={inputStyle} value={editForm.last_name} onChange={e => setEditForm({ ...editForm, last_name: e.target.value })} />
            </Field>
          </div>
          <Field label="Téléphone">
            <input style={inputStyle} value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
          </Field>
          <Field label="Club">
            <input style={inputStyle} value={editForm.club} onChange={e => setEditForm({ ...editForm, club: e.target.value })} />
          </Field>
          <Field label="Commentaire">
            <input style={inputStyle} value={editForm.comment} onChange={e => setEditForm({ ...editForm, comment: e.target.value })} placeholder="Notes sur ce bénévole..." />
          </Field>
          {isAdmin && (
            <Field label="Rôle">
              <div style={{ display: 'flex', gap: 8 }}>
                {[{ value: 'volunteer', label: 'Bénévole' }, { value: 'organizer', label: 'Organisateur' }, { value: 'admin', label: 'Admin' }].map(r => (
                  <button key={r.value} type="button" onClick={() => setEditForm({ ...editForm, role: r.value })}
                    style={{ flex: 1, padding: '8px 4px', border: '2px solid', borderRadius: 8, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600, background: editForm.role === r.value ? '#1C3829' : '#fff', color: editForm.role === r.value ? '#fff' : '#374151', borderColor: editForm.role === r.value ? '#1C3829' : '#e5e7eb' }}>
                    {r.label}
                  </button>
                ))}
              </div>
            </Field>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button onClick={() => setEditUser(null)} style={{ ...btnPrimary, background: '#fff', color: '#374151', border: '1.5px solid #e5e7eb' }}>Annuler</button>
            <button onClick={handleSaveEdit} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </Modal>
      )}

      {/* MODAL ASSIGNATION */}
      {assignUser && (
        <Modal title={`Assigner ${assignUser.first_name} à un événement`} onClose={() => setAssignUser(null)}>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>Choisissez l'événement sur lequel inscrire ce bénévole.</p>
          {myEvents.length === 0 ? (
            <p style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic' }}>Aucun événement disponible.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {myEvents.map(ev => (
                <button key={ev.id} onClick={() => handleAssign(assignUser.id, ev.id)}
                  style={{ padding: '12px 16px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#111', textAlign: 'left' }}>
                  📅 {ev.name}
                </button>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button onClick={() => setAssignUser(null)} style={{ ...btnPrimary, background: '#fff', color: '#374151', border: '1.5px solid #e5e7eb' }}>Fermer</button>
          </div>
        </Modal>
      )}

      {/* MODAL SUPPRESSION */}
      {deleteId && (
        <Modal title="Supprimer le compte" onClose={() => setDeleteId(null)}>
          <p style={{ fontSize: 14, color: '#374151', marginBottom: 24 }}>Êtes-vous sûr ? Cette action est irréversible.</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setDeleteId(null)} style={{ ...btnPrimary, background: '#fff', color: '#374151', border: '1.5px solid #e5e7eb' }}>Annuler</button>
            <button onClick={() => handleDelete(deleteId)} style={{ ...btnPrimary, background: '#dc2626' }}>Supprimer</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
