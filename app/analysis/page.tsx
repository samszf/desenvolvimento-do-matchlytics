import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import AnalysisPage from '@/components/analysis-page'

export default async function AnalysisRoute() {
  const session = await getSession(await headers())
  if (!session?.user) redirect('/sign-in')
  return <AnalysisPage />
}
