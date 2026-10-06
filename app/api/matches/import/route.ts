import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({ error: 'A análise de demos agora acontece diretamente no navegador.' }, { status: 410 })
}
