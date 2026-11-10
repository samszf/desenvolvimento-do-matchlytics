import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getSession } from '@/lib/auth'
import { MatchForm } from '@/components/match-form'

export default async function NewMatchPage() {
  const session = await getSession(await headers())
  if (!session?.user) redirect('/sign-in')
  return <main id="main-content" tabIndex={-1}><MatchForm /></main>
}
