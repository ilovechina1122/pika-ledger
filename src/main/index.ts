import { app, shell, BrowserWindow, Menu, type MenuItemConstructorOptions } from 'electron'
import { join } from 'path'
import { initDb, closeDb } from './db/connection'
import { registerAllIpcHandlers } from './ipc'

const isDev = !app.isPackaged

// 统一数据目录：开发版与安装版使用同一位置（避免数据分裂），
// 固定在英文路径（AppData/pika-ledger），与项目文件夹无关；
// 可用 PIKA_DATA_DIR 环境变量覆盖（用于隔离测试，如验证全新安装流程）
app.setPath(
  'userData',
  process.env.PIKA_DATA_DIR || join(app.getPath('appData'), 'pika-ledger')
)

// 单实例锁：防止同时开两个窗口写坏数据
const gotLock = app.requestSingleInstanceLock()

if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const win = BrowserWindow.getAllWindows()[0]
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })

  app.whenReady().then(async () => {
    // 简单的中文菜单（保留复制/粘贴等常用快捷键）
    const template: MenuItemConstructorOptions[] = [
      {
        label: '编辑',
        submenu: [
          { role: 'undo', label: '撤销' },
          { role: 'redo', label: '重做' },
          { type: 'separator' },
          { role: 'cut', label: '剪切' },
          { role: 'copy', label: '复制' },
          { role: 'paste', label: '粘贴' },
          { role: 'selectAll', label: '全选' }
        ]
      },
      {
        label: '视图',
        submenu: [
          { role: 'reload', label: '重新加载' },
          { role: 'toggleDevTools', label: '开发者工具' }
        ]
      }
    ]
    Menu.setApplicationMenu(Menu.buildFromTemplate(template))

    await initDb()
    registerAllIpcHandlers()
    createWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  app.on('before-quit', () => {
    closeDb()
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1080,
    height: 720,
    minWidth: 940,
    minHeight: 640,
    show: false,
    backgroundColor: '#FFF8EA',
    autoHideMenuBar: true,
    title: '多宝记账',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  // 页面里的链接统一交给系统浏览器打开
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // 等界面渲染好再显示，避免白屏闪烁
  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}
