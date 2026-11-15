#Requires -Version 5.1
<#
.SYNOPSIS
  Apply sql/subprime_tool_auth.sql to the subprimetool Supabase project via CLI.

.EXAMPLE
  .\scripts\Apply-SubprimeToolAuth.ps1 -DbPassword "your-db-password"
#>
param(
  [string]$ProjectRef = "beezujpcoskusrbvsuka",
  [Parameter(Mandatory = $true)]
  [string]$DbPassword,
  [string]$Email = "danielsharifian@gmail.com"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$sqlPath = Join-Path $root "sql\subprime_tool_auth.sql"
$hostName = "db.$ProjectRef.supabase.co"
$conn = "postgresql://postgres:$([Uri]::EscapeDataString($DbPassword))@${hostName}:5432/postgres"

Write-Host "Applying $sqlPath to $ProjectRef..." -ForegroundColor Cyan
npx supabase db execute --db-url $conn --file $sqlPath

Write-Host "Allowlisting $Email..." -ForegroundColor Cyan
$tmp = Join-Path $env:TEMP "subprime-allowlist.sql"
Set-Content -Path $tmp -Value "insert into public.finance_access_allowlist (email) values ('$Email') on conflict (email) do nothing;" -Encoding utf8
npx supabase db execute --db-url $conn --file $tmp
Remove-Item $tmp -Force

Write-Host "Done. Create Auth user $Email in Dashboard if not already added." -ForegroundColor Green
