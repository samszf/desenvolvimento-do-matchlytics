import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import MapsPage from '@/components/maps-page'

export default async function MapsRoute() {
  const session = await getSession(await headers())
  if (!session?.user) redirect('/sign-in')
  return <MapsPage />
}
