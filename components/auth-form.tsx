'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2, Target } from 'lucide-react'
import { signIn, signUp } from '@/lib/auth-client'

type AuthFormProps = { mode: 'sign-in' | 'sign-up' }

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const isSignUp = mode === 'sign-up'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setPending(true)
    const data = new FormData(event.currentTarget)
    const email = String(data.get('email') ?? '')
    const password = String(data.get('password') ?? '')
    const name = String(data.get('name') ?? '')

    const result = isSignUp
      ? await signUp.email({ email, password, name })
      : await signIn.email({ email, password })

    setPending(false)
    if (result.error) {
      const errorCode = result.error.code
      if (isSignUp && errorCode === 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL') {
        setError('Este e-mail já está cadastrado. Entre na sua conta ou use outro e-mail.')
      } else if (!isSignUp && errorCode === 'INVALID_EMAIL_OR_PASSWORD') {
        setError('E-mail ou senha incorretos. Confira os dados e tente novamente.')
      } else {
        setError('Não foi possível concluir. Verifique os dados e tente novamente.')
      }
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <main id="main-content" tabIndex={-1} className="flex min-h-screen items-center justify-center bg-[#080b10] px-5 py-10 text-[#f5f7fa]">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#111720] p-7 shadow-[0_30px_90px_rgba(0,0,0,0.38)] sm:p-9">
        <a href="/" className="mx-auto flex w-fit items-center gap-3" aria-label="Matchlytics início">
          <span className="flex size-9 items-center justify-center rounded-xl bg-[#1d6cff] shadow-[0_0_28px_rgba(29,108,255,0.35)]"><Target className="size-5" /></span>
          <span className="text-lg font-semibold tracking-[-0.03em]">match<span className="text-[#5c9bff]">lytics</span></span>
        </a>
        <div className="mt-9 text-center"><h1 className="text-3xl font-semibold tracking-[-0.04em]">{isSignUp ? 'Crie sua conta' : 'Bem-vindo de volta'}</h1><p className="mt-3 text-sm leading-6 text-[#8995a5]">{isSignUp ? 'Comece a transformar suas partidas em evolução.' : 'Acompanhe seu desempenho de onde parou.'}</p></div>
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          {isSignUp && <label className="flex flex-col gap-2 text-sm font-medium">Nome <input name="name" required minLength={2} autoComplete="name" className="rounded-xl border border-white/10 bg-[#0c1118] px-4 py-3 outline-none transition focus:border-[#5c9bff]" placeholder="Seu nome" /></label>}
          <label className="flex flex-col gap-2 text-sm font-medium">E-mail <input name="email" required type="email" autoComplete="email" className="rounded-xl border border-white/10 bg-[#0c1118] px-4 py-3 outline-none transition focus:border-[#5c9bff]" placeholder="voce@email.com" /></label>
          <label className="flex flex-col gap-2 text-sm font-medium">Senha <input name="password" required type="password" minLength={8} autoComplete={isSignUp ? 'new-password' : 'current-password'} className="rounded-xl border border-white/10 bg-[#0c1118] px-4 py-3 outline-none transition focus:border-[#5c9bff]" placeholder="Mínimo de 8 caracteres" /></label>
          {error && <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p>}
          <button disabled={pending} className="mt-2 flex items-center justify-center rounded-xl bg-[#1d6cff] px-5 py-3.5 text-sm font-semibold transition hover:bg-[#3b82ff] disabled:cursor-not-allowed disabled:opacity-60">{pending ? <Loader2 className="size-4 animate-spin" aria-label="Carregando" /> : <>{isSignUp ? 'Criar conta' : 'Entrar'} <ArrowRight className="ml-2 inline size-4" /></>}</button>
        </form>
        <p className="mt-7 text-center text-sm text-[#8995a5]">{isSignUp ? 'Já tem uma conta?' : 'Ainda não tem uma conta?'} <a className="font-semibold text-[#7fb0ff] hover:text-white" href={isSignUp ? '/sign-in' : '/sign-up'}>{isSignUp ? 'Entrar' : 'Criar conta'}</a></p>
      </div>
    </main>
  )
}
