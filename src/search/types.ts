export type TabDocument = {
  id: string
  tabId: number
  windowId: number
  title: string
  url: string
  hostname: string
  favIconUrl?: string
  text?: string
  lastAccessedAt: number
  lastIndexedAt: number
}

export type SearchResult = Pick<
  TabDocument,
  'tabId' | 'windowId' | 'title' | 'url' | 'hostname' | 'favIconUrl' | 'lastAccessedAt'
> & {
  score?: number
}
