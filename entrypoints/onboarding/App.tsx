import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'

function OnboardingApp() {
  const [shortcut, setShortcut] = useState('')

  useEffect(() => {
    chrome.commands.getAll((commands) => {
      const cmd = commands.find((c) => c.name === 'open-search')

      if (cmd?.shortcut) {
        setShortcut(cmd.shortcut)
      }
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
          <span className="onboard-shortcut-label">当前快捷键</span>
          <kbd className="onboard-shortcut-key">
            {shortcut || 'Ctrl+Shift+Space / ⌘+Shift+Space'}
          </kbd>
        </div>

        <div className="onboard-section">
          <h3>使用方法</h3>
          <p>在任意网页中按下快捷键唤起搜索面板，输入关键词即可在所有已打开的标签页中检索。</p>
          <ul>
            <li><kbd>↑</kbd><kbd>↓</kbd> 上下选择结果</li>
            <li><kbd>Enter</kbd> 跳转到所选标签页</li>
            <li><kbd>Esc</kbd> 关闭搜索面板</li>
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
            页面文本仅在内存中建立本地索引以实现极速搜索，关闭标签页后自动清除。
          </p>
        </div>

        <div className="onboard-section">
          <h3>修改快捷键</h3>
          <p>
            前往{' '}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                chrome.tabs.create({ url: 'chrome://extensions/shortcuts' })
              }}
            >
              浏览器扩展快捷键设置
            </a>{' '}
            找到 SearchTab，即可自定义顺手的快捷键组合。
          </p>
        </div>
      </div>
    </div>
  )
}

const root = document.getElementById('app')
if (root) {
  createRoot(root).render(<OnboardingApp />)
}
