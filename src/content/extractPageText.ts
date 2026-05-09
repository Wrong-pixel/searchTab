const MAX_TEXT_LENGTH = 100_000

export function extractPageText() {
  const source = document.querySelector('main, article') || document.body
  const text = source?.textContent || ''

  return text.replace(/\s+/g, ' ').trim().slice(0, MAX_TEXT_LENGTH)
}
