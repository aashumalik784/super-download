import { Router } from "express";
import { exec, spawn } from "child_process";
import { promisify } from "util";
import { GetVideoInfoBody, DownloadVideoBody } from "@workspace/api-zod";
import https from "https";
import http from "http";

const execAsync = promisify(exec);
const router = Router();

function detectPlatform(url: string): string {
  if (/youtube\.com|youtu\.be/.test(url)) return "YouTube";
  if (/instagram\.com/.test(url)) return "Instagram";
  if (/tiktok\.com/.test(url)) return "TikTok";
  if (/facebook\.com|fb\.watch/.test(url)) return "Facebook";
  if (/twitter\.com|x\.com/.test(url)) return "Twitter/X";
  if (/reddit\.com/.test(url)) return "Reddit";
  if (/vimeo\.com/.test(url)) return "Vimeo";
  if (/dailymotion\.com/.test(url)) return "Dailymotion";
  return "Unknown";
}

function formatDuration(seconds: number | null): string | null {
  if (!seconds) return null;
  const totalSec = Math.round(seconds);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatFilesize(bytes: number | null): string | null {
  if (!bytes) return null;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatViewCount(count: number | null): string | null {
  if (!count) return null;
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M views`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K views`;
  return `${count} views`;
}

type RawFormat = {
  format_id: string;
  vcodec?: string;
  acodec?: string;
  height?: number;
  ext?: string;
  filesize?: number;
  filesize_approx?: number;
  format_note?: string;
  format?: string;
};

type VideoFormat = {
  formatId: string;
  label: string;
  ext: string;
  quality: string;
  filesize: string | null;
  hasAudio: boolean;
  hasVideo: boolean;
};

function buildFormats(rawFormats: RawFormat[]): VideoFormat[] {
  const formats: VideoFormat[] = [];

  // Try combined (video + audio) formats first
  const seen = new Set<string>();
  const combined = rawFormats
    .filter((f) => f.vcodec && f.vcodec !== "none" && f.acodec && f.acodec !== "none")
    .sort((a, b) => (b.height || 0) - (a.height || 0));

  for (const f of combined) {
    const height = f.height || 0;
    const key = height > 0 ? `${height}p` : (f.format_note || f.ext || "std");
    if (seen.has(key)) continue;
    seen.add(key);
    const label = height > 0 ? `${height}p (${(f.ext || "mp4").toUpperCase()})` : `${(f.ext || "mp4").toUpperCase()}`;
    formats.push({
      formatId: f.format_id,
      label,
      ext: f.ext || "mp4",
      quality: height > 0 ? `${height}p` : "Standard",
      filesize: formatFilesize(f.filesize || f.filesize_approx || null),
      hasAudio: true,
      hasVideo: true,
    });
    if (formats.length >= 6) break;
  }

  // If no combined formats (e.g. Instagram DASH), build merged format strings
  if (formats.length === 0) {
    const videoOnly = rawFormats
      .filter((f) => f.vcodec && f.vcodec !== "none" && (!f.acodec || f.acodec === "none"))
      .sort((a, b) => (b.height || 0) - (a.height || 0));

    const hasAudioStream = rawFormats.some((f) => f.acodec && f.acodec !== "none" && (!f.vcodec || f.vcodec === "none"));

    if (videoOnly.length > 0 && hasAudioStream) {
      // Build quality tiers using bestvideo[height<=Xp]+bestaudio merged formats
      const heights = [...new Set(videoOnly.map((f) => f.height || 0).filter((h) => h > 0))].sort((a, b) => b - a);

      for (const h of heights.slice(0, 5)) {
        formats.push({
          formatId: `bestvideo[height<=${h}]+bestaudio/best[height<=${h}]`,
          label: `${h}p (MP4)`,
          ext: "mp4",
          quality: `${h}p`,
          filesize: null,
          hasAudio: true,
          hasVideo: true,
        });
      }

      // Also add a catch-all best
      if (formats.length === 0) {
        formats.push({
          formatId: "bestvideo+bestaudio/best",
          label: "Best Quality (MP4)",
          ext: "mp4",
          quality: "Best",
          filesize: null,
          hasAudio: true,
          hasVideo: true,
        });
      }
    } else {
      // Fallback: list video-only streams with a warning-less label
      for (const f of videoOnly.slice(0, 4)) {
        const h = f.height || 0;
        formats.push({
          formatId: f.format_id,
          label: h > 0 ? `${h}p (${(f.ext || "mp4").toUpperCase()})` : `${(f.ext || "mp4").toUpperCase()}`,
          ext: f.ext || "mp4",
          quality: h > 0 ? `${h}p` : "Video",
          filesize: formatFilesize(f.filesize || null),
          hasAudio: false,
          hasVideo: true,
        });
      }

      // If still empty, use yt-dlp's automatic best
      if (formats.length === 0) {
        formats.push({
          formatId: "best",
          label: "Best Quality",
          ext: "mp4",
          quality: "Best",
          filesize: null,
          hasAudio: true,
          hasVideo: true,
        });
      }
    }
  }

  // Always append MP3 audio-only
  formats.push({
    formatId: "bestaudio_mp3",
    label: "Audio Only (MP3)",
    ext: "mp3",
    quality: "Audio",
    filesize: null,
    hasAudio: true,
    hasVideo: false,
  });

  return formats;
}

// Proxy thumbnail images through the backend to avoid CORS issues
router.get("/video/thumbnail", async (req, res) => {
  const url = req.query.url as string;
  if (!url) {
    res.status(400).end();
    return;
  }

  const lib = url.startsWith("https") ? https : http;
  lib.get(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; VidGrab/1.0)" } }, (imgRes) => {
    const contentType = imgRes.headers["content-type"] || "image/jpeg";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=3600");
    imgRes.pipe(res);
  }).on("error", () => {
    res.status(502).end();
  });
});

