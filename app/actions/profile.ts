'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'

export async function updateProfile(input: { name: string; bio: string; favoriteRole: string; favoriteMap: string; image?: string }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Não autenticado')
  const name = input.name.trim()
  if (name.length < 2 || name.length > 60) throw new Error('O nome deve ter entre 2 e 60 caracteres.')
  await db.update(user).set({ name, bio: input.bio.trim().slice(0, 240), favoriteRole: input.favoriteRole.trim().slice(0, 40), favoriteMap: input.favoriteMap.trim().slice(0, 60), ...(input.image ? { image: input.image } : {}), updatedAt: new Date() }).where(eq(user.id, session.user.id))
  revalidatePath('/profile')
  revalidatePath('/dashboard')
  return { success: true }
}
