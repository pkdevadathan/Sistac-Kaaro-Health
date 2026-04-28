/** Join Vite `import.meta.env.BASE_URL` with a site-relative path (handles subpath deploys). */
export function baseRelativeUrl(path: string): string {
  const base = import.meta.env.BASE_URL ?? '/'
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${normalizedBase}${normalizedPath}`
}
