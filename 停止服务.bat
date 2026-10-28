@echo off
chcp 65001 >nul
title 智学图谱 - 停止服务

echo 正在停止所有 node 服务进程...
taskkill /im node.exe /f 2>nul
echo.
echo 服务已停止。
pause