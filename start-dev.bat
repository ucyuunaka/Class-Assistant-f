@echo off
chcp 65001 >nul
title Class-Assistant 开发服务器
mode con cols=100 lines=30
color 0A

:: 设置颜色代码
set "green=[92m"
set "yellow=[93m"
set "blue=[94m"
set "magenta=[95m"
set "cyan=[96m"
set "white=[97m"
set "reset=[0m"

cd /d %~dp0

echo %cyan%=======================================================================%reset%
echo %yellow%                     Class-Assistant 开发环境启动器                    %reset%
echo %cyan%=======================================================================%reset%
echo.
echo %green%正在启动开发服务器...%reset%
echo.

:: 尝试使用Chrome的无痕模式打开
start "" chrome --incognito http://localhost:3000 >nul 2>&1
if %errorlevel% neq 0 (
    echo %yellow%Chrome未找到，尝试使用Edge...%reset%
    start "" msedge --inprivate http://localhost:3000 >nul 2>&1
    if %errorlevel% neq 0 (
        echo %yellow%Edge未找到，尝试使用Firefox...%reset%
        start "" firefox -private-window http://localhost:3000 >nul 2>&1
        if %errorlevel% neq 0 (
            echo %magenta%未找到支持的浏览器，将不打开浏览器。%reset%
            echo %blue%请手动访问: http://localhost:3000%reset%
        ) else (
            echo %green%已使用Firefox隐私浏览模式打开。%reset%
        )
    ) else (
        echo %green%已使用Edge InPrivate模式打开。%reset%
    )
) else (
    echo %green%已使用Chrome无痕模式打开。%reset%
)

echo.
echo %cyan%=======================================================================%reset%
echo %yellow%                        开发服务器启动中...                          %reset%
echo %cyan%=======================================================================%reset%
echo.

npm run dev 