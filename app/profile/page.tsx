import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { Navigation } from '@/components/navigation'
import { ProfileForm } from '@/components/profile-form'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'

export default async function ProfilePage() {
  const session = await getSession(await headers())
  if (!session?.user) redirect('/sign-in')
  let profile: { name: string; email: string; image: string | null; bio: string | null; favoriteRole: string | null; favoriteMap: string | null } | undefined
  try {
    [profile] = await db.select({ name: user.name, email: user.email, image: user.image, bio: user.bio, favoriteRole: user.favoriteRole, favoriteMap: user.favoriteMap }).from(user).where(eq(user.id, session.user.id)).limit(1)
  } catch {
    const [basicProfile] = await db.select({ name: user.name, email: user.email, image: user.image }).from(user).where(eq(user.id, session.user.id)).limit(1)
    profile = basicProfile ? { ...basicProfile, bio: null, favoriteRole: null, favoriteMap: null } : undefined
  }
  if (!profile) redirect('/sign-in')
  return <><Navigation userName={profile.name} /><main id="main-content" tabIndex={-1} className="min-h-screen bg-[#080b10] px-5 py-8 text-[#f5f7fa] sm:px-8"><div className="mx-auto max-w-4xl"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5c9bff]">Sua conta</p><h1 className="mt-3 text-3xl font-semibold tracking-tight">Meu perfil</h1><p className="mt-2 text-[#94a0b1]">Personalize como você aparece no Matchlytics.</p><section className="mt-8 rounded-2xl border border-white/10 bg-[#111720] p-6 sm:p-8"><ProfileForm profile={profile} /></section></div></main></>
}
