#Requires -Version 5.1
<#
.SYNOPSIS
  Create .env.local for standalone subprime / finance tool dev.

.EXAMPLE
  .\scripts\New-SubprimeToolEnv.ps1 -SkipAuth
  .\scripts\New-SubprimeToolEnv.ps1 -SupabaseUrl "https://xxx.supabase.co" -AnonKey "eyJ..."
#>
param(
  [switch]$SkipAuth,
  [string]$SupabaseUrl = "https://beezujpcoskusrbvsuka.supabase.co",
  [string]$AnonKey = "",
  [string]$CrmAppUrl = "https://crm.sharifian.cfd/crm"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $root ".env.local"

if ($SkipAuth) {
  $content = @"
# Subprime tool local demo — no Supabase login (do not commit)
VITE_PRODUCT=finance
VITE_FINANCE_SKIP_AUTH=true
VITE_CRM_APP_URL=$CrmAppUrl
"@
} else {
  if (-not $AnonKey) {
    $AnonKey = Read-Host "subprimetool anon public key (Dashboard -> Settings -> API)"
  }

  $content = @"
# Subprime tool - dedicated Supabase auth (do not commit)
VITE_PRODUCT=finance
VITE_FINANCE_SKIP_AUTH=false
VITE_SUPABASE_URL=$SupabaseUrl
VITE_SUPABASE_ANON_KEY=$AnonKey
VITE_CRM_APP_URL=$CrmAppUrl
"@
}

Set-Content -Path $envPath -Value $content -Encoding utf8
Write-Host "Wrote $envPath" -ForegroundColor Green
Write-Host "Run: npm run dev:finance"
Write-Host "Open: http://localhost:5173"
