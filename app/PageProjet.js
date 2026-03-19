'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const CATEGORIES = ['Administratif', 'Logistique', 'Communication', 'Sécurité', 'Technique', 'Finances', 'Bénévoles', 'Général']
const PRIORITIES = { high: { label: 'Haute', color: '#dc2626', bg: '#fef2f2' }, medium: { label: 'Moyenne', color: '#F97316', bg: '#fff7ed' }, low: { label: 'Basse', color: '#16a34a', bg: '#f0fdf4' } }
const STATUSES = [
  { id: 'todo', label: 'À faire', color: '#6b7280', bg: '#f3f4f6' },
  { id: 'inprogress', label: 'En cours', color: '#2563eb', bg: '#eff6ff' },
  { id: 'done', label: 'Terminé', color: '#16a34a', bg: '#dcfce7' },
]
const CAT_COLORS = { Administratif: '#2563eb', Logistique: '#7c3aed', Communication: '#0891b2', Sécurité: '#dc2626', Technique: '#ea580c', Finances: '#16a34a', Bénévoles: '#F97316', Général: '#6b7280' }

const inputStyle = { width: '100%', padding: '10px 13px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box', color: '#111' }
const btnPrimary = { background: '#1C3829', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }
const btnSecondary = { background: '#fff', color: '#374151', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '7px 13px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }
const btnDanger = { background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 8, padding: '6px 10px', fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#111' }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#9ca3af' }}>&times;</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</label>
      {children}
    </div>
  )
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function isOverdue(d) {
  if (!d) return false
  return new Date(d) < new Date() && true
}

function TaskCard({ task, members, onEdit, onDelete, onStatusChange }) {
  const p = PRIORITIES[task.priority] || PRIORITIES.medium
  const assignee = members.find(m => m.id === task.assigned_to)
  const overdue = isOverdue(task.due_date) && task.status !== 'done'
  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', padding: '12px 14px', marginBottom: 8, cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
      onClick={() => onEdit(task)}>
      {/* Catégorie */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <span style={{ background: CAT_COLORS[task.category] + '20', color: CAT_COLORS[task.category] || '#6b7280', borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
          {task.category}
        </span>
        <span style={{ background: p.bg, color: p.color, borderRadius: 20, padding: '2px 7px', fontSize: 10, fontWeight: 600 }}>{p.label}</span>
      </div>
      <div style={{ fontWeight: 600, fontSize: 13, color: '#111', marginBottom: 6, lineHeight: 1.4 }}>{task.title}</div>
      {task.description && <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{task.description}</div>}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {task.due_date && (
            <span style={{ fontSize: 11, color: overdue ? '#dc2626' : '#9ca3af', fontWeight: overdue ? 700 : 400 }}>
              📅 {formatDate(task.due_date)}{overdue ? ' ⚠️' : ''}
            </span>
          )}
          {assignee && (
            <span style={{ fontSize: 11, color: '#6b7280' }}>
              👤 {assignee.first_name}
            </span>
          )}
        </div>
        <select value={task.status} onClick={e => e.stopPropagation()} onChange={e => onStatusChange(task.id, e.target.value)}
          style={{ fontSize: 11, border: '1px solid #e5e7eb', borderRadius: 6, padding: '2px 6px', cursor: 'pointer', background: '#f9fafb', color: '#374151', fontFamily: 'Inter, sans-serif' }}>
          {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>
    </div>
  )
}

function MilestoneMarker({ milestone }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 8, marginBottom: 8 }}>
      <span style={{ fontSize: 14 }}>🏁</span>
      <div>
        <div style={{ fontWeight: 700, fontSize: 12, color: '#92400e' }}>{milestone.name}</div>
        <div style={{ fontSize: 11, color: '#b45309' }}>{formatDate(milestone.date)}</div>
      </div>
    </div>
  )
}

export default function PageProjet({ profile, activeEventId, activeEventName }) {
  const [tasks, setTasks] = useState([])
  const [milestones, setMilestones] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('kanban')
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showMilestoneModal, setShowMilestoneModal] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [editMilestone, setEditMilestone] = useState(null)
  const [taskForm, setTaskForm] = useState({ title: '', description: '', category: 'Général', status: 'todo', priority: 'medium', due_date: '', assigned_to: '', milestone_id: '' })
  const [milestoneForm, setMilestoneForm] = useState({ name: '', date: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [filterCat, setFilterCat] = useState('all')
  const [toast, setToast] = useState('')

  const canEdit = profile?.role === 'admin' || profile?.role === 'organizer'

  useEffect(() => { if (activeEventId) loadAll() }, [activeEventId])

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 2500) }

  async function loadAll() {
    setLoading(true)
    const [tasksRes, milestonesRes, membersRes] = await Promise.all([
      supabase.from('project_tasks').select('*').eq('event_id', activeEventId).order('due_date', { ascending: true, nullsFirst: false }),
      supabase.from('project_milestones').select('*').eq('event_id', activeEventId).order('date'),
      supabase.from('event_organizers').select('user_id, profiles(id, first_name, last_name)').eq('event_id', activeEventId),
    ])
    setTasks(tasksRes.data || [])
    setMilestones(milestonesRes.data || [])
    const orgMembers = (membersRes.data || []).map(m => m.profiles).filter(Boolean)
    // Ajouter aussi l'admin courant
    const { data: adminProfile } = await supabase.from('profiles').select('id, first_name, last_name').eq('role', 'admin')
    setMembers([...orgMembers, ...(adminProfile || [])].filter((m, i, arr) => arr.findIndex(x => x.id === m.id) === i))
    setLoading(false)
  }

  async function handleSaveTask() {
    if (!taskForm.title.trim()) return
    setSaving(true)
    const payload = {
      ...taskForm,
      event_id: activeEventId,
      assigned_to: taskForm.assigned_to || null,
      milestone_id: taskForm.milestone_id || null,
      due_date: taskForm.due_date || null,
      created_by: profile?.id,
    }
    if (editTask) {
      await supabase.from('project_tasks').update(payload).eq('id', editTask.id)
    } else {
      await supabase.from('project_tasks').insert(payload)
    }
    setSaving(false); setShowTaskModal(false); loadAll()
    showToast(editTask ? 'Tâche mise à jour' : 'Tâche créée')
  }

  async function handleSaveMilestone() {
    if (!milestoneForm.name.trim() || !milestoneForm.date) return
    setSaving(true)
    const payload = { ...milestoneForm, event_id: activeEventId }
    if (editMilestone) {
      await supabase.from('project_milestones').update(payload).eq('id', editMilestone.id)
    } else {
      await supabase.from('project_milestones').insert(payload)
    }
    setSaving(false); setShowMilestoneModal(false); loadAll()
    showToast(editMilestone ? 'Jalon mis à jour' : 'Jalon créé')
  }

  async function handleDeleteTask(id) {
    await supabase.from('project_tasks').delete().eq('id', id)
    setShowTaskModal(false); loadAll(); showToast('Tâche supprimée')
  }

  async function handleDeleteMilestone(id) {
    await supabase.from('project_milestones').delete().eq('id', id)
    setShowMilestoneModal(false); loadAll(); showToast('Jalon supprimé')
  }

  async function handleStatusChange(taskId, newStatus) {
    await supabase.from('project_tasks').update({ status: newStatus }).eq('id', taskId)
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
  }

  function openEditTask(task) {
    setEditTask(task)
    setTaskForm({ title: task.title, description: task.description || '', category: task.category || 'Général', status: task.status || 'todo', priority: task.priority || 'medium', due_date: task.due_date || '', assigned_to: task.assigned_to || '', milestone_id: task.milestone_id || '' })
    setShowTaskModal(true)
  }

  function openNewTask(status = 'todo') {
    setEditTask(null)
    setTaskForm({ title: '', description: '', category: 'Général', status, priority: 'medium', due_date: '', assigned_to: '', milestone_id: '' })
    setShowTaskModal(true)
  }

  function openEditMilestone(m) {
    setEditMilestone(m)
    setMilestoneForm({ name: m.name, date: m.date, description: m.description || '' })
    setShowMilestoneModal(true)
  }

  const filteredTasks = filterCat === 'all' ? tasks : tasks.filter(t => t.category === filterCat)
  const stats = { total: tasks.length, todo: tasks.filter(t => t.status === 'todo').length, inprogress: tasks.filter(t => t.status === 'inprogress').length, done: tasks.filter(t => t.status === 'done').length }

  if (!activeEventId) return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', marginBottom: 4 }}>Projet</h1>
      <div style={{ background: '#fff', borderRadius: 12, border: '2px dashed #e5e7eb', padding: 48, textAlign: 'center', marginTop: 20 }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
        <div style={{ fontWeight: 600, color: '#374151' }}>Aucun événement actif</div>
      </div>
    </div>
  )

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      {toast && <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#1C3829', color: '#fff', borderRadius: 10, padding: '12px 20px', fontSize: 14, fontWeight: 600, zIndex: 2000, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>{toast}</div>}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', marginBottom: 4 }}>Projet</h1>
          <p style={{ fontSize: 14, color: '#6b7280' }}>Organisation de <strong style={{ color: '#1C3829' }}>{activeEventName}</strong></p>
        </div>
        {canEdit && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setEditMilestone(null); setMilestoneForm({ name: '', date: '', description: '' }); setShowMilestoneModal(true) }}
              style={{ background: '#fef9c3', color: '#92400e', border: '1px solid #fde68a', borderRadius: 8, padding: '9px 14px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
              🏁 Jalon
            </button>
            <button onClick={() => openNewTask()} style={btnPrimary}>+ Tâche</button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total', value: stats.total, color: '#374151' },
          { label: 'À faire', value: stats.todo, color: '#6b7280' },
          { label: 'En cours', value: stats.inprogress, color: '#2563eb' },
          { label: 'Terminées', value: stats.done, color: '#16a34a' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', padding: '12px 16px' }}>
            <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Barre progression */}
      {stats.total > 0 && (
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', padding: '12px 16px', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
            <span style={{ color: '#374151', fontWeight: 600 }}>Progression globale</span>
            <span style={{ color: '#16a34a', fontWeight: 700 }}>{Math.round(stats.done / stats.total * 100)}%</span>
          </div>
          <div style={{ height: 8, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.round(stats.done / stats.total * 100)}%`, background: '#16a34a', borderRadius: 4, transition: 'width 0.3s' }} />
          </div>
        </div>
      )}

      {/* Filtres catégories + vue */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => setFilterCat('all')} style={{ padding: '5px 12px', borderRadius: 20, border: '1.5px solid', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', background: filterCat === 'all' ? '#1C3829' : '#fff', color: filterCat === 'all' ? '#fff' : '#6b7280', borderColor: filterCat === 'all' ? '#1C3829' : '#e5e7eb' }}>Toutes</button>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setFilterCat(c)} style={{ padding: '5px 12px', borderRadius: 20, border: '1.5px solid', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', background: filterCat === c ? CAT_COLORS[c] : '#fff', color: filterCat === c ? '#fff' : '#6b7280', borderColor: filterCat === c ? CAT_COLORS[c] : '#e5e7eb' }}>{c}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 4, background: '#f9fafb', borderRadius: 8, padding: 3 }}>
          {[['kanban', '▦ Kanban'], ['list', '☰ Liste'], ['timeline', '📅 Timeline']].map(([v, l]) => (
            <button key={v} onClick={() => setView(v)} style={{ padding: '6px 12px', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600, background: view === v ? '#fff' : 'transparent', color: view === v ? '#111' : '#6b7280', boxShadow: view === v ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>{l}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>Chargement...</div>
      ) : (
        <>
          {/* KANBAN */}
          {view === 'kanban' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {STATUSES.map(s => {
                const colTasks = filteredTasks.filter(t => t.status === s.id)
                return (
                  <div key={s.id} style={{ background: '#f9fafb', borderRadius: 12, padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
                        <span style={{ fontWeight: 700, fontSize: 13, color: '#374151' }}>{s.label}</span>
                        <span style={{ background: s.bg, color: s.color, borderRadius: 20, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>{colTasks.length}</span>
                      </div>
                      {canEdit && (
                        <button onClick={() => openNewTask(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 18, lineHeight: 1, padding: 0 }} title="Ajouter une tâche">+</button>
                      )}
                    </div>
                    {/* Jalons dans la colonne todo */}
                    {s.id === 'todo' && milestones.map(m => <MilestoneMarker key={m.id} milestone={m} />)}
                    {colTasks.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 12, color: '#d1d5db' }}>Aucune tâche</div>
                    ) : (
                      colTasks.map(task => (
                        <TaskCard key={task.id} task={task} members={members} onEdit={openEditTask} onDelete={handleDeleteTask} onStatusChange={handleStatusChange} />
                      ))
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* LISTE */}
          {view === 'list' && (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              {/* Jalons */}
              {milestones.length > 0 && (
                <div style={{ padding: '12px 20px', background: '#fef9c3', borderBottom: '1px solid #fde68a' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.4px' }}>🏁 Jalons</div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {milestones.map(m => (
                      <div key={m.id} onClick={() => canEdit && openEditMilestone(m)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', borderRadius: 8, padding: '6px 12px', cursor: canEdit ? 'pointer' : 'default', border: '1px solid #fde68a' }}>
                        <span style={{ fontWeight: 600, fontSize: 13, color: '#92400e' }}>{m.name}</span>
                        <span style={{ fontSize: 11, color: '#b45309' }}>{formatDate(m.date)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    {['Tâche', 'Catégorie', 'Priorité', 'Statut', 'Échéance', 'Responsable'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Aucune tâche</td></tr>
                  ) : filteredTasks.map((task, i) => {
                    const p = PRIORITIES[task.priority] || PRIORITIES.medium
                    const s = STATUSES.find(x => x.id === task.status) || STATUSES[0]
                    const assignee = members.find(m => m.id === task.assigned_to)
                    const overdue = isOverdue(task.due_date) && task.status !== 'done'
                    return (
                      <tr key={task.id} onClick={() => canEdit && openEditTask(task)}
                        style={{ borderBottom: i < filteredTasks.length - 1 ? '1px solid #f3f4f6' : 'none', cursor: canEdit ? 'pointer' : 'default' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: '#111' }}>{task.title}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ background: CAT_COLORS[task.category] + '20', color: CAT_COLORS[task.category], borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{task.category}</span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ background: p.bg, color: p.color, borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{p.label}</span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <select value={task.status} onClick={e => e.stopPropagation()} onChange={e => handleStatusChange(task.id, e.target.value)}
                            style={{ background: s.bg, color: s.color, border: 'none', borderRadius: 6, padding: '3px 8px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                            {STATUSES.map(st => <option key={st.id} value={st.id}>{st.label}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: overdue ? '#dc2626' : '#6b7280', fontWeight: overdue ? 700 : 400 }}>
                          {task.due_date ? formatDate(task.due_date) + (overdue ? ' ⚠️' : '') : '-'}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: '#6b7280' }}>
                          {assignee ? `${assignee.first_name} ${assignee.last_name}` : '-'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* TIMELINE */}
          {view === 'timeline' && (
            <div>
              {/* Milestones sur la timeline */}
              {milestones.length > 0 && (
                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20, marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 14 }}>🏁 Jalons clés</div>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 16, top: 0, bottom: 0, width: 2, background: '#e5e7eb' }} />
                    {milestones.map((m, i) => (
                      <div key={m.id} style={{ display: 'flex', gap: 16, marginBottom: 16, paddingLeft: 44, position: 'relative' }}
                        onClick={() => canEdit && openEditMilestone(m)}>
                        <div style={{ position: 'absolute', left: 8, top: 4, width: 18, height: 18, borderRadius: '50%', background: '#fde68a', border: '3px solid #f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8 }}>🏁</div>
                        <div style={{ background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 14px', flex: 1, cursor: canEdit ? 'pointer' : 'default' }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: '#92400e' }}>{m.name}</div>
                          <div style={{ fontSize: 12, color: '#b45309', marginTop: 2 }}>{new Date(m.date + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                          {m.description && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{m.description}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tâches par catégorie */}
              {CATEGORIES.filter(c => filterCat === 'all' || filterCat === c).map(cat => {
                const catTasks = filteredTasks.filter(t => t.category === cat)
                if (catTasks.length === 0) return null
                return (
                  <div key={cat} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20, marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: CAT_COLORS[cat] }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{cat}</span>
                      <span style={{ fontSize: 11, color: '#9ca3af' }}>{catTasks.length} tâche{catTasks.length > 1 ? 's' : ''}</span>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: 16, top: 0, bottom: 0, width: 2, background: '#f3f4f6' }} />
                      {catTasks.map(task => {
                        const s = STATUSES.find(x => x.id === task.status) || STATUSES[0]
                        const p = PRIORITIES[task.priority] || PRIORITIES.medium
                        const assignee = members.find(m => m.id === task.assigned_to)
                        const overdue = isOverdue(task.due_date) && task.status !== 'done'
                        return (
                          <div key={task.id} style={{ display: 'flex', gap: 16, marginBottom: 10, paddingLeft: 44, position: 'relative' }}
                            onClick={() => canEdit && openEditTask(task)}>
                            <div style={{ position: 'absolute', left: 8, top: 6, width: 16, height: 16, borderRadius: '50%', background: s.bg, border: `2px solid ${s.color}` }} />
                            <div style={{ flex: 1, background: '#f9fafb', borderRadius: 8, padding: '10px 14px', cursor: canEdit ? 'pointer' : 'default', border: '1px solid #f3f4f6' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ fontWeight: 600, fontSize: 13, color: '#111' }}>{task.title}</div>
                                <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 8 }}>
                                  <span style={{ background: p.bg, color: p.color, borderRadius: 20, padding: '1px 7px', fontSize: 10, fontWeight: 600 }}>{p.label}</span>
                                  <span style={{ background: s.bg, color: s.color, borderRadius: 20, padding: '1px 7px', fontSize: 10, fontWeight: 600 }}>{s.label}</span>
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                                {task.due_date && <span style={{ color: overdue ? '#dc2626' : '#9ca3af', fontWeight: overdue ? 700 : 400 }}>📅 {formatDate(task.due_date)}{overdue ? ' ⚠️' : ''}</span>}
                                {assignee && <span>👤 {assignee.first_name} {assignee.last_name}</span>}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Modal tâche */}
      {showTaskModal && (
        <Modal title={editTask ? 'Modifier la tâche' : 'Nouvelle tâche'} onClose={() => setShowTaskModal(false)}>
          <Field label="Titre *">
            <input style={inputStyle} value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="Ex: Déposer le dossier préfecture" />
          </Field>
          <Field label="Description">
            <textarea style={{ ...inputStyle, height: 64, resize: 'vertical' }} value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Catégorie">
              <select style={inputStyle} value={taskForm.category} onChange={e => setTaskForm({ ...taskForm, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Priorité">
              <select style={inputStyle} value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}>
                <option value="high">Haute</option>
                <option value="medium">Moyenne</option>
                <option value="low">Basse</option>
              </select>
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Statut">
              <select style={inputStyle} value={taskForm.status} onChange={e => setTaskForm({ ...taskForm, status: e.target.value })}>
                {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </Field>
            <Field label="Date échéance">
              <input style={inputStyle} type="date" value={taskForm.due_date} onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })} />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Responsable">
              <select style={inputStyle} value={taskForm.assigned_to} onChange={e => setTaskForm({ ...taskForm, assigned_to: e.target.value })}>
                <option value="">- Aucun -</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>)}
              </select>
            </Field>
            <Field label="Jalon associé">
              <select style={inputStyle} value={taskForm.milestone_id} onChange={e => setTaskForm({ ...taskForm, milestone_id: e.target.value })}>
                <option value="">- Aucun -</option>
                {milestones.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </Field>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', marginTop: 8 }}>
            {editTask && <button onClick={() => handleDeleteTask(editTask.id)} style={btnDanger}>Supprimer</button>}
            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
              <button onClick={() => setShowTaskModal(false)} style={btnSecondary}>Annuler</button>
              <button onClick={handleSaveTask} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Enregistrement...' : editTask ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal jalon */}
      {showMilestoneModal && (
        <Modal title={editMilestone ? 'Modifier le jalon' : 'Nouveau jalon'} onClose={() => setShowMilestoneModal(false)}>
          <Field label="Nom du jalon *">
            <input style={inputStyle} value={milestoneForm.name} onChange={e => setMilestoneForm({ ...milestoneForm, name: e.target.value })} placeholder="Ex: Dépôt dossier préfecture" />
          </Field>
          <Field label="Date *">
            <input style={inputStyle} type="date" value={milestoneForm.date} onChange={e => setMilestoneForm({ ...milestoneForm, date: e.target.value })} />
          </Field>
          <Field label="Description">
            <textarea style={{ ...inputStyle, height: 64, resize: 'vertical' }} value={milestoneForm.description} onChange={e => setMilestoneForm({ ...milestoneForm, description: e.target.value })} />
          </Field>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', marginTop: 8 }}>
            {editMilestone && <button onClick={() => handleDeleteMilestone(editMilestone.id)} style={btnDanger}>Supprimer</button>}
            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
              <button onClick={() => setShowMilestoneModal(false)} style={btnSecondary}>Annuler</button>
              <button onClick={handleSaveMilestone} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Enregistrement...' : editMilestone ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
