import { Router } from "express";
import { exec, spawn } from "child_process";
import { promisify } from "util";
import { GetVideoInfoBody, DownloadVideoBody } from "@workspace/api-zod";

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
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
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

router.post("/video/info", async (req, res) => {
  const parsed = GetVideoInfoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { url } = parsed.data;

  try {
    const { stdout } = await execAsync(
      `yt-dlp --dump-json --no-playlist --flat-playlist "${url.replace(/"/g, '\\"')}"`,
      { timeout: 30000 }
    );

    const info = JSON.parse(stdout.trim());

    const formats: Array<{
      formatId: string;
      label: string;
      ext: string;
      quality: string;
      filesize: string | null;
      hasAudio: boolean;
      hasVideo: boolean;
    }> = [];

    if (info.formats && Array.isArray(info.formats)) {
      const seen = new Set<string>();

      const combined = info.formats
        .filter((f: { vcodec?: string; acodec?: string; height?: number; ext?: string }) =>
          f.vcodec && f.vcodec !== "none" && f.acodec && f.acodec !== "none"
        )
        .sort((a: { height?: number }, b: { height?: number }) => (b.height || 0) - (a.height || 0));

      for (const f of combined) {
        const height = f.height || 0;
        const label = height > 0 ? `${height}p (${(f.ext || "mp4").toUpperCase()})` : `${(f.ext || "mp4").toUpperCase()}`;
        if (seen.has(label)) continue;
        seen.add(label);
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

      if (formats.length === 0) {
        const bestFormats = info.formats
          .filter((f: { vcodec?: string }) => f.vcodec && f.vcodec !== "none")
          .slice(0, 4);

        for (const f of bestFormats) {
          formats.push({
            formatId: f.format_id,
            label: `${f.format_note || f.format || "Video"} (${(f.ext || "mp4").toUpperCase()})`,
            ext: f.ext || "mp4",
            quality: f.format_note || "Video",
            filesize: formatFilesize(f.filesize || null),
            hasAudio: f.acodec !== "none",
            hasVideo: true,
          });
        }
      }
    }

    if (formats.length === 0) {
      formats.push({
        formatId: "best",
        label: "Best Quality (MP4)",
        ext: "mp4",
        quality: "Best",
        filesize: null,
        hasAudio: true,
        hasVideo: true,
      });
    }

    // Always add MP3 audio-only option at the end
    formats.push({
      formatId: "bestaudio_mp3",
      label: "Audio Only (MP3)",
      ext: "mp3",
      quality: "Audio",
      filesize: null,
      hasAudio: true,
      hasVideo: false,
    });

    res.json({
      title: info.title || "Unknown Title",
      thumbnail: info.thumbnail || "",
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

  // For MP3, redirect to the audio streaming endpoint
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

    res.json({
      downloadUrl,
      filename: "video.mp4",
      format: formatId,
    });
  } catch {
    try {
      const { stdout } = await execAsync(
        `yt-dlp -f "best" -g --no-playlist "${url.replace(/"/g, '\\"')}"`,
        { timeout: 20000 }
      );
      const downloadUrl = stdout.trim().split("\n")[0];
      res.json({
        downloadUrl,
        filename: "video.mp4",
        format: "best",
      });
    } catch (err2) {
      req.log.error({ err: err2 }, "yt-dlp download failed");
      res.status(500).json({ error: "Failed to get download link. The video may be restricted." });
    }
  }
});

// Stream MP3 audio directly — yt-dlp extracts & converts on the fly
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
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to start audio extraction" });
    }
  });

  ytdlp.on("close", (code) => {
    req.log.info({ code }, "yt-dlp audio stream finished");
    if (code !== 0 && !res.headersSent) {
      res.status(500).json({ error: "Audio extraction failed" });
    }
  });

  req.on("close", () => {
    ytdlp.kill("SIGTERM");
  });
});

export default router;
