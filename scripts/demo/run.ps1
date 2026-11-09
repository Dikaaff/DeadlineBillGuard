param(
    [switch]$SkipBuild,
    [switch]$SkipVoice,
    [switch]$SkipRecord,
    [switch]$SkipEdit
)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$work = Join-Path $root "demo\work"
$out = Join-Path $root "demo\out"
$port = 3100
$base = "http://127.0.0.1:$port"

New-Item -ItemType Directory -Force -Path $work, $out | Out-Null
Push-Location $root

try {
    if (-not $SkipBuild) {
        Write-Host "==> npm run build" -ForegroundColor Cyan
        & npm run build
        if ($LASTEXITCODE -ne 0) { throw "next build failed" }
    }

    if (-not $SkipVoice) {
        Write-Host "==> voiceover + captions" -ForegroundColor Cyan
        & python "scripts\demo\make_voice.py"
        if ($LASTEXITCODE -ne 0) { throw "voice generation failed" }
    }

    if (-not $SkipRecord) {
        Write-Host "==> recording demo" -ForegroundColor Cyan
        & node "scripts\demo\record.mjs"
        if ($LASTEXITCODE -ne 0) { throw "playwright recording failed" }
    }

    if (-not $SkipEdit) {
        Write-Host "==> edit + captions + audio" -ForegroundColor Cyan
        & python "scripts\demo\edit.py"
        if ($LASTEXITCODE -ne 0) { throw "edit failed" }
    }

    Write-Host ""
    Write-Host "Done: demo\out\deadline-bill-guard-demo.mp4" -ForegroundColor Green
} finally {
    Pop-Location
}
