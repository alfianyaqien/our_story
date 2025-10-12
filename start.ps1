# Run this script to start the Our Story application

Write-Host "🎀 Our Story - Starting Application..." -ForegroundColor Magenta
Write-Host ""

# Check if node_modules exists
if (-Not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

# Check if .env exists
if (-Not (Test-Path ".env")) {
    Write-Host "⚙️  Creating .env file..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "✅ .env file created. Please update with your own values!" -ForegroundColor Green
    Write-Host ""
}

# Start the development server
Write-Host "🚀 Starting development server..." -ForegroundColor Cyan
Write-Host "📍 Application will be available at: http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "Default login credentials:" -ForegroundColor Yellow
Write-Host "  Username: partner1  |  Password: password1" -ForegroundColor Gray
Write-Host "  Username: partner2  |  Password: password2" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""

npm run dev
