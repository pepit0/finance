#Requires -Version 5.1
<#
.SYNOPSIS
  Download default CRM branding PNGs from a Supabase project (public crm-branding bucket).

.DESCRIPTION
  Saves to assets/tenant-default-branding/background.png and header-icon.png.
  Run after you finalize logos on playground, then commit those PNGs to Git.

.EXAMPLE
  .\scripts\Export-TenantDefaultBranding.ps1 -SupabaseUrl "https://YOUR_REF.supabase.co"
#>
param(
  [Parameter(Mandatory = $false)]
  [string]$SupabaseUrl = ""
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$outDir = Join-Path $root "assets\tenant-default-branding"

if (-not $SupabaseUrl) {
  $SupabaseUrl = Read-Host "Supabase Project URL (Settings -> API)"
}
$SupabaseUrl = $SupabaseUrl.Trim().TrimEnd("/")

New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$files = @(
  @{ Local = "background.png"; Remote = "default/background.png" },
  @{ Local = "header-icon.png"; Remote = "default/header-icon.png" }
)

foreach ($f in $files) {
  $uri = "$SupabaseUrl/storage/v1/object/public/crm-branding/$($f.Remote)"
  $dest = Join-Path $outDir $f.Local
  Write-Host "GET $uri"
  Invoke-WebRequest -Uri $uri -OutFile $dest
  Write-Host "  -> $dest ($((Get-Item $dest).Length) bytes)" -ForegroundColor Green
}

Write-Host ""
Write-Host "Next: commit assets/tenant-default-branding/*.png and keep sql/seed_tenant_defaults.sql in sync." -ForegroundColor Cyan
