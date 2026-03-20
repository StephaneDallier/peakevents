'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const inputStyle = { width: '100%', padding: '10px 13px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box', color: '#111' }
const btnPrimary = { background: '#1C3829', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }
const btnSecondary = { background: '#fff', color: '#374151', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '10px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }

function Field({ label, children, hint }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{hint}</div>}
    </div>
  )
}

const SKILLS_OPTIONS = ['Secourisme', 'PSC1', 'Natation', 'Kayak', 'Trail', 'Triathlon', 'Logistique', 'Communication', 'Balisage', 'Chronométrage', 'Accueil', 'Cuisine', 'Médical', 'Informatique']

function getSkills(p) {
  try {
    if (!p) return []
    if (Array.isArray(p)) return p
    if (typeof p === 'string') return JSON.parse(p)
    return []
  } catch { return [] }
}

function RoleBadge({ role }) {
  const map = {
    admin: { bg: '#fef2f2', color: '#dc2626', label: 'Administrateur' },
    organizer: { bg: '#eff6ff', color: '#2563eb', label: 'Organisateur' },
    volunteer: { bg: '#f0fdf4', color: '#16a34a', label: 'Bénévole' },
  }
  const s = map[role] || map.volunteer
  return <span style={{ background: s.bg, color: s.color, borderRadius: 20, padding: '4px 14px', fontSize: 13, fontWeight: 700 }}>{s.label}</span>
}

