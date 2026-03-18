'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#111' }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#9ca3af' }}>&times;</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle = { width: '100%', padding: '10px 13px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box', color: '#111' }
const btnPrimary = { background: '#1C3829', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }
const btnSecondary = { background: '#fff', color: '#374151', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '7px 13px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }
const btnDanger = { background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 8, padding: '7px 13px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }
const btnSuccess = { background: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac', borderRadius: 8, padding: '7px 13px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }

const emptyForm = { name: '', description: '', location: '', volunteers_required: 1, start_time: '', end_time: '', instructions: '' }

export default function PagePostes({ profile, activeEventId, activeEventName }) {
  const [postes, setPostes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editPoste, setEditPoste] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteId, setDeleteId] = useState(null)
  const [toast, setToast] = useState('')

  const canManage = profile?.role === 'admin' || profile?.role === 'organizer'

  useEffect(() => {
    if (activeEventId) loadPostes()
  }, [activeEventId])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  async function loadPostes() {
    setLoading(true)
    const { data } = await supabase
      .from('positions')
      .select('*, shifts(*, assignments(*, profiles(first_name, last_name)))')
      .eq('event_id', activeEventId)
      .order('name')
    setPostes(data || [])
    setLoading(false)
  }

  function openCreate() {
    setEditPoste(null)
    setForm(emptyForm)
    setError('')
    setShowModal(true)
  }

  async function openEdit(pid) {
    const { data: p } = await supabase.from('positions').select('*, shifts(*)').eq('id', pid).single()
    if (!p) return
    const sh = p.shifts?.[0]
    setEditPoste(p)
    setForm({
      name: p.name || '',
      description: p.description || '',
      location: p.location || '',
      volunteers_required: p.volunteers_required || 1,
      start_time: sh?.start_time?.slice(0, 5) || '',
      end_time: sh?.end_time?.slice(0, 5) || '',
      instructions: p.instructions || '',
    })
    setError('')
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('Le nom du poste est obligatoire'); return }
    setSaving(true)
    setError('')
    const payload = {
      name: form.name.trim(),
      description: form.description,
      location: form.location,
      volunteers_required: parseInt(form.volunteers_required) || 1,
      instructions: form.instructions,
      event_id: activeEventId,
    }
    let positeId = editPoste?.id
    if (editPoste) {
      await supabase.from('positions').update(payload).eq('id', editPoste.id)
    } else {
      const { data: np } = await supabase.from('positions').insert(payload).select().single()
      positeId = np?.id
    }
    // Gérer le créneau
    if (positeId && form.start_time && form.end_time) {
      const { data: sh } = await supabase.from('shifts').select('id').eq('position_id', positeId)
      if (sh?.length) {
        await supabase.from('shifts').update({ start_time: form.start_time, end_time: form.end_time, volunteers_required: parseInt(form.volunteers_required) || 1 }).eq('position_id', positeId)
      } else {
        await supabase.from('shifts').insert({ position_id: positeId, event_id: activeEventId, start_time: form.start_time, end_time: form.end_time, volunteers_required: parseInt(form.volunteers_required) || 1 })
      }
    }
    setSaving(false)
    setShowModal(false)
    loadPostes()
    showToast(editPoste ? 'Poste mis à jour' : 'Poste créé')
  }

  async function handleDelete(pid) {
    const { data: sh } = await supabase.from('shifts').select('id').eq('position_id', pid)
    for (const s of sh || []) await supabase.from('assignments').delete().eq('shift_id', s.id)
    await supabase.from('shifts').delete().eq('position_id', pid)
    await supabase.from('positions').delete().eq('id', pid)
    setDeleteId(null)
    loadPostes()
    showToast('Poste supprimé')
  }

  if (!activeEventId) return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', marginBottom: 4 }}>Postes</h1>
      <div style={{ background: '#fff', borderRadius: 12, border: '2px dashed #e5e7eb', padding: 48, textAlign: 'center', marginTop: 20 }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>📍</div>
        <div style={{ fontWeight: 600, color: '#374151', marginBottom: 4 }}>Aucun événement actif</div>
        <div style={{ fontSize: 13, color: '#9ca3af' }}>Sélectionnez un événement dans la page Événements pour gérer ses postes.</div>
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

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', marginBottom: 4 }}>Postes</h1>
          <p style={{ fontSize: 14, color: '#6b7280' }}>
            Gérez les postes et missions &mdash; <strong style={{ color: '#1C3829' }}>{activeEventName || 'événement actif'}</strong>
            {!loading && <span style={{ marginLeft: 8, background: '#f0fdf4', color: '#16a34a', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>{postes.length} postes</span>}
          </p>
        </div>
        {canManage && (
          <button onClick={openCreate} style={btnPrimary}>+ Nouveau poste</button>
        )}
      </div>

      {/* Grille de cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>Chargement...</div>
      ) : postes.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, border: '2px dashed #e5e7eb', padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📍</div>
          <div style={{ fontWeight: 600, color: '#374151', marginBottom: 4 }}>Aucun poste créé</div>
          <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 16 }}>Créez vos postes pour commencer à affecter des bénévoles.</div>
          {canManage && <button onClick={openCreate} style={btnPrimary}>+ Créer un poste</button>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {postes.map(p => {
            const req = p.volunteers_required || 0
            const aff = p.shifts?.reduce((s, sh) => s + (sh.assignments?.length || 0), 0) || 0
            const complet = req > 0 && aff >= req
            const t1 = p.shifts?.[0]?.start_time?.slice(0, 5) || ''
            const t2 = p.shifts?.[0]?.end_time?.slice(0, 5) || ''
            const bens = p.shifts?.flatMap(sh => sh.assignments?.map(a => a.profiles) || []) || []

            return (
              <div key={p.id} style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                {/* Header card */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#111', marginBottom: p.description ? 4 : 0 }}>{p.name}</div>
                    {p.description && <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>{p.description}</div>}
                  </div>
                  <span style={{ background: complet ? '#dcfce7' : '#fef9c3', color: complet ? '#16a34a' : '#ca8a04', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {complet ? 'Complet' : 'Incomplet'}
                  </span>
                </div>

                {/* Meta */}
                <div style={{ padding: '10px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {p.location && <span style={{ fontSize: 12, color: '#6b7280' }}>📍 {p.location}</span>}
                  {t1 && t2 && <span style={{ fontSize: 12, color: '#6b7280' }}>🕐 {t1} - {t2}</span>}
                  <span style={{ fontSize: 12, color: complet ? '#16a34a' : '#ca8a04', fontWeight: 600 }}>👥 {aff}/{req}</span>
                </div>

                {/* Corps */}
                <div style={{ padding: '14px 20px' }}>
                  {p.instructions && (
                    <div style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.4px' }}>📋 Consignes</div>
                      <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.5 }}>{p.instructions}</div>
                    </div>
                  )}
                  {bens.length > 0 ? (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Bénévoles affectés</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {bens.map((b, i) => (
                          <span key={i} style={{ background: '#eff6ff', color: '#2563eb', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
                            {b?.first_name || ''} {b?.last_name || ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic' }}>Aucun bénévole affecté</div>
                  )}
                </div>

                {/* Actions */}
                {canManage && (
                  <div style={{ padding: '12px 20px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: 8 }}>
                    <button onClick={() => openEdit(p.id)} style={btnSecondary}>Modifier</button>
                    <button onClick={() => setDeleteId(p.id)} style={btnDanger}>Supprimer</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal création/édition */}
      {showModal && (
        <Modal title={editPoste ? "Modifier le poste" : "Nouveau poste"} onClose={() => setShowModal(false)}>
          {error && <div style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 8, padding: '10px 13px', fontSize: 13, marginBottom: 16 }}>{error}</div>}
          <Field label="Nom du poste *">
            <input style={inputStyle} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Accueil & Inscriptions" />
          </Field>
          <Field label="Description">
            <textarea style={{ ...inputStyle, height: 64, resize: 'vertical' }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description du poste..." />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Lieu">
              <input style={inputStyle} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Ex: Village départ" />
            </Field>
            <Field label="Bénévoles requis">
              <input style={inputStyle} type="number" min="1" value={form.volunteers_required} onChange={e => setForm({ ...form, volunteers_required: e.target.value })} placeholder="4" />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Heure début">
              <input style={inputStyle} type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} />
            </Field>
            <Field label="Heure fin">
              <input style={inputStyle} type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} />
            </Field>
          </div>
          <Field label="Consignes">
            <textarea style={{ ...inputStyle, height: 72, resize: 'vertical' }} value={form.instructions} onChange={e => setForm({ ...form, instructions: e.target.value })} placeholder="Instructions pour les bénévoles..." />
          </Field>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button onClick={() => setShowModal(false)} style={btnSecondary}>Annuler</button>
            <button onClick={handleSave} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Enregistrement...' : editPoste ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </Modal>
      )}

      {/* Modal suppression */}
      {deleteId && (
        <Modal title="Supprimer le poste" onClose={() => setDeleteId(null)}>
          <p style={{ fontSize: 14, color: '#374151', marginBottom: 24 }}>Êtes-vous sûr de vouloir supprimer ce poste ? Toutes les affectations associées seront également supprimées.</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setDeleteId(null)} style={btnSecondary}>Annuler</button>
            <button onClick={() => handleDelete(deleteId)} style={{ ...btnPrimary, background: '#dc2626' }}>Supprimer</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
