# extract-frames.ps1
# Fallback frame extraction script using a portable FFmpeg download.
# Run with: powershell -ExecutionPolicy Bypass -File scripts/extract-frames.ps1

$ErrorActionPreference = "Stop"

# ─── PATHS ────────────────────────────────────────────────────────
$Root      = Split-Path $PSScriptRoot -Parent
$VideoPath = ""
# Try to find any mp4 file in the sequence directory
$VideoFiles = Get-ChildItem -Path (Join-Path $Root "sequence") -Filter "*.mp4" | Select-Object -First 1
if ($VideoFiles) { 
    $VideoPath = $VideoFiles.FullName 
} else {
    Write-Host "  ERROR: No .mp4 video found in sequence folder!" -ForegroundColor Red
    exit 1
}

$OutDir        = Join-Path $Root "public\hero-sequence"
$DesktopDir    = Join-Path $OutDir "desktop"
$MobileDir     = Join-Path $OutDir "mobile"
$FfmpegDir     = Join-Path $Root "scripts\.ffmpeg"
$FfmpegExe     = Join-Path $FfmpegDir "ffmpeg.exe"
$FfprobeExe    = Join-Path $FfmpegDir "ffprobe.exe"

Write-Host ""
Write-Host "  Aura Luxe - Hero Frame Extraction" -ForegroundColor Cyan
Write-Host "  ─────────────────────────────────" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Detected Video: $VideoPath" -ForegroundColor Green

# ─── CHECK / DOWNLOAD FFMPEG ──────────────────────────────────────
if (-not (Test-Path $FfmpegExe)) {
    Write-Host ""
    Write-Host "  Downloading portable FFmpeg..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Force -Path $FfmpegDir | Out-Null

    # Download ffmpeg essentials build
    $ZipUrl  = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"
    $ZipPath = Join-Path $FfmpegDir "ffmpeg.zip"

    try {
        $ProgressPreference = 'SilentlyContinue'
        Invoke-WebRequest -Uri $ZipUrl -OutFile $ZipPath -UseBasicParsing
        Write-Host "  Download complete. Extracting..." -ForegroundColor Green

        Add-Type -AssemblyName System.IO.Compression.FileSystem
        $zip = [System.IO.Compression.ZipFile]::OpenRead($ZipPath)

        # Find ffmpeg.exe and ffprobe.exe inside the zip
        foreach ($entry in $zip.Entries) {
            if ($entry.Name -eq "ffmpeg.exe" -or $entry.Name -eq "ffprobe.exe") {
                $destPath = Join-Path $FfmpegDir $entry.Name
                [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $destPath, $true)
                Write-Host "  Extracted: $($entry.Name)" -ForegroundColor Green
            }
        }
        $zip.Dispose()
        Remove-Item $ZipPath -Force
    } catch {
        Write-Host "  ERROR: Could not download FFmpeg: $_" -ForegroundColor Red
        Write-Host "  Please install FFmpeg manually and add to PATH, then re-run." -ForegroundColor Yellow
        exit 1
    }
}

if (-not (Test-Path $FfmpegExe)) {
    Write-Host "  ERROR: FFmpeg binary not found at $FfmpegExe" -ForegroundColor Red
    exit 1
}
Write-Host "  FFmpeg: $FfmpegExe" -ForegroundColor Green

# ─── CREATE / CLEAN OUTPUT DIRS ───────────────────────────────────
if (Test-Path $DesktopDir) {
    Remove-Item (Join-Path $DesktopDir "*") -Force -ErrorAction SilentlyContinue
} else {
    New-Item -ItemType Directory -Force -Path $DesktopDir | Out-Null
}

if (Test-Path $MobileDir) {
    Remove-Item (Join-Path $MobileDir "*") -Force -ErrorAction SilentlyContinue
} else {
    New-Item -ItemType Directory -Force -Path $MobileDir | Out-Null
}

# ─── PROBE VIDEO ──────────────────────────────────────────────────
Write-Host ""
Write-Host "  Probing video..." -ForegroundColor Yellow

$ProbeJson = & $FfprobeExe -v quiet -print_format json -show_streams -show_format $VideoPath 2>&1
$Probe     = $ProbeJson | ConvertFrom-Json

$VideoStream = $Probe.streams | Where-Object { $_.codec_type -eq "video" } | Select-Object -First 1
$RawDuration = if ($VideoStream.duration) { $VideoStream.duration } elseif ($Probe.format.duration) { $Probe.format.duration } else { "10" }
$Duration    = [double]$RawDuration
$Width       = [int]$VideoStream.width
$Height      = [int]$VideoStream.height

