import MiniSearch from 'minisearch'
import { canInjectIntoUrl, isWebUrl, safeHostname } from '@/src/browser/url'
import type { RuntimeMessage, SearchTabsResponse } from '@/src/shared/messages'
import type { SearchResult, TabDocument } from '@/src/search/types'

const documents = new Map<number, TabDocument>()
const injectedTabs = new Set<number>()
const MAX_RESULTS = 12

function tokenize(text: string): string[] {
  const words = text.split(/[^a-zA-Z0-9\u4e00-\u9fff]+/).filter(Boolean)

  if (text.length > 500) return words

  const ngrams = new Set<string>()
  for (const word of words) {
    for (let len = 3; len <= 5; len++) {
      for (let i = 0; i <= word.length - len; i++) {
        ngrams.add(word.slice(i, i + len))
      }
    }
  }

  return [...words, ...ngrams]
}

const miniSearch = new MiniSearch<TabDocument>({
  fields: ['title', 'url', 'hostname', 'text'],
  storeFields: [
    'tabId',
    'windowId',
    'title',
    'url',
    'hostname',
    'favIconUrl',
    'lastAccessedAt',
  ],
  searchOptions: {
    boost: {
      title: 5,
      hostname: 4,
      url: 3,
      text: 1,
    },
    fuzzy: 0.18,
    prefix: true,
  },
  tokenize,
})

export default defineBackground(() => {
  chrome.runtime.onInstalled.addListener((details) => {
    void rebuildTabsIndex()

    if (details.reason === 'install') {
      chrome.tabs.create({ url: chrome.runtime.getURL('onboarding.html') })
    }
  })

  chrome.runtime.onStartup.addListener(() => {
    void rebuildTabsIndex()
  })

  chrome.tabs.onCreated.addListener((tab) => {
    upsertTab(tab)
  })

  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.title || changeInfo.url || changeInfo.favIconUrl || changeInfo.status === 'complete') {
      upsertTab(tab)
    }

    if (changeInfo.status === 'complete' && canInjectIntoUrl(tab.url)) {
      void chrome.tabs.sendMessage(tabId, { type: 'REQUEST_PAGE_TEXT' }).catch(() => undefined)
    }
  })

  chrome.tabs.onActivated.addListener(async ({ tabId }) => {
    const tab = await chrome.tabs.get(tabId).catch(() => undefined)
    if (!tab) return

    upsertTab(tab, Date.now())
  })

  chrome.tabs.onRemoved.addListener((tabId) => {
    const doc = documents.get(tabId)
    if (!doc) return

    miniSearch.remove(doc)
    documents.delete(tabId)
    injectedTabs.delete(tabId)
  })

  chrome.commands.onCommand.addListener((command) => {
    if (command !== 'open-search') return

    void openSpotlight()
  })

  chrome.runtime.onMessage.addListener((message: RuntimeMessage, sender, sendResponse) => {
    if (message.type === 'SEARCH_TABS') {
      const response: SearchTabsResponse = { results: searchTabs(message.query) }
      sendResponse(response)
      return true
    }

    if (message.type === 'ACTIVATE_TAB') {
      void activateTab(message.tabId, message.windowId)
      return false
    }

    if (message.type === 'PAGE_TEXT_EXTRACTED') {
      const tabId = sender.tab?.id
      if (tabId) updateTabText(tabId, message.text)
      return false
    }

    return false
  })

  void rebuildTabsIndex()
})

async function rebuildTabsIndex() {
  const tabs = await chrome.tabs.query({})
  tabs.forEach((tab) => upsertTab(tab))
}

function upsertTab(tab: chrome.tabs.Tab, lastAccessedAt?: number) {
  if (!tab.id) return

  if (!tab.url || !isWebUrl(tab.url)) {
    const old = documents.get(tab.id)
    if (old) {
      miniSearch.remove(old)
      documents.delete(tab.id)
    }
    return
  }

  const old = documents.get(tab.id)
  if (old) miniSearch.remove(old)

  const doc: TabDocument = {
    id: String(tab.id),
    tabId: tab.id,
    windowId: tab.windowId,
    title: tab.title || '',
    url: tab.url,
    hostname: safeHostname(tab.url),
    favIconUrl: tab.favIconUrl,
    text: old?.text,
    lastAccessedAt: lastAccessedAt ?? old?.lastAccessedAt ?? Date.now(),
    lastIndexedAt: Date.now(),
  }

  documents.set(tab.id, doc)
  miniSearch.add(doc)
}

function updateTabText(tabId: number, text: string) {
  const old = documents.get(tabId)
  if (!old || old.text === text) return

  miniSearch.remove(old)

  const next: TabDocument = {
    ...old,
    text,
    lastIndexedAt: Date.now(),
  }

  documents.set(tabId, next)
  miniSearch.add(next)
}

function searchTabs(query: string): SearchResult[] {
  const trimmed = query.trim()

  if (!trimmed) {
    return Array.from(documents.values())
      .sort((a, b) => b.lastAccessedAt - a.lastAccessedAt)
      .slice(0, MAX_RESULTS)
      .map(toSearchResult)
  }

  const seen = new Set<number>()

  const miniResults = miniSearch
    .search(trimmed)
    .slice(0, MAX_RESULTS)
    .map((result) => {
      const tabId = Number(result.tabId)
      seen.add(tabId)

      return {
        tabId,
        windowId: Number(result.windowId),
        title: String(result.title || ''),
        url: String(result.url || ''),
        hostname: String(result.hostname || ''),
        favIconUrl: typeof result.favIconUrl === 'string' ? result.favIconUrl : undefined,
        lastAccessedAt: Number(result.lastAccessedAt || 0),
        score: result.score,
      }
    })

  const lower = trimmed.toLowerCase()

  const substringResults = Array.from(documents.values())
    .filter(
      (doc) =>
        !seen.has(doc.tabId) &&
        (doc.title.toLowerCase().includes(lower) ||
          doc.url.toLowerCase().includes(lower) ||
          doc.hostname.toLowerCase().includes(lower)),
    )
    .sort((a, b) => b.lastAccessedAt - a.lastAccessedAt)
    .slice(0, MAX_RESULTS - miniResults.length)
    .map(toSearchResult)

  return [...miniResults, ...substringResults].slice(0, MAX_RESULTS)
}

function toSearchResult(doc: TabDocument): SearchResult {
  return {
    tabId: doc.tabId,
    windowId: doc.windowId,
    title: doc.title,
    url: doc.url,
    hostname: doc.hostname,
    favIconUrl: doc.favIconUrl,
    lastAccessedAt: doc.lastAccessedAt,
  }
}

async function openSpotlight() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id) return

  if (canInjectIntoUrl(tab.url)) {
    await chrome.tabs.sendMessage(tab.id, { type: 'OPEN_SPOTLIGHT' }).catch(async () => {
      if (injectedTabs.has(tab.id!)) return
      injectedTabs.add(tab.id!)

      await chrome.scripting.executeScript({
        target: { tabId: tab.id! },
        files: ['/content-scripts/content.js'],
      })

      await chrome.scripting.insertCSS({
        target: { tabId: tab.id! },
        files: ['/content-scripts/content.css'],
      })

      await chrome.tabs.sendMessage(tab.id!, { type: 'OPEN_SPOTLIGHT' })
    })
  }
}

async function activateTab(tabId: number, windowId: number) {
  await chrome.windows.update(windowId, { focused: true })
  await chrome.tabs.update(tabId, { active: true })
}
