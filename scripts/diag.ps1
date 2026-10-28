$base = "C:\Users\zh\智学图谱"
$logOut = "$base\scripts\diag-out.log"
$logErr = "$base\scripts\diag-err.log"
if (Test-Path $logOut) { Remove-Item $logOut -Force }
if (Test-Path $logErr) { Remove-Item $logErr -Force }

$proc = Start-Process -FilePath "node" -ArgumentList "src/server.js" -WorkingDirectory "$base\server" -RedirectStandardOutput $logOut -RedirectStandardError $logErr -PassThru
Start-Sleep -Seconds 8

Write-Output "进程存活: $(-not $proc.HasExited)"
Write-Output "PID: $($proc.Id)"
if ($proc.HasExited) { Write-Output "ExitCode: $($proc.ExitCode)" }

Write-Output "`n=== stdout ==="
if (Test-Path $logOut) { Get-Content $logOut -ErrorAction SilentlyContinue }
Write-Output "`n=== stderr ==="
if (Test-Path $logErr) { Get-Content $logErr -ErrorAction SilentlyContinue }

$b = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
Write-Output "`n后端 3000 监听: $($b.Count -gt 0)"

if (-not $proc.HasExited) { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue }