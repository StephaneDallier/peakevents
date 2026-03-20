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
const emptyForm = { name: '', description: '', location: '', volunteers_required: 1, start_time: '', end_time: '', instructions: '' }

export default function PagePostes({ profile, activeEventId, activeEventName }) {
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
  const [showModal, setShowModal] = useState(false)
  const [editPoste, setEditPoste] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteId, setDeleteId] = useState(null)
  const [toast, setToast] = useState('')

  const canManage = profile?.role === 'admin' || profile?.role === 'organizer'

  useEffect(() => { if (currentEventId) loadPostes() }, [currentEventId])

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 2500) }

  async function loadPostes() {
    setLoading(true)
    const { data } = await supabase
      .from('positions')
      .select('*, shifts(*, assignments(*, profiles(first_name, last_name)))')
      .eq('event_id', currentEventId)
      .order('name')
    setPostes(data || [])
    setLoading(false)
  }

  function openCreate() { setEditPoste(null); setForm(emptyForm); setError(''); setShowModal(true) }

  async function openEdit(pid) {
    const { data: p } = await supabase.from('positions').select('*, shifts(*)').eq('id', pid).single()
    if (!p) return
    const sh = p.shifts?.[0]
    setEditPoste(p)
    setForm({ name: p.name || '', description: p.description || '', location: p.location || '', volunteers_required: p.volunteers_required || 1, start_time: sh?.start_time?.slice(0, 5) || '', end_time: sh?.end_time?.slice(0, 5) || '', instructions: p.instructions || '' })
    setError('')
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('Le nom du poste est obligatoire'); return }
    setSaving(true); setError('')
    const payload = { name: form.name.trim(), description: form.description, location: form.location, volunteers_required: parseInt(form.volunteers_required) || 1, instructions: form.instructions, event_id: currentEventId }
    let positeId = editPoste?.id
    if (editPoste) {
      await supabase.from('positions').update(payload).eq('id', editPoste.id)
    } else {
      const { data: np } = await supabase.from('positions').insert(payload).select().single()
      positeId = np?.id
    }
    if (positeId && form.start_time && form.end_time) {
      const { data: sh } = await supabase.from('shifts').select('id').eq('position_id', positeId)
      if (sh?.length) await supabase.from('shifts').update({ start_time: form.start_time, end_time: form.end_time, volunteers_required: parseInt(form.volunteers_required) || 1 }).eq('position_id', positeId)
      else await supabase.from('shifts').insert({ position_id: positeId, event_id: currentEventId, start_time: form.start_time, end_time: form.end_time, volunteers_required: parseInt(form.volunteers_required) || 1 })
    }
    setSaving(false); setShowModal(false); loadPostes()
    showToast(editPoste ? 'Poste mis à jour' : 'Poste créé')
  }

  async function handleDelete(pid) {
    const { data: sh } = await supabase.from('shifts').select('id').eq('position_id', pid)
    for (const s of sh || []) await supabase.from('assignments').delete().eq('shift_id', s.id)
    await supabase.from('shifts').delete().eq('position_id', pid)
    await supabase.from('positions').delete().eq('id', pid)
    setDeleteId(null); loadPostes(); showToast('Poste supprimé')
  }

  if (!currentEventId) return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', marginBottom: 4 }}>Postes</h1>
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
        <div style={{ fontSize: 36, marginBottom: 8 }}>📍</div>
        <div style={{ fontWeight: 600, color: '#374151' }}>Aucun événement actif</div>
        <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>Sélectionnez un événement dans la page Événements.</div>
      </div>
    </div>
  )

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#1C3829', color: '#fff', borderRadius: 10, padding: '12px 20px', fontSize: 14, fontWeight: 600, zIndex: 2000, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>{toast}</div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', marginBottom: 4 }}>Postes</h1>
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
          <p style={{ fontSize: 14, color: '#6b7280' }}>Gérez les postes et missions de l'événement.</p>
        </div>
        {canManage && <button onClick={openCreate} style={btnPrimary}>+ Nouveau poste</button>}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>Chargement...</div>
      ) : postes.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, border: '2px dashed #e5e7eb', padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📍</div>
          <div style={{ fontWeight: 600, color: '#374151', marginBottom: 16 }}>Aucun poste créé</div>
          {canManage && <button onClick={openCreate} style={btnPrimary}>+ Créer un poste</button>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {postes.map(p => {
            const req = p.volunteers_required || 0
            const aff = p.shifts?.reduce((s, sh) => s + (sh.assignments?.length || 0), 0) || 0
            const complet = req > 0 && aff >= req
            const t1 = p.shifts?.[0]?.start_time?.slice(0, 5) || ''
            const t2 = p.shifts?.[0]?.end_time?.slice(0, 5) || ''
            const bens = p.shifts?.flatMap(sh => sh.assignments?.map(a => a.profiles) || []) || []

            return (
              <div key={p.id} style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                {/* Header */}
                <div style={{ padding: '20px 20px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#111', flex: 1 }}>{p.name}</div>
                    <span style={{
                      background: complet ? '#dcfce7' : '#fff7ed',
                      color: complet ? '#16a34a' : '#ea580c',
                      border: `1px solid ${complet ? '#bbf7d0' : '#fed7aa'}`,
                      borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 600, flexShrink: 0, marginLeft: 8
                    }}>
                      {complet ? 'Complet' : 'Incomplet'}
                    </span>
                  </div>
                  {p.description && <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5, marginBottom: 8 }}>{p.description}</div>}
                  <div style={{ display: 'flex', gap: 14, fontSize: 13, color: '#6b7280', flexWrap: 'wrap' }}>
                    {p.location && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        {p.location}
                      </span>
                    )}
                    {t1 && t2 && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        {t1} – {t2}
                      </span>
                    )}
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                      {aff}/{req}
                    </span>
                  </div>
                </div>

                {/* Consignes */}
                {p.instructions && (
                  <div style={{ margin: '0 16px 12px', background: '#f9fafb', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      Consignes
                    </div>
                    <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{p.instructions}</div>
                  </div>
                )}

                {/* Bénévoles */}
                <div style={{ padding: '0 20px 16px' }}>
                  <div style={{ fontSize: 13, color: '#374151', fontWeight: 500, marginBottom: 8 }}>
                    {bens.length > 0 ? 'Bénévoles affectés :' : <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Aucun bénévole affecté</span>}
                  </div>
                  {bens.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {bens.map((b, i) => (
                        <span key={i} style={{ background: '#f3f4f6', color: '#374151', borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 500 }}>
                          {b?.first_name} {b?.last_name}
                        </span>
                      ))}
                    </div>
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

      {showModal && (
        <Modal title={editPoste ? 'Modifier le poste' : 'Nouveau poste'} onClose={() => setShowModal(false)}>
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
              <input style={inputStyle} type="number" min="1" value={form.volunteers_required} onChange={e => setForm({ ...form, volunteers_required: e.target.value })} />
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
            <textarea style={{ ...inputStyle, height: 80, resize: 'vertical' }} value={form.instructions} onChange={e => setForm({ ...form, instructions: e.target.value })} placeholder="Instructions pour les bénévoles..." />
          </Field>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button onClick={() => setShowModal(false)} style={btnSecondary}>Annuler</button>
            <button onClick={handleSave} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Enregistrement...' : editPoste ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </Modal>
      )}

      {deleteId && (
        <Modal title="Supprimer le poste" onClose={() => setDeleteId(null)}>
          <p style={{ fontSize: 14, color: '#374151', marginBottom: 24 }}>Êtes-vous sûr ? Toutes les affectations seront supprimées.</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setDeleteId(null)} style={btnSecondary}>Annuler</button>
            <button onClick={() => handleDelete(deleteId)} style={{ ...btnPrimary, background: '#dc2626' }}>Supprimer</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
