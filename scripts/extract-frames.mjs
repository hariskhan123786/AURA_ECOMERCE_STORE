/**
 * extract-frames.mjs
 * 
 * Extracts the hero brand video into WebP image frames for the
 * Apple-style scroll sequence animation.
 *
 * Usage: node scripts/extract-frames.mjs
 */

import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ─── CONFIGURATION ────────────────────────────────────────────────
const INPUT_VIDEO   = path.join(ROOT, 'sequence', 'Luxury_brand_commercial_Auralaxure_202608030726.mp4');
const OUTPUT_DIR    = path.join(ROOT, 'public', 'hero-sequence');
const MANIFEST_PATH = path.join(OUTPUT_DIR, 'manifest.json');

const DESKTOP_FPS     = 24;   // ≈ capture every frame at 24fps
const DESKTOP_QUALITY = 82;   // WebP quality (0-100)
const MAX_WIDTH       = 1920; // downscale if wider

const MOBILE_FPS      = 12;
const MOBILE_QUALITY  = 70;
const MOBILE_MAX_W    = 960;

// ─── HELPERS ──────────────────────────────────────────────────────
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function run(cmd, silent = false) {
  if (!silent) console.log(`  $ ${cmd}`);
  return execSync(cmd, { encoding: 'utf8', stdio: silent ? 'pipe' : 'inherit' });
}

function getVideoDuration(ffprobePath, videoPath) {
  const result = execSync(
    `"${ffprobePath}" -v quiet -print_format json -show_streams "${videoPath}"`,
    { encoding: 'utf8' }
  );
  const info = JSON.parse(result);
  const videoStream = info.streams.find(s => s.codec_type === 'video');
  if (!videoStream) throw new Error('No video stream found');
  const duration = parseFloat(videoStream.duration || info.format?.duration || 0);
  const width    = parseInt(videoStream.width, 10);
  const height   = parseInt(videoStream.height, 10);
  return { duration, width, height, fps: eval(videoStream.r_frame_rate || '24') };
}

