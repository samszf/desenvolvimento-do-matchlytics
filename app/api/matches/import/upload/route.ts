import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({ error: 'O upload de demos foi desativado; processe o arquivo no navegador.' }, { status: 410 })
}