export default function PageProfil({ profile: currentProfile, onProfileUpdate }) {
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '', club: '', comment: '' })
  const [skills, setSkills] = useState([])
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [pwdForm, setPwdForm] = useState({ current: '', next: '', confirm: '' })
  const [pwdError, setPwdError] = useState('')
  const [savingPwd, setSavingPwd] = useState(false)
  const [showCurrentPwd, setShowCurrentPwd] = useState(false)
  const [showNextPwd, setShowNextPwd] = useState(false)

  useEffect(() => {
    if (currentProfile) {
      setForm({
        first_name: currentProfile.first_name || '',
        last_name: currentProfile.last_name || '',
        phone: currentProfile.phone || '',
        club: currentProfile.club || '',
        comment: currentProfile.comment || '',
      })
      setSkills(getSkills(currentProfile.skills))
    }
  }, [currentProfile])

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  function toggleSkill(skill) {
    setSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill])
  }

  async function handleSave() {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      showToast('Prénom et nom sont obligatoires')
      return
    }
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      phone: form.phone.trim() || null,
      club: form.club.trim() || null,
      comment: form.comment.trim() || null,
      skills: JSON.stringify(skills),
    }).eq('id', currentProfile.id)
    setSaving(false)
    if (error) { showToast('Erreur : ' + error.message); return }
    showToast('Profil mis à jour ✓')
    if (onProfileUpdate) onProfileUpdate()
  }

  async function handleChangePwd() {
    setPwdError('')
    if (!pwdForm.next || pwdForm.next.length < 6) { setPwdError('Le nouveau mot de passe doit faire au moins 6 caractères'); return }
    if (pwdForm.next !== pwdForm.confirm) { setPwdError('Les mots de passe ne correspondent pas'); return }
    setSavingPwd(true)
    const { error } = await supabase.auth.updateUser({ password: pwdForm.next })
    setSavingPwd(false)
    if (error) { setPwdError('Erreur : ' + error.message); return }
    setShowPwd(false)
    setPwdForm({ current: '', next: '', confirm: '' })
    showToast('Mot de passe mis à jour ✓')
  }

  const initials = ((currentProfile?.first_name?.[0] || '') + (currentProfile?.last_name?.[0] || '')).toUpperCase() || '?'

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: 680, margin: '0 auto' }}>
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#1C3829', color: '#fff', borderRadius: 10, padding: '12px 20px', fontSize: 14, fontWeight: 600, zIndex: 2000, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>{toast}</div>
      )}

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', marginBottom: 4 }}>Mon profil</h1>
        <p style={{ fontSize: 14, color: '#6b7280' }}>Gérez vos informations personnelles.</p>
      </div>

      {/* Carte identité */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#1C3829', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 26, flexShrink: 0 }}>
          {initials}
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#111', marginBottom: 4 }}>
            {currentProfile?.first_name} {currentProfile?.last_name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <RoleBadge role={currentProfile?.role} />
            <span style={{ fontSize: 13, color: '#9ca3af' }}>{currentProfile?.email}</span>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24, marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 20 }}>Informations personnelles</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label="Prénom *">
            <input style={inputStyle} value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} placeholder="Jean" />
          </Field>
          <Field label="Nom *">
            <input style={inputStyle} value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} placeholder="Dupont" />
          </Field>
        </div>

        <Field label="Téléphone">
          <input style={inputStyle} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="06 00 00 00 00" />
        </Field>

        <Field label="Club / Association">
          <input style={inputStyle} value={form.club} onChange={e => setForm({ ...form, club: e.target.value })} placeholder="Club Trail Verdon" />
        </Field>

        <Field label="À propos" hint="Décrivez vos compétences, disponibilités ou informations utiles pour les organisateurs">
          <textarea style={{ ...inputStyle, height: 80, resize: 'vertical' }} value={form.comment} onChange={e => setForm({ ...form, comment: e.target.value })} placeholder="Ex: Infirmière, disponible le week-end, PSC1 valide..." />
        </Field>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <button onClick={handleSave} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {/* Compétences */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24, marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 6 }}>Mes compétences</div>
        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>Sélectionnez vos compétences pour aider les organisateurs à vous affecter aux bons postes.</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {SKILLS_OPTIONS.map(skill => {
            const selected = skills.includes(skill)
            return (
              <button key={skill} onClick={() => toggleSkill(skill)}
                style={{ padding: '7px 14px', borderRadius: 20, border: '2px solid', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
                  background: selected ? '#1C3829' : '#fff',
                  color: selected ? '#fff' : '#374151',
                  borderColor: selected ? '#1C3829' : '#e5e7eb',
                }}>
                {skill}
              </button>
            )
          })}
        </div>
        {skills.length > 0 && (
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
            Sélectionnées : <strong style={{ color: '#1C3829' }}>{skills.join(', ')}</strong>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleSave} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Enregistrement...' : 'Enregistrer les compétences'}
          </button>
        </div>
      </div>

      {/* Mot de passe */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showPwd ? 20 : 0 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>Mot de passe</div>
            {!showPwd && <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 2 }}>••••••••</div>}
          </div>
          <button onClick={() => { setShowPwd(!showPwd); setPwdError('') }} style={btnSecondary}>
            {showPwd ? 'Annuler' : 'Modifier'}
          </button>
        </div>

        {showPwd && (
          <>
            {pwdError && (
              <div style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 8, padding: '10px 13px', fontSize: 13, marginBottom: 14 }}>{pwdError}</div>
            )}
            <Field label="Nouveau mot de passe *" hint="Minimum 6 caractères">
              <div style={{ position: 'relative' }}>
                <input style={{ ...inputStyle, paddingRight: 44 }} type={showNextPwd ? 'text' : 'password'} value={pwdForm.next} onChange={e => setPwdForm({ ...pwdForm, next: e.target.value })} placeholder="••••••••" />
                <button type="button" onClick={() => setShowNextPwd(!showNextPwd)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#9ca3af' }}>
                  {showNextPwd ? '🙈' : '👁️'}
                </button>
              </div>
            </Field>
            <Field label="Confirmer le mot de passe *">
              <input style={inputStyle} type="password" value={pwdForm.confirm} onChange={e => setPwdForm({ ...pwdForm, confirm: e.target.value })} placeholder="••••••••" />
            </Field>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowPwd(false); setPwdForm({ current: '', next: '', confirm: '' }); setPwdError('') }} style={btnSecondary}>Annuler</button>
              <button onClick={handleChangePwd} disabled={savingPwd} style={{ ...btnPrimary, opacity: savingPwd ? 0.6 : 1 }}>
                {savingPwd ? 'Enregistrement...' : 'Changer le mot de passe'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
