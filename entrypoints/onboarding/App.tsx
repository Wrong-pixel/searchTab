import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'

function OnboardingApp() {
  const [shortcut, setShortcut] = useState('')

  useEffect(() => {
    chrome.commands.getAll((commands) => {
      const cmd = commands.find((c) => c.name === 'open-search')
      if (cmd?.shortcut) setShortcut(cmd.shortcut)
    })
  }, [])

  return (
    <div className="onboard-root">
      <div className="onboard-card">
        <img
          className="onboard-logo"
          src={chrome.runtime.getURL('icon.png')}
          alt=""
        />

        <h1 className="onboard-title">SearchTab</h1>
        <p className="onboard-subtitle">
          像 macOS 聚焦搜索一样，在标签页之间极速检索和切换。
        </p>

        <div className="onboard-shortcut">
          <span className="onboard-shortcut-label">快捷键</span>
          <kbd className="onboard-shortcut-key">
            {shortcut || 'Ctrl+Shift+Space / ⌘+Shift+Space'}
          </kbd>
        </div>

        <div className="onboard-cols">
          <div className="onboard-section">
            <h3>使用方法</h3>
            <p>在任意网页中按下快捷键唤起搜索面板，输入关键词即可在所有标签页中检索。</p>
            <ul>
              <li><kbd>↑</kbd><kbd>↓</kbd> 选择</li>
              <li><kbd>Enter</kbd> 跳转</li>
              <li><kbd>Esc</kbd> 关闭</li>
            </ul>
          </div>

          <div className="onboard-section">
            <h3>检索能力</h3>
            <div className="onboard-grid">
              <div className="onboard-chip">页面标题</div>
              <div className="onboard-chip">URL / 域名</div>
              <div className="onboard-chip">页面正文</div>
              <div className="onboard-chip">中英文混合</div>
              <div className="onboard-chip">部分匹配</div>
              <div className="onboard-chip">模糊搜索</div>
            </div>
          </div>

          <div className="onboard-section">
            <h3>隐私说明</h3>
            <p className="onboard-privacy">
              所有标签页数据均保存在本地设备，不会上传到任何服务器。
              页面文本仅在内存中建立本地索引，关闭标签页后自动清除。
            </p>
          </div>
        </div>

        <div className="onboard-footer">
          <a
            href="https://github.com/Wrong-pixel/searchTab"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          <span className="onboard-footer-sep">·</span>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') })
            }}
          >
            设置
          </a>
        </div>
      </div>
    </div>
  )
}

const root = document.getElementById('app')
if (root) {
  createRoot(root).render(<OnboardingApp />)
}
