@echo off
setlocal
cd /d "%~dp0"
echo ================================================
echo        ELECTROCARE - KHOI DONG HE THONG
echo ================================================
if not exist "may-chu\.env" (
  echo [LOI] Khong tim thay may-chu\.env
  echo Hay chay CAI_DAT_ELECTROCARE.bat truoc.
  pause
  exit /b 1
)
if not exist "may-chu\node_modules" (
  echo [LOI] Chua cai thu vien backend. Hay chay CAI_DAT_ELECTROCARE.bat truoc.
  pause
  exit /b 1
)
echo.
echo [1] Dang khoi dong Backend tai http://localhost:3000
start "ElectroCare Backend" /D "%~dp0may-chu" cmd /k "npm start"
timeout /t 2 /nobreak >nul
echo [2] Dang khoi dong Giao dien tai http://localhost:5173
start "ElectroCare Frontend" /D "%~dp0giao-dien" cmd /k "npm run dev"
echo.
echo Website: http://localhost:5173
echo API Health: http://localhost:3000/api/health
echo.
echo Giu mo hai cua so server. Dong hai cua so do de dung he thong.
pause
