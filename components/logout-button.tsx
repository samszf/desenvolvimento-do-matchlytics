'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { signOut } from '@/lib/auth-client'

export function LogoutButton() {
  const router = useRouter()

  async function handleSignOut() {
    await signOut()
    router.push('/sign-in')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-[#c9d0dc] transition hover:border-white/20 hover:text-white"
    >
      <LogOut className="size-4" />
      Sair
    </button>
  )
}
