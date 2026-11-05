'use client'

import { ChangeEvent, FormEvent, useState } from 'react'
import { Camera, Loader2, Save } from 'lucide-react'
import { updateProfile } from '@/app/actions/profile'

type Profile = { name: string; email: string; image: string | null; bio: string | null; favoriteRole: string | null; favoriteMap: string | null }

export function ProfileForm({ profile }: { profile: Profile }) {
  const [form, setForm] = useState({ name: profile.name, bio: profile.bio ?? '', favoriteRole: profile.favoriteRole ?? '', favoriteMap: profile.favoriteMap ?? '', image: profile.image ?? '' })
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true); setError('')
    const data = new FormData(); data.set('file', file)
    const response = await fetch('/api/profile/avatar', { method: 'POST', body: data })
    const result = await response.json()
    setUploading(false)
    if (!response.ok) { setError(result.error ?? 'Não foi possível enviar a foto.'); return }
    setForm((current) => ({ ...current, image: result.url }))
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); setPending(true); setMessage(''); setError('')
    try { await updateProfile(form); setMessage('Perfil atualizado com sucesso.') } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível salvar o perfil.') } finally { setPending(false) }
  }
  return <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[220px_1fr]"><div className="flex flex-col items-center gap-4"><div className="relative flex size-32 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[#1d6cff]/15 text-4xl font-semibold text-[#9bc0ff]">{form.image ? <img src={form.image} alt={`Foto de perfil de ${form.name}`} className="size-full object-cover" /> : form.name.slice(0, 1).toUpperCase()}<label className="absolute inset-x-0 bottom-0 flex cursor-pointer items-center justify-center gap-1 bg-black/70 py-2 text-xs font-semibold text-white"><Camera className="size-3" />{uploading ? 'Enviando...' : 'Trocar foto'}<input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={upload} disabled={uploading} /></label></div><p className="text-center text-xs text-[#94a0b1]">PNG, JPG ou WebP<br />Máximo de 5 MB</p></div><div className="grid gap-5"><label className="grid gap-2 text-sm font-medium">Nome de exibição<input required minLength={2} maxLength={60} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="rounded-xl border border-white/10 bg-[#0c1118] px-4 py-3 outline-none focus:border-[#5c9bff]" /></label><label className="grid gap-2 text-sm font-medium">E-mail<input value={profile.email} disabled className="rounded-xl border border-white/10 bg-[#0c1118]/60 px-4 py-3 text-[#94a0b1]" /></label><div className="grid gap-5 sm:grid-cols-2"><label className="grid gap-2 text-sm font-medium">Função favorita<input maxLength={40} placeholder="Entry, suporte, lurker..." value={form.favoriteRole} onChange={(event) => setForm({ ...form, favoriteRole: event.target.value })} className="rounded-xl border border-white/10 bg-[#0c1118] px-4 py-3 outline-none focus:border-[#5c9bff]" /></label><label className="grid gap-2 text-sm font-medium">Mapa favorito<input maxLength={60} placeholder="Ancient, Mirage..." value={form.favoriteMap} onChange={(event) => setForm({ ...form, favoriteMap: event.target.value })} className="rounded-xl border border-white/10 bg-[#0c1118] px-4 py-3 outline-none focus:border-[#5c9bff]" /></label></div><label className="grid gap-2 text-sm font-medium">Sobre você<textarea maxLength={240} rows={4} placeholder="Conte um pouco sobre seu estilo de jogo..." value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} className="resize-none rounded-xl border border-white/10 bg-[#0c1118] px-4 py-3 outline-none focus:border-[#5c9bff]" /></label>{message && <p role="status" className="text-sm text-emerald-300">{message}</p>}{error && <p role="alert" className="text-sm text-red-200">{error}</p>}<button disabled={pending || uploading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1d6cff] px-5 py-3 font-semibold disabled:opacity-60">{pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}Salvar perfil</button></div></form>
}
