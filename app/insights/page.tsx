import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import InsightsPage from '@/components/insights-page'

export default async function InsightsRoute() {
  const session = await getSession(await headers())
  if (!session?.user) redirect('/sign-in')
  return <InsightsPage />
}
