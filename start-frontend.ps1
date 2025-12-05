# Frontend Startup Script
# Run this script to start the frontend development server

Write-Host "=== Starting Frontend Server ===" -ForegroundColor Cyan

# Check if .env file exists
if (-not (Test-Path "Frontend\.env")) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    
    $envContent = "REACT_APP_API_URL=http://localhost:5000/api"
    
    Set-Content -Path "Frontend\.env" -Value $envContent -Encoding UTF8
    Write-Host "[OK] Created .env file" -ForegroundColor Green
}

# Navigate to frontend directory
Set-Location Frontend

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Start the development server
Write-Host ""
Write-Host "Starting frontend development server..." -ForegroundColor Yellow
Write-Host "Frontend will run on http://localhost:3000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

npm start