Write-Host "  Duration: $([Math]::Round($Duration, 2))s  |  Resolution: ${Width}x${Height}" -ForegroundColor Green

$DesktopFPS  = 24
$MobileFPS   = 12
$MaxWidth    = 1920
$MobileMaxW  = 960
$DesktopQ    = 2  # JPEG quality scale: 2-31 (2 is high quality)
$MobileQ     = 4  # JPEG quality scale: 4 is medium-high quality

$EstDesktop = [Math]::Ceiling($Duration * $DesktopFPS)
$EstMobile  = [Math]::Ceiling($Duration * $MobileFPS)
Write-Host "  Est. desktop frames: $EstDesktop  |  mobile frames: $EstMobile" -ForegroundColor Cyan

# ─── EXTRACT DESKTOP & MOBILE FRAMES VIA BAT FILE (robust escaping) 
Write-Host ""
Write-Host "  Extracting frames via cmd execution..." -ForegroundColor Yellow

$Scale = if ($Width -gt $MaxWidth) { "scale=${MaxWidth}:-2" } else { "scale=${Width}:-2" }

# Write a temporary .bat file to avoid PowerShell argument parser breaking %04d
$batContent = "@echo off`r`n" +
  "`"$FfmpegExe`" -i `"$VideoPath`" -vf `"${Scale},fps=${DesktopFPS}`" -q:v $DesktopQ `"$DesktopDir\frame%%04d.jpg`" -y 2>nul`r`n" +
  "echo DESKTOP_DONE`r`n" +
  "`"$FfmpegExe`" -i `"$VideoPath`" -vf `"scale=${MobileMaxW}:-2,fps=${MobileFPS}`" -q:v $MobileQ `"$MobileDir\frame%%04d.jpg`" -y 2>nul`r`n" +
  "echo MOBILE_DONE`r`n"

$batPath = Join-Path $PSScriptRoot ".temp_extract.bat"
[System.IO.File]::WriteAllText($batPath, $batContent, [System.Text.Encoding]::ASCII)

# Run the batch file
cmd /c $batPath

# Clean up bat file
Remove-Item $batPath -Force -ErrorAction SilentlyContinue

# Count actual files
$DesktopCount = (Get-ChildItem $DesktopDir -Filter "*.jpg").Count
Write-Host "  Desktop frames: $DesktopCount" -ForegroundColor Green

$MobileCount = (Get-ChildItem $MobileDir -Filter "*.jpg").Count
Write-Host "  Mobile frames: $MobileCount" -ForegroundColor Green

# ─── WRITE MANIFEST ───────────────────────────────────────────────
$Manifest = @{
    version     = 1
    generatedAt = (Get-Date -Format "o")
    video       = @{
        source   = (Split-Path $VideoPath -Leaf)
        duration = [Math]::Round($Duration, 2)
    }
    desktop     = @{
        totalFrames = $DesktopCount
        fps         = $DesktopFPS
        width       = if ($Width -gt $MaxWidth) { $MaxWidth } else { $Width }
        height      = $Height
        pattern     = "desktop/frame%04d.jpg"
        ext         = "jpg"
    }
    mobile      = @{
        totalFrames = $MobileCount
        fps         = $MobileFPS
        width       = $MobileMaxW
        height      = [int]($Height * ($MobileMaxW / $Width))
        pattern     = "mobile/frame%04d.jpg"
        ext         = "jpg"
    }
}

$ManifestPath = Join-Path $OutDir "manifest.json"
$Manifest | ConvertTo-Json -Depth 5 | Set-Content $ManifestPath -Encoding UTF8
Write-Host ""
Write-Host "  Manifest written: $ManifestPath" -ForegroundColor Green

# ─── SIZE REPORT ──────────────────────────────────────────────────
$DesktopMB = [Math]::Round((Get-ChildItem $DesktopDir | Measure-Object Length -Sum).Sum / 1MB, 1)
$MobileMB  = [Math]::Round((Get-ChildItem $MobileDir  | Measure-Object Length -Sum).Sum / 1MB, 1)
Write-Host ""
Write-Host "  Desktop: $DesktopCount frames, ${DesktopMB} MB" -ForegroundColor Cyan
Write-Host "  Mobile:  $MobileCount frames, ${MobileMB} MB"   -ForegroundColor Cyan
Write-Host ""
Write-Host "  Frame extraction complete!" -ForegroundColor Green
Write-Host "  Output: public/hero-sequence/" -ForegroundColor DarkGray
Write-Host ""

