@echo off
chcp 65001 >nul
title 智学图谱 - 启动服务

echo ============================================
echo   智学图谱 - 启动前后端服务
echo ============================================
echo.

echo [1/2] 启动后端服务 (端口 3000)...
start "智学图谱-后端" cmd /k "cd /d %~dp0server && node src/server.js"

timeout /t 2 /nobreak >nul

echo [2/2] 启动前端服务 (端口 5173)...
start "智学图谱-前端" cmd /k "cd /d %~dp0 && node node_modules\vite\bin\vite.js"

timeout /t 3 /nobreak >nul

echo.
echo ============================================
echo   服务已启动！
echo   前端: http://localhost:5173
echo   后端: http://localhost:3000
echo ============================================
echo.
echo 浏览器打开 http://localhost:5173 即可使用
echo.
echo 关闭服务: 关闭弹出的两个 cmd 窗口
echo.
pause