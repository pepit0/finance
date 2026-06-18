param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("patch", "minor", "major")]
  [string]$Part
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$pkgPath = Join-Path $root "package.json"
$changelogPath = Join-Path $root "CHANGELOG.md"

$pkg = Get-Content $pkgPath -Raw | ConvertFrom-Json
$version = [version]$pkg.version
$newVersion = switch ($Part) {
  "major" { [version]::new($version.Major + 1, 0, 0) }
  "minor" { [version]::new($version.Major, $version.Minor + 1, 0) }
  "patch" { [version]::new($version.Major, $version.Minor, $version.Build + 1) }
}
$newVersionString = $newVersion.ToString(3)

$pkg.version = $newVersionString
$pkg | ConvertTo-Json -Depth 10 | Set-Content $pkgPath -Encoding utf8

$today = Get-Date -Format "yyyy-MM-dd"
$entry = @"

## [$newVersionString] - $today

### Added

- (describe changes)

"@

$changelog = Get-Content $changelogPath -Raw
$changelog = $changelog -replace "(# Changelog\s+)", "`$1`n$entry"
Set-Content $changelogPath $changelog -Encoding utf8 -NoNewline

Write-Host "Bumped version to $newVersionString"
Write-Host "Update CHANGELOG entry and run upgrades per docs/UPGRADE.md"
