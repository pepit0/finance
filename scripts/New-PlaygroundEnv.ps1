#Requires -Version 5.1
<#
.SYNOPSIS
  Create .env.local for local playground dev (not committed).

.EXAMPLE
  .\scripts\New-PlaygroundEnv.ps1
  .\scripts\New-PlaygroundEnv.ps1 -SupabaseUrl "https://xxx.supabase.co" -AnonKey "eyJ..."
#>
param(
  [string]$SupabaseUrl = "",
  [string]$AnonKey = ""
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $root ".env.local"

if (-not $SupabaseUrl) {
  $SupabaseUrl = Read-Host "Supabase Project URL (Settings -> API)"
}
if (-not $AnonKey) {
  $AnonKey = Read-Host "Supabase anon public key"
}

$content = @"
# Playground local dev — do not commit
VITE_PRODUCT=crm
VITE_SUPABASE_URL=$SupabaseUrl
VITE_SUPABASE_ANON_KEY=$AnonKey
"@

Set-Content -Path $envPath -Value $content -Encoding utf8
Write-Host "Wrote $envPath" -ForegroundColor Green
Write-Host "Run: npm run dev"
Write-Host "Open: http://localhost:5173/crm"
