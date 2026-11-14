'use client'

import type { ImportedMatch, ImportedPlayer, ImportedStats } from './index'
import { normalizeMapName } from '@/lib/maps'

type Parser = { parseHeader: (file: Uint8Array) => Record<string, unknown>; parseEvent: (file: Uint8Array, event: string, players?: string[], other?: string[]) => unknown }
declare global { var wasm_bindgen: ((input?: RequestInfo | URL | BufferSource) => Promise<unknown>) & Parser | undefined }
let parserPromise: Promise<Parser> | null = null

async function loadParser(): Promise<Parser> {
  parserPromise ??= new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-demoparser]')
    const script = existing ?? document.createElement('script')
    const finish = async () => {
      try {
        const wasmResponse = await fetch('/demoparser2_bg.wasm', { cache: 'no-store' })
        if (!wasmResponse.ok) throw new Error(`WASM indisponível (${wasmResponse.status})`)
        const parser = window.wasm_bindgen
        if (!parser) throw new Error('Parser WASM não foi exposto pelo script')
        await parser(await wasmResponse.arrayBuffer())
        if (typeof parser.parseHeader !== 'function' || typeof parser.parseEvent !== 'function') throw new Error('O módulo WASM foi carregado, mas as funções do analisador não estão disponíveis')
        resolve(parser)
      } catch (error) { parserPromise = null; reject(error) }
    }
    if (existing) {
      if (window.wasm_bindgen) finish()
      else existing.addEventListener('load', () => finish(), { once: true })
    } else {
      script.src = '/demoparser2.js'; script.dataset.demoparser = 'true'; script.onload = () => finish(); script.onerror = () => reject(new Error('Falha ao carregar o parser WASM')); document.head.appendChild(script)
    }
  })
  return parserPromise
}
const n = (v: unknown) => { const x = Number(v); return Number.isFinite(x) ? x : null }
const s = (v: unknown) => v == null ? '' : String(v)
const rows = (v: unknown) => Array.isArray(v) ? v.filter((x): x is Record<string, unknown> => !!x && typeof x === 'object') : []
function metrics(raw: { kills:number; deaths:number; assists:number; headshots:number }): ImportedStats { const side = { kills: 0, deaths: 0, assists: 0, headshots: 0, adr: null, kd: 0, hsPercentage: 0 }; return { ...raw, kd: raw.deaths ? raw.kills / raw.deaths : raw.kills || null, hsPercentage: raw.kills ? raw.headshots / raw.kills * 100 : null, adr: null, kast: null, ct: side, tr: { ...side } } }
export async function parseDemoInBrowser(file: File): Promise<ImportedMatch> { const parser = await loadParser(); const bytes = new Uint8Array(await file.arrayBuffer()); const header = parser.parseHeader(bytes); const players = new Map<string, { steamId:string; name:string; team:null; raw:{kills:number;deaths:number;assists:number;headshots:number} }>(); const ensure = (id:unknown,name?:unknown) => { const steamId=s(id); if(!steamId)return; if(!players.has(steamId)) players.set(steamId,{steamId,name:s(name)||'Jogador',team:null,raw:{kills:0,deaths:0,assists:0,headshots:0}}) }; const events=rows(parser.parseEvent(bytes,'player_death',['name','steamid','xuid','assister_steamid','assister_xuid','assister_name','headshot'],['attacker_steamid','attacker_xuid','attacker_name','victim_steamid'])); for(const e of events){const a=e.attacker_steamid??e.attacker_xuid,v=e.steamid??e.xuid??e.victim_steamid,as=e.assister_steamid??e.assister_xuid; ensure(a,e.attacker_name);ensure(v,e.name);ensure(as,e.assister_name);const ap=players.get(s(a)),vp=players.get(s(v)),asp=players.get(s(as));if(ap&&s(a)!==s(v)){ap.raw.kills++;if(e.headshot===true||e.headshot===1)ap.raw.headshots++}if(vp)vp.raw.deaths++;if(asp)asp.raw.assists++} const result:ImportedPlayer[]=Array.from(players.values()).map(({raw,...p})=>({...p,stats:metrics(raw)})); return {map:normalizeMapName(header.map_name??header.map).name,playedAt:null,players:result,stats:result[0]?.stats??metrics({kills:0,deaths:0,assists:0,headshots:0}),source:'demo',warnings:result.length?[]:['Nenhum jogador foi encontrado nos eventos da demo.']} }
export {}
