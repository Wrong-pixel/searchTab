# SearchTab

像 macOS 聚焦搜索（Spotlight）一样，在浏览器已打开的标签页之间极速检索和切换。

**⚠️ 声明：本项目所有代码（包括实现、调试、重构、代码审查）均由 AI 大模型自动生成，未经人工 review。如有疑问请直接关闭页面，勿浪费彼此时间。**

## 功能

- `Ctrl+Shift+Space`（macOS：`⌘+Shift+Space`）在任意网页唤起搜索面板
- 搜索已打开标签页的**标题、URL、域名、页面正文**
- 支持中英文混合输入、部分匹配、模糊搜索
- 键盘操作：`↑` `↓` 选择、`Enter` 跳转、`Esc` 关闭
- 自动过滤浏览器内部页面（newtab、设置、扩展管理等），仅索引互联网页面
- 首次安装自动弹出引导说明页

## 技术栈

WXT · React · TypeScript · MiniSearch · MV3

## 开发

```bash
npm install
npm run dev      # 开发模式
npm run build    # 生产构建
npm run zip      # 打包 zip
```

## 加载到浏览器

1. 打开 `chrome://extensions` 或 `edge://extensions`
2. 开启「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择 `output/chrome-mv3` 目录

## 隐私

所有标签页数据仅在本地内存中建立索引，不会上传到任何服务器。关闭标签页后相关索引自动清除。

## License

MIT
