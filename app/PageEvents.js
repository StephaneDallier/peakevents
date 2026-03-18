'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#111' }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#9ca3af', lineHeight: 1 }}>&times;</button>
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
const emptyForm = { name: '', start_date: '', end_date: '', location: '', description: '', status: 'draft' }

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function StatusBadge({ status }) {
  const map = {
    draft: { bg: '#f3f4f6', color: '#6b7280', label: 'Brouillon' },
    published: { bg: '#dcfce7', color: '#16a34a', label: 'Publié' },
    completed: { bg: '#dbeafe', color: '#2563eb', label: 'Terminé' },
    archived: { bg: '#fef3c7', color: '#d97706', label: 'Archive' },
  }
  const s = map[status] || map.draft
  return <span style={{ background: s.bg, color: s.color, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>{s.label}</span>
}

export default function PageEvents({ profile, onSetActivéEvent }) {
  const [events, setEvents] = useState([])
  const [filtered, setFiltered] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editEvent, setEditEvent] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteId, setDeleteId] = useState(null)

  const isAdmin = profile?.role === 'admin'

  useEffect(() => { loadEvents() }, [])

  async function loadEvents() {
    setLoading(true)
    const { data } = await supabase
      .from('events')
      .select('*,positions(id,volunteers_required,shifts(id,assignments(id)))')
      .order('start_date')
    const evts = data || []
    setEvents(evts)
    setFiltered(evts)
    setLoading(false)
  }

  function applyFilter(f, evts) {
    setFilter(f)
    setFiltered(f === 'all' ? evts : evts.filter(e => e.status === f))
  }

  function openCreate() { setEditEvent(null); setForm(emptyForm); setError(''); setShowModal(true) }

  function openEdit(ev) {
    setEditEvent(ev)
    setForm({ name: ev.name || '', start_date: ev.start_date || '', end_date: ev.end_date || '', location: ev.location || '', description: ev.description || '', status: ev.status || 'draft' })
    setError(''); setShowModal(true)
  }

  async function handleSave() {
    if (!form.name || !form.start_date) { setError('Nom et date de début sont obligatoires'); return }
    setSaving(true); setError('')
    const { data: { user } } = await supabase.auth.getUser()
    const payload = { name: form.name, start_date: form.start_date, end_date: form.end_date || null, location: form.location, description: form.description, status: form.status, created_by: user?.id }
    let err
    if (editEvent) {
      const { created_by, ...up } = payload
      ;({ error: err } = await supabase.from('events').update(up).eq('id', editEvent.id))
    } else {
      ;({ error: err } = await supabase.from('events').insert(payload))
    }
    setSaving(false)
    if (err) { setError('Erreur : ' + err.message); return }
    setShowModal(false); loadEvents()
  }

  async function handleDelete(id) {
    await supabase.from('events').delete().eq('id', id)
    setDeleteId(null); loadEvents()
  }

  function getRemplissage(ev) {
    const req = ev.positions?.reduce((s, p) => s + (p.volunteers_required || 0), 0) || 0
    const aff = ev.positions?.reduce((s, p) => s + (p.shifts?.reduce((ss, sh) => ss + (sh.assignments?.length || 0), 0) || 0), 0) || 0
    const pct = req > 0 ? Math.round(aff / req * 100) : 0
    const color = pct >= 80 ? '#16a34a' : pct >= 40 ? '#F97316' : '#dc2626'
    return { pct, color }
  }

  const filters = [{ key: 'all', label: 'Tous' }, { key: 'draft', label: 'Brouillon' }, { key: 'published', label: 'Publié' }, { key: 'completed', label: 'Terminé' }]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', marginBottom: 4 }}>Événements</h1>
          <p style={{ fontSize: 14, color: '#6b7280' }}>Tous les événements de la plateforme.</p>
        </div>
        {isAdmin && <button onClick={openCreate} style={btnPrimary}>+ Nouvel événement</button>}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {filters.map(f => (
          <button key={f.key} onClick={() => applyFilter(f.key, events)}
            style={{ padding: '6px 14px', borderRadius: 20, border: '1.5px solid', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', background: filter === f.key ? '#1C3829' : '#fff', color: filter === f.key ? '#fff' : '#6b7280', borderColor: filter === f.key ? '#1C3829' : '#e5e7eb' }}>
            {f.label}
          </button>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Nom', 'Dates', 'Lieu', 'Statut', 'Remplissage', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Chargement...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6}>
                  <div style={{ padding: 48, textAlign: 'center' }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>📅</div>
                    <div style={{ fontWeight: 600, color: '#374151', marginBottom: 4 }}>Aucun événement</div>
                    <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 16 }}>Crééz votre premier événement pour commencer.</div>
                    {isAdmin && <button onClick={openCreate} style={btnPrimary}>+ Créer un événement</button>}
                  </div>
                </td></tr>
              ) : filtered.map((ev, i) => {
                const { pct, color } = getRemplissage(ev)
                return (
                  <tr key={ev.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <span onClick={() => onSetActivéEvent && onSetActivéEvent(ev.id, ev.name)}
                        style={{ fontWeight: 700, color: '#1C3829', cursor: 'pointer' }}
                        title="Definir comme événement actif">
                        {ev.name}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#6b7280', whiteSpace: 'nowrap' }}>{formatDate(ev.start_date)}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#374151' }}>{ev.location || '-'}</td>
                    <td style={{ padding: '14px 16px' }}><StatusBadge status={ev.status} /></td>
                    <td style={{ padding: '14px 16px', minWidth: 130 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 11, color: '#6b7280' }}>{pct}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {isAdmin && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => openEdit(ev)} style={btnSecondary}>Modifier</button>
                          <button onClick={() => setDeleteId(ev.id)} style={btnDanger}>Suppr.</button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <Modal title={editEvent ? "Modifier l'événement" : 'Nouvel événement'} onClose={() => setShowModal(false)}>
          {error && <div style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 8, padding: '10px 13px', fontSize: 13, marginBottom: 16 }}>{error}</div>}
          <Field label="Nom de l'événement *">
            <input style={inputStyle} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: SwimRun du Verdon" />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Date de début *">
              <input style={inputStyle} type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
            </Field>
            <Field label="Date de fin">
              <input style={inputStyle} type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
            </Field>
          </div>
          <Field label="Lieu">
            <input style={inputStyle} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Ex: Verdon, France" />
          </Field>
          <Field label="Statut">
            <select style={inputStyle} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option value="draft">Brouillon</option>
              <option value="published">Publié</option>
              <option value="completed">Terminé</option>
            </select>
          </Field>
          <Field label="Description">
            <textarea style={{ ...inputStyle, height: 80, resize: 'vertical' }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description de l'événement..." />
          </Field>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button onClick={() => setShowModal(false)} style={btnSecondary}>Annuler</button>
            <button onClick={handleSave} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Enregistrement...' : editEvent ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </Modal>
      )}

      {deleteId && (
        <Modal title="Supprimer l'événement" onClose={() => setDeleteId(null)}>
          <p style={{ fontSize: 14, color: '#374151', marginBottom: 24 }}>Êtes-vous sûr de vouloir supprimer cet événement ? Cette action est irréversible.</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setDeleteId(null)} style={btnSecondary}>Annuler</button>
            <button onClick={() => handleDelete(deleteId)} style={{ ...btnPrimary, background: '#dc2626' }}>Supprimer</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
