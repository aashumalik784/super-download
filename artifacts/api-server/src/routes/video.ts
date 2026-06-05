import { Router } from "express";
import { exec as execCb } from "child_process";
import { promisify } from "util";
import { spawn } from "child_process";

const execAsync = promisify(execCb);
const router = Router();

router.post("/video/info", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL required" });
    }

    const { stdout } = await execAsync(
      `python -m yt_dlp --dump-json --no-playlist --extractor-args "youtube:player_client=ios" --user-agent "com.google.ios.youtube/19.29.1 (iPhone14,3; U; CPU iOS 17_5 like Mac OS X)" "${url.replace(/"/g, '\\"')}"`,
      { timeout: 30000 }
    );

    const data = JSON.parse(stdout);
    return res.json({
      title: data.title,
      thumbnail: data.thumbnail,
      duration: data.duration,
      uploader: data.uploader,
      formats: data.formats?.map((f: any) => ({
        format_id: f.format_id,
        ext: f.ext,
        resolution: f.resolution || (f.height ? `${f.height}p` : 'audio'),
        filesize: f.filesize,
        vcodec: f.vcodec,
        acodec: f.acodec,
        url: f.url
      }))
    });
  } catch (error: any) {
    console.error("YT-DLP Error:", error.message);
    console.error("YT-DLP Stderr:", error.stderr);
    return res.status(500).json({ 
      error: "Failed to fetch video. YouTube blocked the request.",
      details: error.stderr || error.message
    });
  }
});

router.post("/video/download", async (req, res) => {
  try {
    const { url, formatId } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL required" });
    }

    const format = formatId || "best";
    
    const ytdlp = spawn("python", [
      "-m", "yt_dlp",
      "-f", format,
      "-g",
      "--no-playlist",
      "--extractor-args", "youtube:player_client=ios",
      "--user-agent", "com.google.ios.youtube/19.29.1 (iPhone14,3; U; CPU iOS 17_5 like Mac OS X)",
      url
    ]);

    let output = "";
    let errorOutput = "";
    
    ytdlp.stdout.on("data", (data) => {
      output += data.toString();
    });

    ytdlp.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    ytdlp.on("close", async (code) => {
      if (code !== 0) {
        console.error("YT-DLP Download Error:", errorOutput);
        try {
          const { stdout } = await execAsync(
            `python -m yt_dlp -f "best" -g --no-playlist --extractor-args "youtube:player_client=ios" --user-agent "com.google.ios.youtube/19.29.1 (iPhone14,3; U; CPU iOS 17_5 like Mac OS X)" "${url.replace(/"/g, '\\"')}"`,
            { timeout: 30000 }
          );
          return res.json({ url: stdout.trim() });
        } catch (e: any) {
          return res.status(500).json({ 
            error: "Download failed",
            details: e.stderr || e.message 
          });
        }
      }
      return res.json({ url: output.trim() });
    });
  } catch (error: any) {
    console.error("Server Error:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
