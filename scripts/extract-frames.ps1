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
$MobileSeqDir  = Join-Path $OutDir "MOBILE_SEQUENCE"
$FfmpegDir     = Join-Path $Root "scripts\.ffmpeg"
$FfmpegExe     = Join-Path $FfmpegDir "ffmpeg.exe"
$FfprobeExe    = Join-Path $FfmpegDir "ffprobe.exe"

# Try to find specific mobile video in the MOBILE_SEQUENCE folder
$MobileVideoPath = $VideoPath
$MobileVideoFiles = Get-ChildItem -Path $MobileSeqDir -Filter "*.mp4" | Select-Object -First 1
if ($MobileVideoFiles) {
    $MobileVideoPath = $MobileVideoFiles.FullName
}

Write-Host ""
Write-Host "  Aura Luxe - Hero Frame Extraction" -ForegroundColor Cyan
Write-Host "  ─────────────────────────────────" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Desktop Video: $VideoPath" -ForegroundColor Green
Write-Host "  Mobile Video:  $MobileVideoPath" -ForegroundColor Green

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
Write-Host "  Probing videos..." -ForegroundColor Yellow

# Probe Desktop Video
$DesktopProbeJson = & $FfprobeExe -v quiet -print_format json -show_streams -show_format $VideoPath 2>&1
$DesktopProbe     = $DesktopProbeJson | ConvertFrom-Json
$DesktopVideoStream = $DesktopProbe.streams | Where-Object { $_.codec_type -eq "video" } | Select-Object -First 1
$DesktopRawDuration = if ($DesktopVideoStream.duration) { $DesktopVideoStream.duration } elseif ($DesktopProbe.format.duration) { $DesktopProbe.format.duration } else { "10" }
$DesktopDuration    = [double]$DesktopRawDuration
$DesktopWidth       = [int]$DesktopVideoStream.width
$DesktopHeight      = [int]$DesktopVideoStream.height

# Probe Mobile Video
$MobileProbeJson = & $FfprobeExe -v quiet -print_format json -show_streams -show_format $MobileVideoPath 2>&1
$MobileProbe     = $MobileProbeJson | ConvertFrom-Json
$MobileVideoStream = $MobileProbe.streams | Where-Object { $_.codec_type -eq "video" } | Select-Object -First 1
$MobileRawDuration = if ($MobileVideoStream.duration) { $MobileVideoStream.duration } elseif ($MobileProbe.format.duration) { $MobileProbe.format.duration } else { "10" }
$MobileDuration    = [double]$MobileRawDuration
$MobileWidth       = [int]$MobileVideoStream.width
$MobileHeight      = [int]$MobileVideoStream.height

Write-Host "  Desktop - Duration: $([Math]::Round($DesktopDuration, 2))s  |  Resolution: ${DesktopWidth}x${DesktopHeight}" -ForegroundColor Green
Write-Host "  Mobile  - Duration: $([Math]::Round($MobileDuration, 2))s  |  Resolution: ${MobileWidth}x${MobileHeight}" -ForegroundColor Green

$DesktopFPS  = 24
$MobileFPS   = 24
$MaxWidth    = 1920
$MobileMaxW  = 1080
$DesktopQ    = 2  # JPEG quality scale: 2-31 (2 is high quality)
$MobileQ     = 2  # Matches desktop quality (highest)

$EstDesktop = [Math]::Ceiling($DesktopDuration * $DesktopFPS)
$EstMobile  = [Math]::Ceiling($MobileDuration * $MobileFPS)
Write-Host "  Est. desktop frames: $EstDesktop  |  mobile frames: $EstMobile" -ForegroundColor Cyan

# ─── EXTRACT DESKTOP & MOBILE FRAMES VIA BAT FILE (robust escaping) 
Write-Host ""
Write-Host "  Extracting frames via cmd execution..." -ForegroundColor Yellow

$DesktopScale = if ($DesktopWidth -gt $MaxWidth) { "scale=${MaxWidth}:-2" } else { "scale=${DesktopWidth}:-2" }
$MobileScale  = if ($MobileWidth -gt $MobileMaxW) { "scale=${MobileMaxW}:-2" } else { "scale=${MobileWidth}:-2" }

# Write a temporary .bat file to avoid PowerShell argument parser breaking %04d
$batContent = "@echo off`r`n" +
  "`"$FfmpegExe`" -i `"$VideoPath`" -vf `"${DesktopScale},fps=${DesktopFPS}`" -q:v $DesktopQ `"$DesktopDir\frame%%04d.jpg`" -y 2>nul`r`n" +
  "echo DESKTOP_DONE`r`n" +
  "`"$FfmpegExe`" -i `"$MobileVideoPath`" -vf `"${MobileScale},fps=${MobileFPS}`" -q:v $MobileQ `"$MobileDir\frame%%04d.jpg`" -y 2>nul`r`n" +
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
        duration = [Math]::Round($DesktopDuration, 2)
    }
    desktop     = @{
        totalFrames = $DesktopCount
        fps         = $DesktopFPS
        width       = if ($DesktopWidth -gt $MaxWidth) { $MaxWidth } else { $DesktopWidth }
        height      = if ($DesktopWidth -gt $MaxWidth) { [int]($DesktopHeight * ($MaxWidth / $DesktopWidth)) } else { $DesktopHeight }
        pattern     = "desktop/frame%04d.jpg"
        ext         = "jpg"
    }
    mobile      = @{
        totalFrames = $MobileCount
        fps         = $MobileFPS
        width       = if ($MobileWidth -gt $MobileMaxW) { $MobileMaxW } else { $MobileWidth }
        height      = if ($MobileWidth -gt $MobileMaxW) { [int]($MobileHeight * ($MobileMaxW / $MobileWidth)) } else { $MobileHeight }
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

