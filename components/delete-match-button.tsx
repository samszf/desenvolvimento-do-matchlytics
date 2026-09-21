'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function DeleteMatchButton({ matchId }: { matchId: string }) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    if (!window.confirm('Excluir esta partida? Esta ação não pode ser desfeita.')) return
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/matches/${matchId}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Falha ao excluir a partida')
      router.push('/matches')
      router.refresh()
    } catch {
      window.alert('Não foi possível excluir a partida. Tente novamente.')
      setIsDeleting(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      className="inline-flex items-center gap-2 rounded-xl border border-[#ff8f8f]/30 px-4 py-2 text-sm font-semibold text-[#ff9d9d] transition hover:border-[#ff8f8f] hover:bg-[#ff8f8f]/10 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Trash2 className="size-4" />
      {isDeleting ? 'Excluindo...' : 'Excluir partida'}
    </button>
  )
}

export default DeleteMatchButton
