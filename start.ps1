# CortexFlow 1-Click PowerShell Launcher
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Starting CortexFlow: Self-Healing Company Brain" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# 1. Check & start FalkorDB container
Write-Host "[*] Checking FalkorDB Docker container..." -ForegroundColor Yellow
$container = docker ps -a -q -f name=cortexflow-db
if (-not $container) {
    Write-Host "[+] Creating FalkorDB container with persistent volume..." -ForegroundColor Green
    docker run -d --name cortexflow-db -p 6379:6379 -p 3000:3000 -v falkordb_data:/data --restart unless-stopped falkordb/falkordb:latest
} else {
    docker start cortexflow-db | Out-Null
}

# 2. Start FastAPI Backend in background
Write-Host "[*] Launching FastAPI Backend on port 8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload"

# 3. Start Frontend in background
Write-Host "[*] Launching Vite Frontend on port 5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location frontend; npm run dev"

# 4. Open Browser
Start-Sleep -Seconds 3
Start-Process "http://localhost:5173"

Write-Host "========================================================" -ForegroundColor Green
Write-Host "  CortexFlow is live!" -ForegroundColor Green
Write-Host "  Frontend: http://localhost:5173"
Write-Host "  Backend:  http://localhost:8000"
Write-Host "  FalkorDB: localhost:6379"
Write-Host "========================================================" -ForegroundColor Green
