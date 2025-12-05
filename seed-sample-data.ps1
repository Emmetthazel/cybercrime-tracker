# Script to seed sample data into the database

Write-Host "=== Seeding Sample Data ===" -ForegroundColor Cyan
Write-Host ""

# Check if MongoDB is running
$mongodProcess = Get-Process mongod -ErrorAction SilentlyContinue
if (-not $mongodProcess) {
    Write-Host "[ERROR] MongoDB is not running!" -ForegroundColor Red
    Write-Host "Please start MongoDB first: .\start-mongodb.ps1" -ForegroundColor Yellow
    exit 1
}

# Navigate to Backend directory
Set-Location Backend

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "[WARNING] .env file not found. Creating default..." -ForegroundColor Yellow
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
    Set-Content -Path ".env" -Value $envContent -Encoding UTF8
}

# Run the seed script
Write-Host "Seeding sample data..." -ForegroundColor Yellow
Write-Host "This will create:" -ForegroundColor Cyan
Write-Host "  - 3 sample IPs" -ForegroundColor White
Write-Host "  - 50 sample attacks" -ForegroundColor White
Write-Host "  - 1 sample alert" -ForegroundColor White
Write-Host ""

node scripts/seed-data.js

Set-Location ..

Write-Host ""
Write-Host "✅ Done! Refresh your dashboard to see the data." -ForegroundColor Green

