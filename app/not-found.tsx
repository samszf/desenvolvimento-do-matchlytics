import Link from 'next/link'

export default function NotFound() {
  return (
    <main id="main-content" tabIndex={-1} className="flex min-h-screen items-center justify-center bg-[#080b10] px-5 text-center text-[#f5f7fa]">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#7fb0ff]">404</p>
        <h1 className="mt-3 text-3xl font-semibold">Página não encontrada</h1>
        <p className="mt-3 text-[#8995a5]">O endereço acessado não existe.</p>
        <Link href="/dashboard" className="mt-6 inline-flex rounded-xl bg-[#1d6cff] px-4 py-3 text-sm font-semibold hover:bg-[#3b82ff]">Voltar ao dashboard</Link>
      </div>
    </main>
  )
}
