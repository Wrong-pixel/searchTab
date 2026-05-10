import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'

const STORAGE_KEY = 'pageContentSearchEnabled'

type ShortcutEntry = {
  name: string
  label: string
  shortcut: string
}

function OptionsApp() {
  const [shortcuts, setShortcuts] = useState<ShortcutEntry[]>([])
  const [enabled, setEnabled] = useState(true)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    chrome.commands.getAll((commands) => {
      const list: ShortcutEntry[] = [
        { name: 'open-search', label: '唤起标签页搜索', shortcut: '' },
        { name: 'previous-tab', label: '切换到上一个标签页', shortcut: '' },
        { name: 'next-tab', label: '切换到下一个标签页', shortcut: '' },
      ]

      for (const item of list) {
        const cmd = commands.find((c) => c.name === item.name)
        if (cmd?.shortcut) item.shortcut = cmd.shortcut
      }

      setShortcuts(list)
    })

    chrome.storage.local.get(STORAGE_KEY, (result) => {
      if (result && result[STORAGE_KEY] !== undefined) {
        setEnabled(!!result[STORAGE_KEY])
      }
      setLoaded(true)
    })
  }, [])

  const toggle = () => {
    const next = !enabled
    setEnabled(next)
    chrome.storage.local.set({ [STORAGE_KEY]: next })
  }

  const editShortcut = () => {
    chrome.tabs.create({ url: 'chrome://extensions/shortcuts' })
  }

  if (!loaded) return null

  return (
    <div className="opt-root">
      <div className="opt-card">
        <h1 className="opt-title">设置</h1>

        <div className="opt-section">
          <h2 className="opt-section-title">快捷键</h2>
          <p className="opt-section-note">
            Chrome 浏览器不开放程序化修改快捷键的能力，修改需跳转至浏览器快捷键管理页（此页面由浏览器提供，所有扩展均如此）。
          </p>

          <div className="opt-shortcut-list">
            {shortcuts.map((item) => (
              <div className="opt-shortcut-row" key={item.name}>
                <span className="opt-shortcut-label">{item.label}</span>
                <kbd className="opt-shortcut-key">{item.shortcut || '未设置'}</kbd>
                <button className="opt-edit-btn" onClick={editShortcut}>
                  修改
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="opt-section">
          <h2 className="opt-section-title">搜索设置</h2>

          <div className="opt-item">
            <div className="opt-label">
              <span className="opt-name">页面正文搜索</span>
              <span className="opt-desc">
                开启后可以搜索网页正文内容。关闭后仅搜索标题、URL 和域名。
              </span>
            </div>

            <button
              className={enabled ? 'opt-toggle on' : 'opt-toggle'}
              onClick={toggle}
              role="switch"
              aria-checked={enabled}
            >
              <span className="opt-toggle-knob" />
            </button>
          </div>
        </div>

        <p className="opt-hint">修改后立即生效。</p>
      </div>
    </div>
  )
}

const root = document.getElementById('app')
if (root) {
  createRoot(root).render(<OptionsApp />)
}
