import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { SearchResult } from '@/src/search/types'
import type { RuntimeMessage, SearchTabsResponse } from '@/src/shared/messages'

type SpotlightProps = {
  onClose: () => void
}

export function Spotlight({ onClose }: SpotlightProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [erroredIcons, setErroredIcons] = useState<Set<string>>(new Set())
  const inputRef = useRef<HTMLInputElement>(null)
  const composingRef = useRef(false)
  const ignoreNextEnterRef = useRef(false)
  const normalizedResults = useMemo(() => results.slice(0, 12), [results])
  const fallbackIcon = useMemo(() => {
    try {
      return chrome.runtime.getURL('icon.png')
    } catch {
      return ''
    }
  }, [])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const prevOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'

    return () => {
      document.documentElement.style.overflow = prevOverflow
    }
  }, [])

  const close = useCallback(() => {
    onClose()
  }, [onClose])

  useEffect(() => {
    let cancelled = false
    const timer = window.setTimeout(async () => {
      const response = (await chrome.runtime.sendMessage({
        type: 'SEARCH_TABS',
        query,
      } satisfies RuntimeMessage)) as SearchTabsResponse

      if (!cancelled) {
        setResults(response.results || [])
        setSelectedIndex(0)
      }
    }, query ? 35 : 0)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [query])

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (event.target instanceof Element && event.target.classList.contains('st-backdrop')) {
        close()
      }
    }

    function onDocumentKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return

      if (composingRef.current) return

      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      close()
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onDocumentKeyDown, true)

    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onDocumentKeyDown, true)
    }
  }, [close])

  function activate(result: SearchResult) {
    close()

    queueMicrotask(() => {
      chrome.runtime.sendMessage({
        type: 'ACTIVATE_TAB',
        tabId: result.tabId,
        windowId: result.windowId,
      } satisfies RuntimeMessage)
    })
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing || composingRef.current) return

    if (ignoreNextEnterRef.current && event.key === 'Enter') {
      ignoreNextEnterRef.current = false
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setSelectedIndex((index) => Math.min(index + 1, normalizedResults.length - 1))
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setSelectedIndex((index) => Math.max(index - 1, 0))
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      const selected = normalizedResults[selectedIndex]
      if (selected) activate(selected)
    }
  }

  function onCompositionStart() {
    composingRef.current = true
  }

  function onCompositionEnd() {
    composingRef.current = false
    ignoreNextEnterRef.current = true
    setTimeout(() => {
      ignoreNextEnterRef.current = false
    }, 0)
  }

  function resolveFavicon(result: SearchResult) {
    const key = `${result.windowId}-${result.tabId}`

    if (!result.favIconUrl || erroredIcons.has(key)) {
      return fallbackIcon
    }

    return result.favIconUrl
  }

  function handleFaviconError(result: SearchResult) {
    const key = `${result.windowId}-${result.tabId}`

    setErroredIcons((prev) => {
      if (prev.has(key)) return prev

      const next = new Set(prev)
      next.add(key)
      return next
    })
  }

  return (
    <div className="st-backdrop">
      <section className="st-panel" role="dialog" aria-label="Search opened tabs">
        <div className="st-search-row">
          <div className="st-search-icon">
            <img className="st-search-logo" src={fallbackIcon} alt="" />
          </div>
          <input
            ref={inputRef}
            className="st-input"
            value={query}
            placeholder="搜索已打开的标签页..."
            spellCheck={false}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            onCompositionStart={onCompositionStart}
            onCompositionEnd={onCompositionEnd}
          />
          <kbd className="st-esc">ESC</kbd>
        </div>

        <div className="st-results">
          {normalizedResults.map((result, index) => (
            <button
              key={`${result.windowId}-${result.tabId}`}
              className={index === selectedIndex ? 'st-item active' : 'st-item'}
              onMouseEnter={() => setSelectedIndex(index)}
              onMouseDown={(event) => {
                event.preventDefault()
                activate(result)
              }}
            >
              <span className="st-favicon-wrap">
                <img
                  className="st-favicon"
                  src={resolveFavicon(result)}
                  alt=""
                  onError={() => handleFaviconError(result)}
                />
              </span>

              <span className="st-main">
                <span className="st-title">{result.title || result.hostname || '未命名'}</span>
                <span className="st-url">{formatUrl(result.url)}</span>
              </span>

              <span className="st-return">↵</span>
            </button>
          ))}

          {!normalizedResults.length && (
            <div className="st-empty">
              <span>没有找到匹配的标签页</span>
              <small>试试搜索标题、域名、URL 或页面正文内容</small>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function formatUrl(url: string) {
  try {
    const parsed = new URL(url)
    return `${parsed.hostname.replace(/^www\./, '')}${parsed.pathname === '/' ? '' : parsed.pathname}`
  } catch {
    return url
  }
}
