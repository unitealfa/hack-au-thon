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
  echo Installation des dependances...
  pushd server
  npm install
  popd
)

start "Agricoole Server" cmd /k "cd /d %~dp0server && npm start"
start "Agricoole Demo" "%~dp0widget\demo.html"

echo.
echo Serveur demarre sur http://localhost:8787
echo Demo ouverte. Sinon, ouvre widget\demo.html manuellement.
echo.
pause
