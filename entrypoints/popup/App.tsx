import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'

function PopupApp() {
  const [searchShortcut, setSearchShortcut] = useState('')
  const [prevShortcut, setPrevShortcut] = useState('')
  const [nextShortcut, setNextShortcut] = useState('')

  useEffect(() => {
    chrome.commands.getAll((commands) => {
      const find = (name: string) => commands.find((c) => c.name === name)?.shortcut || '未设置'

      setSearchShortcut(find('open-search'))
      setPrevShortcut(find('previous-tab'))
      setNextShortcut(find('next-tab'))
    })
  }, [])

  const openOptions = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('options.html') })
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
        <div className="popup-section">
          <div className="popup-section-title">快捷键</div>
          <div className="popup-row">
            <span className="popup-label">标签页搜索</span>
            <kbd className="popup-kbd">{searchShortcut}</kbd>
          </div>
          <div className="popup-row">
            <span className="popup-label">上一个标签页</span>
            <kbd className="popup-kbd">{prevShortcut}</kbd>
          </div>
          <div className="popup-row">
            <span className="popup-label">下一个标签页</span>
            <kbd className="popup-kbd">{nextShortcut}</kbd>
          </div>
        </div>

        <div className="popup-section">
          <div className="popup-section-title">搜索能力</div>
          <div className="popup-feature">按页面标题搜索</div>
          <div className="popup-feature">按 URL / 域名搜索</div>
          <div className="popup-feature">按页面正文内容搜索</div>
        </div>
      </div>

      <div className="popup-actions">
        <button className="popup-btn primary" onClick={openOptions}>
          设置
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
