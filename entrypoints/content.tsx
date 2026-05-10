import { extractPageText } from '@/src/content/extractPageText'
import { mountSpotlight } from '@/src/content/mountSpotlight'
import type { RuntimeMessage } from '@/src/shared/messages'
import '@/src/styles/spotlight.css'

const STORAGE_KEY = 'pageContentSearchEnabled'

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
        if (!isExtensionAlive()) return

        chrome.storage.local.get(STORAGE_KEY, (result) => {
          if (!isExtensionAlive()) return
          if (result[STORAGE_KEY] === false) return
          sendPageText()
        })
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
  if (!isExtensionAlive()) return

  chrome.storage.local.get(STORAGE_KEY, (result) => {
    if (!isExtensionAlive()) return
    if (result[STORAGE_KEY] === false) return

    const idleCallback = globalThis.requestIdleCallback

    if (idleCallback) {
      idleCallback(sendPageText, { timeout: 3000 })
      return
    }

    globalThis.setTimeout(sendPageText, 800)
  })
}

function sendPageText() {
  if (!isExtensionAlive()) return

  const text = extractPageText()

  chrome.runtime.sendMessage({
    type: 'PAGE_TEXT_EXTRACTED',
    text,
  } satisfies RuntimeMessage)
}
