$base = "C:\Users\zh\智学图谱"

# 启动后端
$si1 = New-Object System.Diagnostics.ProcessStartInfo
$si1.FileName = "node"
$si1.Arguments = "src/server.js"
$si1.WorkingDirectory = "$base\server"
$si1.UseShellExecute = $true
$si1.WindowStyle = "Minimized"
[System.Diagnostics.Process]::Start($si1) | Out-Null
Write-Output "后端已启动，等待 6 秒..."
Start-Sleep -Seconds 6

# 启动前端
$si2 = New-Object System.Diagnostics.ProcessStartInfo
$si2.FileName = "node"
$si2.Arguments = "node_modules\vite\bin\vite.js"
$si2.WorkingDirectory = $base
$si2.UseShellExecute = $true
$si2.WindowStyle = "Minimized"
[System.Diagnostics.Process]::Start($si2) | Out-Null
Write-Output "前端已启动，等待 8 秒..."
Start-Sleep -Seconds 8

# 用 netstat 检查端口
Write-Output "`n=== netstat 检查 ==="
$ns = netstat -ano | Select-String ":3000\s.*LISTEN", ":5173\s.*LISTEN"
foreach ($line in $ns) { Write-Output $line.ToString().Trim() }

# 用 Test-NetConnection 检查
Write-Output "`n=== 端口连接测试 ==="
$t3000 = (Test-NetConnection -ComputerName 127.0.0.1 -Port 3000 -WarningAction SilentlyContinue).TcpTestSucceeded
$t5173 = (Test-NetConnection -ComputerName 127.0.0.1 -Port 5173 -WarningAction SilentlyContinue).TcpTestSucceeded
Write-Output "后端 3000: $t3000"
Write-Output "前端 5173: $t5173"

# 检查 node 进程
$nodes = Get-Process node -ErrorAction SilentlyContinue
Write-Output "`nNode 进程数: $($nodes.Count)"