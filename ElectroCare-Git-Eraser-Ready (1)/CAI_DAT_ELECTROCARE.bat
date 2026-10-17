@echo off
setlocal
cd /d "%~dp0"
echo ================================================
echo        ELECTROCARE - CAI DAT DU AN
echo ================================================
where node >nul 2>nul
if errorlevel 1 (
  echo [LOI] Chua cai Node.js 20+. Hay cai Node.js LTS truoc.
  pause
  exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
  echo [LOI] Khong tim thay npm.
  pause
  exit /b 1
)
if not exist "may-chu\.env" (
  copy "may-chu\.env.example" "may-chu\.env" >nul
  echo [LUU Y] Da tao may-chu\.env tu file mau.
)
echo.
echo [1/2] Cai thu vien Backend...
call npm --prefix may-chu install
if errorlevel 1 goto :error
echo.
echo [2/2] Kiem tra giao dien...
if not exist "giao-dien\trang-chu.html" (
  echo [LOI] Khong tim thay giao-dien\trang-chu.html
  goto :error
)
echo Giao dien nay chay truc tiep, khong can cai thu vien rieng.
echo.
echo [OK] Cai dat thu vien hoan tat.
echo Hay mo may-chu\.env de kiem tra MySQL va dien GEMINI_API_KEY neu muon dung AI.
echo Import co-so-du-lieu\tao-co-so-du-lieu.sql vao database electrocare_v2 neu cac bang con thieu.
echo Sau do chay CHAY_ELECTROCARE.bat
pause
exit /b 0
:error
echo.
echo [LOI] Cai dat that bai. Kiem tra Node.js, ket noi mang va log phia tren.
pause
exit /b 1
