@echo off
echo ========================================================
echo   Starting CortexFlow: Self-Healing Company Brain
echo ========================================================

REM 1. Ensure FalkorDB container is running with persistent storage
echo [*] Checking FalkorDB Docker container...
docker ps -q -f name=cortexflow-db > nul 2>&1
if errorlevel 1 (
    echo [!] Starting FalkorDB container with persistent volume...
    docker run -d --name cortexflow-db -p 6379:6379 -p 3000:3000 -v falkordb_data:/data --restart unless-stopped falkordb/falkordb:latest 2>nul || docker start cortexflow-db
) else (
    docker start cortexflow-db > nul 2>&1
)

REM 2. Start FastAPI backend server in the background
echo [*] Starting FastAPI Backend (Port 8000)...
start "CortexFlow Backend" cmd /k "python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload"

REM 3. Start Vite React Frontend
echo [*] Starting Frontend (Port 5173)...
start "CortexFlow Frontend" cmd /k "cd frontend && npm run dev"

REM 4. Open browser
timeout /t 3 > nul
echo [*] Launching CortexFlow in browser...
start http://localhost:5173

echo ========================================================
echo   CortexFlow is running!
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:8000
echo   FalkorDB: localhost:6379
echo ========================================================
