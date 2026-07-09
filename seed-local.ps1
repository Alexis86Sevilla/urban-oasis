# Seed local database with Oasis spots from Overpass API
# Prerequisite: backend running on localhost:8080
# Usage: .\seed-local.ps1

$base = "http://localhost:8080/api/oasis"

Write-Host "Truncating all spots..." -ForegroundColor Yellow
Invoke-RestMethod -Uri "$base/type/WATER_FOUNTAIN" -Method Delete -ErrorAction SilentlyContinue
Invoke-RestMethod -Uri "$base/type/SHADE" -Method Delete -ErrorAction SilentlyContinue
Invoke-RestMethod -Uri "$base/type/AC_BUILDING" -Method Delete -ErrorAction SilentlyContinue

Write-Host "Syncing water fountains..." -ForegroundColor Cyan
Invoke-RestMethod -Uri "$base/syncFountainsAndShades" -Method Post

Write-Host "Syncing AC buildings..." -ForegroundColor Cyan
Invoke-RestMethod -Uri "$base/syncACBuildings" -Method Post

Write-Host "Done! Check http://localhost:8080/api/oasis" -ForegroundColor Green
