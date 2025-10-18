# Database Migration Runner for Our Story
# This script runs all pending migrations in the correct order

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "   Our Story - Database Migration Runner" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Load environment variables from .env file
if (Test-Path .env) {
    Write-Host "✓ Loading database configuration from .env..." -ForegroundColor Green
    Get-Content .env | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]*)\s*=\s*(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
} else {
    Write-Host "✗ .env file not found! Please create it from .env.example" -ForegroundColor Red
    exit 1
}

$DB_HOST = $env:DB_HOST
$DB_PORT = $env:DB_PORT
$DB_USER = $env:DB_USER
$DB_PASSWORD = $env:DB_PASSWORD
$DB_NAME = $env:DB_NAME

Write-Host ""
Write-Host "Database Configuration:" -ForegroundColor Yellow
Write-Host "  Host: $DB_HOST" -ForegroundColor Gray
Write-Host "  Port: $DB_PORT" -ForegroundColor Gray
Write-Host "  User: $DB_USER" -ForegroundColor Gray
Write-Host "  Database: $DB_NAME" -ForegroundColor Gray
Write-Host ""

# Check if mysql command is available
$mysqlPath = Get-Command mysql -ErrorAction SilentlyContinue
if (-not $mysqlPath) {
    Write-Host "✗ MySQL client not found in PATH" -ForegroundColor Red
    Write-Host "  Please install MySQL client or add it to your PATH" -ForegroundColor Yellow
    Write-Host "  Common locations:" -ForegroundColor Yellow
    Write-Host "    - C:\Program Files\MySQL\MySQL Server 8.0\bin" -ForegroundColor Gray
    Write-Host "    - C:\xampp\mysql\bin" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Or you can run migrations manually using the SQL files in database/migrations/" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ MySQL client found at: $($mysqlPath.Source)" -ForegroundColor Green
Write-Host ""

# List of migrations in the correct order
$migrations = @(
    "001_update_recipes_to_culinary_plans.sql",
    "004_create_photos_table.sql", 
    "005_create_culinary_photos_table.sql",
    "006_enhance_users_table_for_auth_v2.sql",
    "007_create_albums_table.sql"
)

Write-Host "Migrations to run:" -ForegroundColor Cyan
$migrations | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
Write-Host ""

$confirmation = Read-Host "Do you want to proceed with running these migrations? (y/n)"
if ($confirmation -ne 'y') {
    Write-Host "Migration cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Starting migrations..." -ForegroundColor Cyan
Write-Host ""

$successCount = 0
$failCount = 0

foreach ($migration in $migrations) {
    $migrationPath = "database/migrations/$migration"
    
    if (Test-Path $migrationPath) {
        Write-Host "Running: $migration" -ForegroundColor Yellow
        
        try {
            # Run the migration
            $command = "mysql -h$DB_HOST -P$DB_PORT -u$DB_USER -p$DB_PASSWORD $DB_NAME"
            Get-Content $migrationPath | & mysql -h$DB_HOST -P$DB_PORT -u$DB_USER -p$DB_PASSWORD $DB_NAME 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  ✓ Success" -ForegroundColor Green
                $successCount++
            } else {
                Write-Host "  ✗ Failed" -ForegroundColor Red
                $failCount++
            }
        } catch {
            Write-Host "  ✗ Error: $_" -ForegroundColor Red
            $failCount++
        }
        
        Write-Host ""
    } else {
        Write-Host "  ⚠ File not found: $migrationPath" -ForegroundColor Yellow
        Write-Host ""
    }
}

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Migration Summary:" -ForegroundColor Cyan
Write-Host "  Successful: $successCount" -ForegroundColor Green
Write-Host "  Failed: $failCount" -ForegroundColor $(if ($failCount -gt 0) { "Red" } else { "Gray" })
Write-Host "==================================================" -ForegroundColor Cyan

if ($failCount -eq 0) {
    Write-Host ""
    Write-Host "✓ All migrations completed successfully!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "⚠ Some migrations failed. Please check the errors above." -ForegroundColor Yellow
    Write-Host ""
}
