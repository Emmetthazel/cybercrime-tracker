# MongoDB Startup Script for Windows
# Run this script to create the data directory and start MongoDB

Write-Host "=== MongoDB Setup Script ===" -ForegroundColor Cyan

# Check if MongoDB is installed
$mongodPath = Get-Command mongod -ErrorAction SilentlyContinue
if (-not $mongodPath) {
    Write-Host "ERROR: MongoDB not found in PATH" -ForegroundColor Red
    Write-Host "Please install MongoDB or add it to your PATH" -ForegroundColor Yellow
    exit 1
}

# Create data directory
$dataPath = "C:\data\db"
Write-Host "`nChecking data directory..." -ForegroundColor Yellow

if (-not (Test-Path $dataPath)) {
    try {
        New-Item -ItemType Directory -Path $dataPath -Force | Out-Null
        Write-Host "[OK] Created directory: $dataPath" -ForegroundColor Green
    }
    catch {
        Write-Host "ERROR: Could not create directory. Try running as Administrator" -ForegroundColor Red
        Write-Host "Or create manually: mkdir C:\data\db" -ForegroundColor Yellow
        exit 1
    }
}
else {
    Write-Host "[OK] Directory already exists: $dataPath" -ForegroundColor Green
}

# Start MongoDB
Write-Host "`nStarting MongoDB..." -ForegroundColor Yellow
Write-Host "MongoDB will run on port 27017" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop MongoDB`n" -ForegroundColor Yellow

mongod --dbpath $dataPath
