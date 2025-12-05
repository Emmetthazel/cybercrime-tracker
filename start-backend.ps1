# Backend Startup Script
# Run this script to start the backend server

Write-Host "=== Starting Backend Server ===" -ForegroundColor Cyan

# Check if .env file exists
if (-not (Test-Path "Backend\.env")) {
    Write-Host "WARNING: .env file not found!" -ForegroundColor Yellow
    Write-Host "Creating .env file with default values..." -ForegroundColor Yellow

    $envContent = @"
MONGODB_URI=mongodb://localhost:27017/cybercrime_tracker
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_REFRESH_SECRET=your_refresh_token_secret
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
"@

    Set-Content -Path "Backend\.env" -Value $envContent -Encoding UTF8
    Write-Host "[OK] Created .env file. Please update JWT_SECRET for production!" -ForegroundColor Green
}

# Navigate to backend directory
Set-Location Backend

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Start the server
Write-Host "`nStarting backend server..." -ForegroundColor Yellow
Write-Host "Server will run on http://localhost:5000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server`n" -ForegroundColor Yellow

npm run dev
