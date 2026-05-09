import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'

function PopupApp() {
  const [shortcut, setShortcut] = useState('')

  useEffect(() => {
    chrome.commands.getAll((commands) => {
      const cmd = commands.find((c) => c.name === 'open-search')

      if (cmd?.shortcut) {
        setShortcut(cmd.shortcut)
      }
    })
  }, [])

  const openShortcuts = () => {
    chrome.tabs.create({ url: 'chrome://extensions/shortcuts' })
  }

  const openOnboarding = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('onboarding.html') })
  }

  return (
    <div className="popup-root">
      <div className="popup-header">
        <img
          className="popup-logo"
          src={chrome.runtime.getURL('icon.png')}
          alt=""
        />
        <span className="popup-name">SearchTab</span>
      </div>

      <div className="popup-body">
        <div className="popup-row">
          <span className="popup-label">快捷键</span>
          <kbd className="popup-kbd">{shortcut || '未设置'}</kbd>
        </div>

        <div className="popup-features">
          <div className="popup-feature">按页面标题搜索</div>
          <div className="popup-feature">按 URL / 域名搜索</div>
          <div className="popup-feature">按页面正文内容搜索</div>
        </div>
      </div>

      <div className="popup-actions">
        <button className="popup-btn primary" onClick={openShortcuts}>
          修改快捷键
        </button>
        <button className="popup-btn" onClick={openOnboarding}>
          关于
        </button>
      </div>
    </div>
  )
}

const root = document.getElementById('app')
if (root) {
  createRoot(root).render(<PopupApp />)
}