// ─── MAIN ─────────────────────────────────────────────────────────
async function main() {
  console.log('\n🎬 Aura Luxe — Hero Frame Extraction\n');

  // 1. Resolve ffmpeg binaries
  let ffmpegPath, ffprobePath;
  try {
    ffmpegPath  = require('ffmpeg-static');
    // ffprobe lives next to ffmpeg
    const ffprobeStatic = require('ffprobe-static');
    ffprobePath = ffprobeStatic.path;
  } catch (e) {
    // ffprobe-static might not be installed; try next to ffmpeg
    ffmpegPath  = require('ffmpeg-static');
    ffprobePath = ffmpegPath.replace('ffmpeg', 'ffprobe');
    if (!fs.existsSync(ffprobePath)) {
      // fallback: use system ffprobe
      ffprobePath = 'ffprobe';
    }
  }

  console.log('✅ ffmpeg:', ffmpegPath);
  console.log('✅ ffprobe:', ffprobePath);

  // 2. Check input video exists
  if (!fs.existsSync(INPUT_VIDEO)) {
    console.error(`\n❌ Video not found at:\n   ${INPUT_VIDEO}\n`);
    process.exit(1);
  }

  // 3. Probe video
  console.log('\n📹 Probing video...');
  let videoInfo;
  try {
    videoInfo = getVideoDuration(ffprobePath, INPUT_VIDEO);
  } catch (e) {
    // Fallback: use ffmpeg to get duration from stderr
    const probe = execSync(`"${ffmpegPath}" -i "${INPUT_VIDEO}" 2>&1`, { encoding: 'utf8' }).catch(() => '');
    const match = (probe + '').match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
    if (match) {
      const dur = parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseFloat(match[3]);
      videoInfo = { duration: dur, width: 1920, height: 1080, fps: 24 };
    } else {
      videoInfo = { duration: 10, width: 1920, height: 1080, fps: 24 };
    }
  }

  const { duration, width, height } = videoInfo;
  console.log(`   Duration: ${duration.toFixed(2)}s  |  Resolution: ${width}×${height}`);

  // 4. Calculate frame counts
  const desktopFrames = Math.ceil(duration * DESKTOP_FPS);
  const mobileFrames  = Math.ceil(duration * MOBILE_FPS);
  console.log(`   Desktop frames: ${desktopFrames} @ ${DESKTOP_FPS}fps`);
  console.log(`   Mobile frames:  ${mobileFrames}  @ ${MOBILE_FPS}fps`);

  // 5. Prepare output dirs
  const desktopDir = path.join(OUTPUT_DIR, 'desktop');
  const mobileDir  = path.join(OUTPUT_DIR, 'mobile');
  ensureDir(desktopDir);
  ensureDir(mobileDir);

  // 6. Extract DESKTOP frames
  console.log('\n🖥️  Extracting desktop frames...');
  const desktopScale = width > MAX_WIDTH ? `scale=${MAX_WIDTH}:-2` : `scale=${width}:-2`;
  const desktopCmd = `"${ffmpegPath}" -i "${INPUT_VIDEO}" -vf "${desktopScale},fps=${DESKTOP_FPS}" -quality ${DESKTOP_QUALITY} -compression_level 4 "${desktopDir}/frame%04d.webp" -y`;
  run(desktopCmd);

  // 7. Extract MOBILE frames  
  console.log('\n📱 Extracting mobile frames...');
  const mobileScale = `scale=${MOBILE_MAX_W}:-2`;
  const mobileCmd = `"${ffmpegPath}" -i "${INPUT_VIDEO}" -vf "${mobileScale},fps=${MOBILE_FPS}" -quality ${MOBILE_QUALITY} -compression_level 6 "${mobileDir}/frame%04d.webp" -y`;
  run(mobileCmd);

  // 8. Count actual extracted frames
  const actualDesktop = fs.readdirSync(desktopDir).filter(f => f.endsWith('.webp')).length;
  const actualMobile  = fs.readdirSync(mobileDir).filter(f => f.endsWith('.webp')).length;
  console.log(`\n✅ Desktop frames extracted: ${actualDesktop}`);
  console.log(`✅ Mobile frames extracted:  ${actualMobile}`);

  // 9. Calculate output size
  function getDirSize(dir) {
    return fs.readdirSync(dir).reduce((total, file) => {
      return total + fs.statSync(path.join(dir, file)).size;
    }, 0);
  }
  const desktopMB = (getDirSize(desktopDir) / 1024 / 1024).toFixed(1);
  const mobileMB  = (getDirSize(mobileDir)  / 1024 / 1024).toFixed(1);
  console.log(`   Desktop total: ${desktopMB} MB`);
  console.log(`   Mobile total:  ${mobileMB} MB`);

  // 10. Write manifest
  const manifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    video: {
      source: 'Luxury_brand_commercial_Auralaxure_202608030726.mp4',
      duration: Math.round(duration * 100) / 100,
    },
    desktop: {
      totalFrames: actualDesktop,
      fps: DESKTOP_FPS,
      width: width > MAX_WIDTH ? MAX_WIDTH : width,
      pattern: 'desktop/frame%04d.webp',
    },
    mobile: {
      totalFrames: actualMobile,
      fps: MOBILE_FPS,
      width: MOBILE_MAX_W,
      pattern: 'mobile/frame%04d.webp',
    },
  };

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`\n📋 Manifest written: ${MANIFEST_PATH}`);
  console.log('\n🎉 Frame extraction complete!\n');
  console.log('   Output directory: public/hero-sequence/');
  console.log('   ├─ desktop/  (high quality for desktop/tablet)');
  console.log('   ├─ mobile/   (optimized for phones)');
  console.log('   └─ manifest.json\n');
}

main().catch(err => {
  console.error('\n❌ Extraction failed:', err.message);
  process.exit(1);
});
