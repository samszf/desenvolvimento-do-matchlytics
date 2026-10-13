import Link from 'next/link'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { ArrowLeft, FileUp } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { DemoImportForm } from '@/components/demo-import-form'

export default async function ImportMatchPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')
  return <><Navigation /><main id="main-content" tabIndex={-1} className="min-h-screen bg-[#080b10] text-[#f5f7fa]"><section className="mx-auto max-w-4xl px-5 pb-16 pt-8 lg:px-8"><Link href="/matches" className="inline-flex items-center gap-2 text-sm text-[#8995a5] hover:text-white"><ArrowLeft className="size-4" /> Voltar para partidas</Link><div className="mt-8"><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#7fb0ff]"><FileUp className="size-4" /> Importação automática</p><h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em]">Importar partida</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#8995a5]">Analise uma demo do CS2, selecione seu jogador e revise os dados antes de salvar. A demo não é armazenada no Matchlytics.</p></div><DemoImportForm /></section></main></>
}
