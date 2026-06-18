#Requires -Version 5.1
<#
.SYNOPSIS
  Create .env.local for local finance-dashboard dev (not committed).

.EXAMPLE
  .\scripts\New-FinanceEnv.ps1
  .\scripts\New-FinanceEnv.ps1 -SupabaseUrl "https://xxx.supabase.co" -AnonKey "eyJ..." -CrmAppUrl "https://crm.sharifian.cfd/crm"
#>
param(
  [string]$SupabaseUrl = "",
  [string]$AnonKey = "",
  [string]$CrmAppUrl = ""
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
if (-not $CrmAppUrl) {
  $CrmAppUrl = Read-Host "CRM app URL (e.g. https://crm.sharifian.cfd/crm)"
}

$content = @"
# Finance local dev — do not commit
VITE_PRODUCT=finance
VITE_SUPABASE_URL=$SupabaseUrl
VITE_SUPABASE_ANON_KEY=$AnonKey
VITE_CRM_APP_URL=$CrmAppUrl
"@

Set-Content -Path $envPath -Value $content -Encoding utf8
Write-Host "Wrote $envPath" -ForegroundColor Green
Write-Host "Run: npm run dev:finance"
Write-Host "Open: http://localhost:5173"
