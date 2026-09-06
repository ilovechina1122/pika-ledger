// 生成 APP 图标：在 Electron 离屏窗口里渲染狗狗 SVG，截图为 build/icon.png（1024×1024）
// 用法: npx electron scripts/make-icon.js
const { app, BrowserWindow } = require('electron')
const fs = require('fs')
const path = require('path')

// 强制 1:1 设备缩放，保证截图尺寸精确为 1024×1024
app.commandLine.appendSwitch('force-device-scale-factor', '1')

// 三色边牧头像插画（米白圆角底 + 黑脸 + 白鼻梁 + 棕眉点，一耳立一耳折）
const SVG = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" rx="232" fill="#FAF7F0"/>
  <path d="M268 360 L232 120 L392 210 Z" fill="#2B2724"/>
  <path d="M756 330 Q820 150 690 160 Q640 190 652 280 Q690 330 756 330 Z" fill="#2B2724"/>
  <ellipse cx="512" cy="560" rx="300" ry="270" fill="#2B2724"/>
  <path d="M476 310 Q488 430 496 585 L528 585 Q536 430 548 310 Q512 282 476 310 Z" fill="#FFFFFF"/>
  <ellipse cx="402" cy="426" rx="36" ry="24" fill="#C8863A"/>
  <ellipse cx="622" cy="426" rx="36" ry="24" fill="#C8863A"/>
  <ellipse cx="402" cy="502" rx="50" ry="38" fill="#FFFFFF"/>
  <ellipse cx="622" cy="502" rx="50" ry="38" fill="#FFFFFF"/>
  <circle cx="402" cy="502" r="19" fill="#2B2724"/>
  <circle cx="622" cy="502" r="19" fill="#2B2724"/>
  <circle cx="409" cy="495" r="7" fill="#FFFFFF"/>
  <circle cx="629" cy="495" r="7" fill="#FFFFFF"/>
  <ellipse cx="512" cy="668" rx="126" ry="92" fill="#FFFFFF"/>
  <ellipse cx="512" cy="618" rx="34" ry="26" fill="#2B2724"/>
  <ellipse cx="520" cy="611" rx="10" ry="7" fill="#6E6257"/>
  <path d="M512 644 Q512 682 470 696 M512 644 Q512 682 554 696" stroke="#2B2724" stroke-width="12" fill="none" stroke-linecap="round"/>
  <path d="M488 696 Q512 754 536 696 Q512 710 488 696 Z" fill="#E58A9A"/>
  <path d="M398 800 Q512 858 626 800 Q512 816 398 800 Z" fill="#FFFFFF"/>
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
