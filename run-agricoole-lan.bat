@echo off
setlocal

cd /d %~dp0

where node >nul 2>nul
if %errorlevel% neq 0 (
  echo Node.js n est pas installe. Installe Node 18+ puis relance.
  pause
  exit /b 1
)

if not exist "server\.env" (
  copy "server\.env.example" "server\.env" >nul
  echo Fichier server\.env cree. Ajoute ta cle GEMINI_API_KEY.
)

findstr /c:"GEMINI_API_KEY=your_key_here" "server\.env" >nul
if %errorlevel%==0 (
  echo GEMINI_API_KEY manquante. Modifie server\.env puis relance.
  pause
  exit /b 1
)

if not exist "server\node_modules" (
  echo Installation des dependances server...
  pushd server
  npm install
  popd
)

if not exist "client\node_modules" (
  echo Installation des dependances client...
  pushd client
  npm install
  popd
)

for /f "usebackq delims=" %%i in (`powershell -NoProfile -Command "try { $ip = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -match '^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)' -and $_.IPAddress -ne '127.0.0.1' } | Sort-Object -Property InterfaceMetric | Select-Object -First 1 -ExpandProperty IPAddress; if (-not $ip) { $ip = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -ne '127.0.0.1' -and $_.IPAddress -notlike '169.254*' } | Sort-Object -Property InterfaceMetric | Select-Object -First 1 -ExpandProperty IPAddress }; if (-not $ip) { $ip = '127.0.0.1' }; Write-Output $ip } catch { '127.0.0.1' }"`) do set "LAN_IP=%%i"

if "%LAN_IP%"=="" set "LAN_IP=127.0.0.1"

set "SERVER_PORT=8787"
set "CLIENT_PORT=5173"

echo VITE_API_URL=http://%LAN_IP%:%SERVER_PORT%> "client\.env.local"

start "Agricoole Server" cmd /k "cd /d %~dp0server && npm start"
start "Agricoole Client" cmd /k "cd /d %~dp0client && set \"VITE_API_URL=http://%LAN_IP%:%SERVER_PORT%\" && npm run dev -- --host 0.0.0.0 --port %CLIENT_PORT% --strictPort"

echo.
echo === Lien unique (meme lien pour ce PC et autres appareils) ===
echo   http://%LAN_IP%:%CLIENT_PORT%
if "%LAN_IP%"=="127.0.0.1" (
  echo.
  echo Aucun IP reseau detecte. Le lien ne marchera pas hors du PC.
)
echo.
echo Si un appareil n y accede pas, verifie le pare-feu Windows et que vous etes sur le meme Wi-Fi.
echo.
pause
