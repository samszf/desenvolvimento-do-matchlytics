export const DEMO_PATH_PATTERN = /^demos\/([^/]+)\/([^/]+\.dem)$/i

export function getDemoOwner(pathname: string) {
  return DEMO_PATH_PATTERN.exec(pathname)?.[1] ?? null
}
