# 开发辅助脚本：彻底清理多宝记账的 dev 进程树（electron.exe + 项目相关 node.exe）
# 用法（项目根目录）：powershell -ExecutionPolicy Bypass -File scripts/dev-restart.ps1
$ErrorActionPreference = 'SilentlyContinue'

$killed = @()

# 1) 本项目的 Electron 进程
Get-Process -Name electron -ErrorAction SilentlyContinue | ForEach-Object {
  Stop-Process -Id $_.Id -Force
  $killed += "electron.exe (PID $($_.Id))"
}

# 2) 本项目相关的 node 进程（electron-vite 开发服务器等）
Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
  Where-Object { $_.CommandLine -match 'pika-ledger|electron-vite' } |
  ForEach-Object {
    Stop-Process -Id $_.ProcessId -Force
    $killed += "node.exe (PID $($_.ProcessId))"
  }

if ($killed.Count -eq 0) { Write-Output '没有找到残留进程' } else { $killed | ForEach-Object { Write-Output "已清理: $_" } }