router.post("/video/info", async (req, res) => {
  const parsed = GetVideoInfoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { url } = parsed.data;

  try {
    const { stdout } = await execAsync(
      `yt-dlp --dump-json --no-playlist "${url.replace(/"/g, '\\"')}"`,
      { timeout: 30000 }
    );

    const info = JSON.parse(stdout.trim());
    const formats = buildFormats((info.formats as RawFormat[]) || []);

    res.json({
      title: info.title || "Unknown Title",
      thumbnail: info.thumbnail
        ? `/api/video/thumbnail?url=${encodeURIComponent(info.thumbnail)}`
        : "",
      duration: formatDuration(info.duration || null),
      platform: detectPlatform(url),
      uploader: info.uploader || info.channel || info.creator || "Unknown",
      viewCount: formatViewCount(info.view_count || null),
      formats,
      url,
    });
  } catch (err) {
    req.log.error({ err }, "yt-dlp failed");
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("Unsupported URL")) {
      res.status(400).json({ error: "Unsupported URL. Please provide a valid social media video link." });
    } else if (message.includes("Private video") || message.includes("This video is unavailable")) {
      res.status(400).json({ error: "This video is private or unavailable." });
    } else {
      res.status(500).json({ error: "Failed to fetch video info. Please check the URL and try again." });
    }
  }
});

router.post("/video/download", async (req, res) => {
  const parsed = DownloadVideoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { url, formatId } = parsed.data;

  // MP3 audio: redirect to streaming endpoint
  if (formatId === "bestaudio_mp3") {
    res.json({
      downloadUrl: `/api/video/audio?url=${encodeURIComponent(url)}`,
      filename: "audio.mp3",
      format: "mp3",
    });
    return;
  }

  try {
    const { stdout } = await execAsync(
      `yt-dlp -f "${formatId}" -g --no-playlist "${url.replace(/"/g, '\\"')}"`,
      { timeout: 20000 }
    );
    const downloadUrl = stdout.trim().split("\n")[0];
    res.json({ downloadUrl, filename: "video.mp4", format: formatId });
  } catch {
    try {
      const { stdout } = await execAsync(
        `yt-dlp -f "best" -g --no-playlist "${url.replace(/"/g, '\\"')}"`,
        { timeout: 20000 }
      );
      const downloadUrl = stdout.trim().split("\n")[0];
      res.json({ downloadUrl, filename: "video.mp4", format: "best" });
    } catch (err2) {
      req.log.error({ err: err2 }, "yt-dlp download failed");
      res.status(500).json({ error: "Failed to get download link. The video may be restricted." });
    }
  }
});

// Stream MP3 audio — yt-dlp extracts & converts on the fly
router.get("/video/audio", (req, res) => {
  const url = req.query.url as string;
  if (!url) {
    res.status(400).json({ error: "Missing url parameter" });
    return;
  }

  req.log.info({ url }, "Streaming audio as MP3");

  res.setHeader("Content-Type", "audio/mpeg");
  res.setHeader("Content-Disposition", `attachment; filename="audio.mp3"`);
  res.setHeader("Transfer-Encoding", "chunked");

  const ytdlp = spawn("yt-dlp", [
    "-f", "bestaudio",
    "-x",
    "--audio-format", "mp3",
    "--audio-quality", "0",
    "--no-playlist",
    "-o", "-",
    url,
  ]);

  ytdlp.stdout.pipe(res);

  ytdlp.stderr.on("data", (data: Buffer) => {
    req.log.debug({ stderr: data.toString() }, "yt-dlp stderr");
  });

  ytdlp.on("error", (err) => {
    req.log.error({ err }, "yt-dlp spawn error");
    if (!res.headersSent) res.status(500).json({ error: "Failed to start audio extraction" });
  });

  ytdlp.on("close", (code) => {
    req.log.info({ code }, "yt-dlp audio stream finished");
    if (code !== 0 && !res.headersSent) res.status(500).json({ error: "Audio extraction failed" });
  });

  req.on("close", () => ytdlp.kill("SIGTERM"));
});

export default router;
