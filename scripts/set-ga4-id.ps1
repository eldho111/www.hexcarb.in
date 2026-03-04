param(
  [Parameter(Mandatory = $true)]
  [string]$Ga4Id
)

$ErrorActionPreference = "Stop"

if ($Ga4Id -notmatch "^G-[A-Z0-9]{6,}$") {
  throw "Invalid GA4 ID. Expected format like G-ABC123XYZ."
}

$root = Split-Path -Parent $PSScriptRoot
$htmlFiles = Get-ChildItem -Path $root -Recurse -File -Filter "*.html"
$updated = 0

foreach ($file in $htmlFiles) {
  $content = Get-Content -LiteralPath $file.FullName -Raw
  $updatedContent = [regex]::Replace(
    $content,
    '(?i)<meta\s+name="hc-ga4-id"\s+content="[^"]*"\s*/?>',
    '<meta name="hc-ga4-id" content="' + $Ga4Id + '" />'
  )

  if ($updatedContent -ne $content) {
    Set-Content -LiteralPath $file.FullName -Value $updatedContent -Encoding UTF8
    $updated++
  }
}

Write-Host "Updated hc-ga4-id on $updated HTML file(s)." -ForegroundColor Green
