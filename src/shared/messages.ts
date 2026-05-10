import type { SearchResult } from '@/src/search/types'

export type RuntimeMessage =
  | { type: 'OPEN_SPOTLIGHT' }
  | { type: 'REQUEST_PAGE_TEXT' }
  | { type: 'SEARCH_TABS'; query: string }
  | { type: 'ACTIVATE_TAB'; tabId: number; windowId: number }
  | { type: 'CLOSE_TAB'; tabId: number }
  | { type: 'PAGE_TEXT_EXTRACTED'; text: string }

export type SearchTabsResponse = {
  results: SearchResult[]
}
