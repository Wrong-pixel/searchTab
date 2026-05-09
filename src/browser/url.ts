export function safeHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

export function canInjectIntoUrl(url?: string) {
  if (!url) return false

  return /^(https?|file):/.test(url)
}

export function isWebUrl(url?: string) {
  if (!url) return false

  return /^https?:\/\//.test(url)
}
