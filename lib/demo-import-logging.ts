export type DemoImportStage =
  | 'AUTHENTICATION'
  | 'VALIDATE_UPLOAD'
  | 'VALIDATE_PATHNAME'
  | 'BLOB_HEAD'
  | 'BLOB_READ'
  | 'DEMO_PARSE'
  | 'PLAYER_EXTRACTION'
  | 'CLEANUP'
  | 'UPLOAD_AUTHORIZATION'

function getRootError(error: unknown): unknown {
  if (error && typeof error === 'object' && 'cause' in error) {
    return (error as { cause?: unknown }).cause ?? error
  }
  return error
}

function getStringProperty(value: unknown, property: string): string | undefined {
  if (!value || typeof value !== 'object' || !(property in value)) return undefined
  const result = (value as Record<string, unknown>)[property]
  return typeof result === 'string' ? result : undefined
}

export function sanitizeTechnicalMessage(message: string, pathname?: string) {
  let sanitized = message
    .replace(/Bearer\s+[^\s,;]+/gi, 'Bearer [REDACTED]')
    .replace(/(token|password|secret|authorization)\s*[:=]\s*[^\s,;]+/gi, '$1=[REDACTED]')
    .replace(/https?:\/\/[^\s"'<>]+/gi, '[URL]')
    .replace(/demos\/[^\s"'<>]+/gi, '[pathname]')
    .replace(/\/(?:var|tmp|home|workspace|vercel)\/[^\s"'<>]+/gi, '[caminho]')
    .replace(/[\r\n\t]+/g, ' ')
    .trim()

  if (pathname) sanitized = sanitized.split(pathname).join('[pathname]')
  return sanitized.slice(0, 300)
}

export function logDemoImportStage({
  requestId,
  stage,
  result,
  startedAt,
  error,
  pathname,
  details,
}: {
  requestId: string
  stage: DemoImportStage
  result: 'success' | 'failure'
  startedAt: number
  error?: unknown
  pathname?: string
  details?: Record<string, string | number | boolean | null>
}) {
  const event: Record<string, unknown> = {
    requestId,
    stage,
    result,
    durationMs: Math.max(0, Date.now() - startedAt),
    ...details,
  }

  if (error !== undefined) {
    const rootError = getRootError(error)
    const errorName = getStringProperty(rootError, 'name')
    const errorMessage = getStringProperty(rootError, 'message')
    event.errorName = errorName ?? (rootError instanceof Error ? rootError.name : 'NonErrorThrown')
    event.errorClass = rootError instanceof Error ? rootError.constructor.name : typeof rootError
    if (errorMessage) event.message = sanitizeTechnicalMessage(errorMessage, pathname)
    const parserOperation = getStringProperty(error, 'operation')
    if (parserOperation) event.parserOperation = parserOperation
  }

  console.info(`[demo-import] ${JSON.stringify(event)}`)
}

