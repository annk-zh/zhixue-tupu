$base = "C:\Users\zh\智学图谱"
$si1 = New-Object System.Diagnostics.ProcessStartInfo
$si1.FileName = "node"
$si1.Arguments = "src/server.js"
$si1.WorkingDirectory = "$base\server"
$si1.UseShellExecute = $true
$si1.WindowStyle = "Minimized"
[System.Diagnostics.Process]::Start($si1) | Out-Null
Start-Sleep -Seconds 3
$si2 = New-Object System.Diagnostics.ProcessStartInfo
$si2.FileName = "node"
$si2.Arguments = "node_modules\vite\bin\vite.js"
$si2.WorkingDirectory = $base
$si2.UseShellExecute = $true
$si2.WindowStyle = "Minimized"
[System.Diagnostics.Process]::Start($si2) | Out-Null
Start-Sleep -Seconds 5
$b = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
$f = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue
Write-Output "后端 3000: $($b.Count -gt 0)"
Write-Output "前端 5173: $($f.Count -gt 0)"