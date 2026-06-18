#Requires -Version 5.1
<#
.SYNOPSIS
  Bundle all playground migrations into one SQL file (one Supabase paste), or apply via Supabase CLI.

.EXAMPLE
  # Generate bundle only (open in Cursor, copy to Supabase SQL Editor):
  .\scripts\Apply-PlaygroundMigrations.ps1

.EXAMPLE
  # Set master email before bundling:
  .\scripts\Apply-PlaygroundMigrations.ps1 -MasterEmail "you@example.com"

.EXAMPLE
  # Apply directly (needs DB password from Supabase → Settings → Database):
  .\scripts\Apply-PlaygroundMigrations.ps1 -ProjectRef "abcdefgh" -DbPassword "your-db-password" -Apply

.EXAMPLE
  # Include seed data after migrations:
  .\scripts\Apply-PlaygroundMigrations.ps1 -IncludeSeed
#>
param(
  [string]$MasterEmail = "",
  [string]$ProjectRef = "",
  [string]$DbPassword = "",
  [string]$DbHost = "",
  [switch]$Apply,
  [switch]$IncludeSeed,
  [switch]$OpenInEditor
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$manifestPath = Join-Path $PSScriptRoot "migration-manifest.json"
$outDir = Join-Path $root "sql\.generated"
$bundlePath = Join-Path $outDir "playground-full-migration.sql"
$seedBundlePath = Join-Path $outDir "playground-with-seed.sql"

if (-not (Test-Path $manifestPath)) {
  throw "Missing $manifestPath"
}

$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

function Get-MasterEmailReplacement {
  param([string]$Sql, [string]$Email)
  if (-not $Email) {
    return $Sql
  }
  return $Sql -replace "lower\('[^']*'\)\s*;\s*\$\$", "lower('$Email');`n`$`$"
}

$parts = New-Object System.Collections.Generic.List[string]
$parts.Add("-- AUTO-GENERATED playground migration bundle. Do not edit.")
$parts.Add("-- Regenerate: .\scripts\Apply-PlaygroundMigrations.ps1")
$parts.Add("-- Run in Supabase SQL Editor on an EMPTY playground project.")
$parts.Add("")

$i = 0
foreach ($rel in $manifest.migrations) {
  $i++
  $path = Join-Path $root ($rel -replace "/", [IO.Path]::DirectorySeparatorChar)
  if (-not (Test-Path $path)) {
    throw "Missing migration file #$i : $rel"
  }
  $sql = Get-Content $path -Raw
  if ($null -eq $sql) {
    $sql = ""
  }
  if ($rel -like "*crm_directory_set_master_email.sql") {
    $sql = Get-MasterEmailReplacement -Sql $sql -Email $MasterEmail
  }
  $parts.Add("")
  $parts.Add("-- ========== [$i/$($manifest.migrations.Count)] $rel ==========")
  $parts.Add($sql.TrimEnd())
}

if ($IncludeSeed) {
  $seedPath = Join-Path $root ($manifest.playgroundSeed -replace "/", [IO.Path]::DirectorySeparatorChar)
  if (-not (Test-Path $seedPath)) {
    throw "Missing seed file: $($manifest.playgroundSeed)"
  }
  $parts.Add("")
  $parts.Add("-- ========== SEED: $($manifest.playgroundSeed) ==========")
  $parts.Add((Get-Content $seedPath -Raw).TrimEnd())
}

$bundle = ($parts -join "`n") + "`n"
Set-Content -Path $bundlePath -Value $bundle -Encoding utf8 -NoNewline

Write-Host ""
Write-Host "Created: $bundlePath" -ForegroundColor Green
Write-Host "  Files bundled: $($manifest.migrations.Count)"
if ($IncludeSeed) {
  Copy-Item $bundlePath $seedBundlePath -Force
  Write-Host "  (includes seed -> $seedBundlePath)"
}
Write-Host ""
Write-Host "NEXT (manual in Supabase dashboard):" -ForegroundColor Cyan
Write-Host "  1. SQL Editor -> New query"
Write-Host "  2. Open playground-full-migration.sql in Cursor -> Ctrl+A -> Ctrl+C -> paste -> Run"
Write-Host "  3. If not using -IncludeSeed, run sql/seed_playground.sql separately"
Write-Host "  4. Auth -> Add user (same email as crm_directory_set_master_email.sql)"
Write-Host "  5. Run allowlist SQL (see sql/.generated/playground-allowlist.sql)"
Write-Host ""

# Allowlist helper
$emailForAllowlist = $MasterEmail
if (-not $emailForAllowlist) {
  $masterFile = Join-Path $root "sql\crm_directory_set_master_email.sql"
  if (Test-Path $masterFile) {
    if ($masterContent = Get-Content $masterFile -Raw) {
      if ($masterContent -match "lower\('([^']+)'\)") {
        $emailForAllowlist = $Matches[1]
      }
    }
  }
}

$allowlistPath = Join-Path $outDir "playground-allowlist.sql"
$allowlistSql = @"
-- Run after creating the Auth user with this email.
insert into public.crm_access_allowlist (email)
values ('$emailForAllowlist')
on conflict do nothing;
"@
Set-Content -Path $allowlistPath -Value $allowlistSql -Encoding utf8
Write-Host "Created: $allowlistPath" -ForegroundColor Green

if ($Apply) {
  if (-not $ProjectRef -or -not $DbPassword) {
    throw "For -Apply, pass -ProjectRef and -DbPassword (from Supabase Settings -> Database)."
  }
  $hostName = if ($DbHost) { $DbHost } else { "db.$ProjectRef.supabase.co" }
  $dbUrl = "postgresql://postgres:$([uri]::EscapeDataString($DbPassword))@${hostName}:5432/postgres"
  $supabase = Get-Command supabase -ErrorAction SilentlyContinue
  if (-not $supabase) {
    throw "Supabase CLI not found. Install: https://supabase.com/docs/guides/cli"
  }
  Write-Host "Applying via supabase db execute..." -ForegroundColor Yellow
  & supabase db execute --db-url $dbUrl --file $bundlePath
  if ($LASTEXITCODE -ne 0) {
    throw "supabase db execute failed (exit $LASTEXITCODE)"
  }
  if ($IncludeSeed) {
    $seedOnly = Join-Path $root ($manifest.playgroundSeed -replace "/", [IO.Path]::DirectorySeparatorChar)
    & supabase db execute --db-url $dbUrl --file $seedOnly
  }
  Write-Host "Migrations applied." -ForegroundColor Green
}

if ($OpenInEditor) {
  if (Get-Command cursor -ErrorAction SilentlyContinue) {
    & cursor $bundlePath
  } elseif (Get-Command code -ErrorAction SilentlyContinue) {
    & code $bundlePath
  } else {
    Start-Process $bundlePath
  }
}
