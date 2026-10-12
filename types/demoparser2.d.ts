declare module 'demoparser2/demoparser2.js' {
  const init: (input?: RequestInfo | URL | BufferSource) => Promise<unknown>
  export default init
  export function parseHeader(file: Uint8Array): Record<string, unknown>
  export function parseEvent(file: Uint8Array, event: string, wantedPlayerProps?: string[], wantedOtherProps?: string[]): unknown
}
