param(
  [string]$Root = "."
)

$ErrorActionPreference = "Stop"

$rootPath = (Resolve-Path $Root).Path
$htmlFiles = Get-ChildItem -Path $rootPath -Recurse -File -Filter "*.html"
$cssFiles = Get-ChildItem -Path $rootPath -Recurse -File -Filter "*.css"

$missing = New-Object System.Collections.Generic.List[object]

function Resolve-RefPath {
  param(
    [string]$Ref,
    [string]$BaseDirectory,
    [string]$RootDirectory
  )

  if ([string]::IsNullOrWhiteSpace($Ref)) { return $null }
  if ($Ref -match '^(https?:|mailto:|tel:|javascript:|data:|#)') { return $null }

  $clean = $Ref.Split('#')[0].Split('?')[0]
  if ([string]::IsNullOrWhiteSpace($clean)) { return $null }

  if ($clean -eq "/") {
    return Join-Path $RootDirectory "index.html"
  }

  if ($clean.StartsWith('/')) {
    $relative = $clean.TrimStart('/')
    $candidate = Join-Path $RootDirectory $relative
  }
  else {
    $candidate = Join-Path $BaseDirectory $clean
  }

  if ($candidate.EndsWith([IO.Path]::DirectorySeparatorChar) -or $candidate.EndsWith("/")) {
    $candidate = Join-Path $candidate "index.html"
  }

  if ((Split-Path $candidate -Leaf) -notmatch '\.') {
    if (Test-Path -LiteralPath $candidate -PathType Container) {
      $candidate = Join-Path $candidate "index.html"
    }
    elseif (-not (Test-Path -LiteralPath $candidate -PathType Leaf)) {
      $candidateWithHtml = "$candidate.html"
      if (Test-Path -LiteralPath $candidateWithHtml -PathType Leaf) {
        $candidate = $candidateWithHtml
      }
    }
  }

  return $candidate
}

function Check-Reference {
  param(
    [string]$SourceFile,
    [string]$Reference,
    [string]$ReferenceType
  )

  $baseDirectory = Split-Path -Parent $SourceFile
  $resolved = Resolve-RefPath -Ref $Reference -BaseDirectory $baseDirectory -RootDirectory $rootPath
  if (-not $resolved) { return }

  if (-not (Test-Path -LiteralPath $resolved -PathType Leaf)) {
    $missing.Add([PSCustomObject]@{
      source = $SourceFile.Replace($rootPath + [IO.Path]::DirectorySeparatorChar, "")
      type = $ReferenceType
      reference = $Reference
      resolved = $resolved.Replace($rootPath + [IO.Path]::DirectorySeparatorChar, "")
    }) | Out-Null
  }
}

foreach ($file in $htmlFiles) {
  $content = Get-Content -LiteralPath $file.FullName -Raw

  [regex]::Matches($content, '(?i)(href|src)\s*=\s*["'']([^"'']+)["'']') | ForEach-Object {
    $attr = $_.Groups[1].Value.ToLowerInvariant()
    $ref = $_.Groups[2].Value
    Check-Reference -SourceFile $file.FullName -Reference $ref -ReferenceType $attr
  }

  [regex]::Matches($content, '(?i)url\(["'']?([^"'')]+)["'']?\)') | ForEach-Object {
    $ref = $_.Groups[1].Value
    Check-Reference -SourceFile $file.FullName -Reference $ref -ReferenceType "css-url"
  }
}

foreach ($file in $cssFiles) {
  $content = Get-Content -LiteralPath $file.FullName -Raw
  [regex]::Matches($content, '(?i)url\(["'']?([^"'')]+)["'']?\)') | ForEach-Object {
    $ref = $_.Groups[1].Value
    Check-Reference -SourceFile $file.FullName -Reference $ref -ReferenceType "css-url"
  }
}

if ($missing.Count -gt 0) {
  Write-Host "Missing local references found:" -ForegroundColor Red
  $missing | Sort-Object source, reference | ForEach-Object {
    Write-Host ("- {0} [{1}] => {2}" -f $_.source, $_.type, $_.reference)
  }
  exit 1
}

Write-Host "No missing local references found." -ForegroundColor Green