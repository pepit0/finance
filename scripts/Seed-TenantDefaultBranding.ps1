#Requires -Version 5.1
<#
.SYNOPSIS
  Upload default CRM branding PNGs to a new (or reset) Supabase project.

.DESCRIPTION
  Requires the service role key (Settings -> API -> service_role). Uploads repo assets to
  crm-branding/default/background.png and default/header-icon.png — same paths as
  sql/seed_tenant_defaults.sql and CRM_BRANDING_STORAGE_PATHS in the app.

  Run AFTER migrations (crm_org_settings_branding.sql) and sql/seed_tenant_defaults.sql.

.EXAMPLE
  .\scripts\Seed-TenantDefaultBranding.ps1 `
    -SupabaseUrl "https://YOUR_REF.supabase.co" `
    -ServiceRoleKey "eyJ..."
#>
param(
  [Parameter(Mandatory = $false)]
  [string]$SupabaseUrl = "",
  [Parameter(Mandatory = $false)]
  [string]$ServiceRoleKey = ""
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$assetDir = Join-Path $root "assets\tenant-default-branding"

if (-not $SupabaseUrl) {
  $SupabaseUrl = Read-Host "Supabase Project URL (Settings -> API)"
}
if (-not $ServiceRoleKey) {
  $ServiceRoleKey = Read-Host "Supabase service_role key (secret)" -AsSecureString
  $ServiceRoleKey = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($ServiceRoleKey)
  )
}

$SupabaseUrl = $SupabaseUrl.Trim().TrimEnd("/")

$uploads = @(
  @{ Local = "background.png"; Remote = "default/background.png" },
  @{ Local = "header-icon.png"; Remote = "default/header-icon.png" }
)

foreach ($u in $uploads) {
  $localPath = Join-Path $assetDir $u.Local
  if (-not (Test-Path $localPath)) {
    throw "Missing $localPath — run scripts/Export-TenantDefaultBranding.ps1 from playground first."
  }

  $uri = "$SupabaseUrl/storage/v1/object/crm-branding/$($u.Remote)"
  $bytes = [System.IO.File]::ReadAllBytes($localPath)
  Write-Host "POST $uri ($($bytes.Length) bytes)"

  $response = Invoke-WebRequest -Method Post -Uri $uri -Headers @{
    Authorization = "Bearer $ServiceRoleKey"
    apikey        = $ServiceRoleKey
    "x-upsert"    = "true"
  } -ContentType "image/png" -Body $bytes

  if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300) {
    Write-Host "  OK" -ForegroundColor Green
  } else {
    throw "Upload failed: $($response.StatusCode) $($response.Content)"
  }
}

Write-Host ""
Write-Host "Done. crm_org_settings paths should already be default/background.png and default/header-icon.png from seed_tenant_defaults.sql." -ForegroundColor Cyan
