// 生成 APP 图标：在 Electron 离屏窗口里渲染狗狗 SVG，截图为 build/icon.png（1024×1024）
// 用法: npx electron scripts/make-icon.js
const { app, BrowserWindow } = require('electron')
const fs = require('fs')
const path = require('path')

// 强制 1:1 设备缩放，保证截图尺寸精确为 1024×1024
app.commandLine.appendSwitch('force-device-scale-factor', '1')

// 小土狗头像插画（暖黄圆角底 + 奶油色狗脸）
const SVG = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" rx="232" fill="#F6C445"/>
  <path d="M236 388 Q200 170 320 150 Q400 138 430 260 Q352 292 236 388 Z" fill="#9C6B3F"/>
  <path d="M788 388 Q824 170 704 150 Q624 138 594 260 Q672 292 788 388 Z" fill="#9C6B3F"/>
  <ellipse cx="512" cy="590" rx="330" ry="290" fill="#FDF1DC"/>
  <ellipse cx="330" cy="620" rx="52" ry="34" fill="#F2A8A0" opacity="0.65"/>
  <ellipse cx="694" cy="620" rx="52" ry="34" fill="#F2A8A0" opacity="0.65"/>
  <ellipse cx="400" cy="520" rx="30" ry="38" fill="#3D2E1E"/>
  <ellipse cx="624" cy="520" rx="30" ry="38" fill="#3D2E1E"/>
  <circle cx="412" cy="506" r="10" fill="#FFFFFF"/>
  <circle cx="636" cy="506" r="10" fill="#FFFFFF"/>
  <ellipse cx="512" cy="660" rx="130" ry="100" fill="#FFF7E8"/>
  <ellipse cx="512" cy="620" rx="42" ry="32" fill="#5B3A1E"/>
  <ellipse cx="524" cy="612" rx="12" ry="8" fill="#8A6242" opacity="0.7"/>
  <path d="M512 652 Q512 690 468 706 M512 652 Q512 690 556 706" stroke="#3D2E1E" stroke-width="14" fill="none" stroke-linecap="round"/>
  <path d="M486 706 Q512 768 538 706 Q512 722 486 706 Z" fill="#F2788F"/>
  <path d="M512 300 Q480 220 520 190 Q548 230 522 306 Z" fill="#9C6B3F"/>
</svg>`

const delay = (ms) => new Promise((r) => setTimeout(r, ms))

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1024,
    height: 1024,
    show: false,
    webPreferences: { offscreen: true }
  })
  await win.loadURL(
    `data:text/html;charset=utf-8,${encodeURIComponent(
      `<!doctype html><html><body style="margin:0;overflow:hidden">${SVG}</body></html>`
    )}`
  )
  await delay(800)
  const image = await win.webContents.capturePage({ x: 0, y: 0, width: 1024, height: 1024 })
  const png = image.toPNG()
  const outDir = path.join(__dirname, '..', 'build')
  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(path.join(outDir, 'icon.png'), png)
  console.log('✅ icon.png 已生成（', png.length, 'bytes）')
  app.exit(0)
})
