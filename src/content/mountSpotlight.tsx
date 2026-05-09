import React from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Spotlight } from '@/src/components/Spotlight'

const ROOT_ID = 'search-tab-spotlight-root'

let container: HTMLDivElement | null = null
let root: Root | null = null
let mounted = false

export function mountSpotlight() {
  if (mounted) return

  const existing = document.getElementById(ROOT_ID)
  if (existing) return

  container = document.createElement('div')
  container.id = ROOT_ID
  document.documentElement.appendChild(container)

  root = createRoot(container)
  mounted = true

  root.render(<Spotlight onClose={unmountSpotlight} />)
}

export function unmountSpotlight() {
  mounted = false

  if (root) {
    root.unmount()
    root = null
  }

  if (container) {
    container.remove()
    container = null
  }
}
