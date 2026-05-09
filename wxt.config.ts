import { defineConfig } from 'wxt'
import react from '@vitejs/plugin-react'

export default defineConfig({
  outDir: 'output',
  vite: () => ({
    plugins: [react()],
  }),
  manifest: {
    name: 'SearchTab',
    description: 'Spotlight-like fast search for opened browser tabs.',
    version: '0.1.0',
    permissions: ['tabs', 'storage', 'scripting'],
    host_permissions: ['<all_urls>'],
    web_accessible_resources: [
      {
        resources: ['icon.png'],
        matches: ['<all_urls>'],
      },
    ],
    icons: {
      16: 'icon.png',
      32: 'icon.png',
      48: 'icon.png',
      128: 'icon.png',
    },
    action: {
      default_popup: 'popup.html',
      default_title: 'SearchTab',
    },
    commands: {
      'open-search': {
        suggested_key: {
          default: 'Ctrl+Shift+Space',
          mac: 'Command+Shift+Space',
        },
        description: '打开标签页搜索',
      },
    },
  },
})
