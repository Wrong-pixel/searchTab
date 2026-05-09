import { extractPageText } from '@/src/content/extractPageText'
import { mountSpotlight } from '@/src/content/mountSpotlight'
import type { RuntimeMessage } from '@/src/shared/messages'
import '@/src/styles/spotlight.css'

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    if (!isExtensionAlive()) return

    chrome.runtime.onMessage.addListener((message: RuntimeMessage) => {
      if (message.type === 'OPEN_SPOTLIGHT') {
        if (!isExtensionAlive()) return

        mountSpotlight()
        return
      }

      if (message.type === 'REQUEST_PAGE_TEXT') {
        sendPageText()
        return
      }

      return
    })

    schedulePageTextExtraction()
  },
})

function isExtensionAlive() {
  try {
    return !!chrome.runtime.id
  } catch {
    return false
  }
}

function schedulePageTextExtraction() {
  const idleCallback = globalThis.requestIdleCallback

  if (idleCallback) {
    idleCallback(sendPageText, { timeout: 3000 })
    return
  }

  globalThis.setTimeout(sendPageText, 800)
}

function sendPageText() {
  if (!isExtensionAlive()) return

  const text = extractPageText()

  chrome.runtime.sendMessage({
    type: 'PAGE_TEXT_EXTRACTED',
    text,
  } satisfies RuntimeMessage)
}
