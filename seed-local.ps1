# Seed local database with Oasis spots from Overpass API
# Prerequisite: backend running on localhost:8080 with ADMIN_API_KEY set
# Usage: $env:ADMIN_API_KEY = "your-local-key"; .\seed-local.ps1

if ([string]::IsNullOrWhiteSpace($env:ADMIN_API_KEY)) {
    Write-Host "ADMIN_API_KEY environment variable is not set. Set it to the same value configured on the backend before running this script." -ForegroundColor Red
    exit 1
}

$base = "http://localhost:8080/api/oasis"
$headers = @{ "X-API-Key" = $env:ADMIN_API_KEY }

Write-Host "Truncating all spots..." -ForegroundColor Yellow
Invoke-RestMethod -Uri "$base/type/WATER_FOUNTAIN" -Method Delete -Headers $headers -ErrorAction SilentlyContinue
Invoke-RestMethod -Uri "$base/type/SHADE" -Method Delete -Headers $headers -ErrorAction SilentlyContinue
Invoke-RestMethod -Uri "$base/type/AC_BUILDING" -Method Delete -Headers $headers -ErrorAction SilentlyContinue

Write-Host "Syncing water fountains..." -ForegroundColor Cyan
Invoke-RestMethod -Uri "$base/syncFountainsAndShades" -Method Post -Headers $headers

Write-Host "Syncing AC buildings..." -ForegroundColor Cyan
Invoke-RestMethod -Uri "$base/syncACBuildings" -Method Post -Headers $headers

Write-Host "Done! Check http://localhost:8080/api/oasis" -ForegroundColor Green
