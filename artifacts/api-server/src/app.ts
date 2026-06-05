import { Router } from "express";
import { exec as execCb } from "child_process";
import { promisify } from "util";
import { spawn } from "child_process";

const execAsync = promisify(execCb);
const router = Router();

router.post("/video/info", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL required" });

    const { stdout } = await execAsync(
      `python3 -m yt_dlp --dump-json --no-playlist "${url.replace(/"/g, '\\"')}"`,
      { timeout: 30000 }
    );

    const data = JSON.parse(stdout);
    res.json({
      title: data.title,
      thumbnail: data.thumbnail,
      duration: data.duration,
      uploader: data.uploader,
      formats: data.formats?.map((f: any) => ({
        format_id: f.format_id,
        ext: f.ext,
        resolution: f.resolution || `${f.height}p`,
        filesize: f.filesize,
        vcodec: f.vcodec,
        acodec: f.acodec,
        url: f.url
      }))
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/video/download", async (req, res) => {
  try {
    const { url, formatId } = req.body;
    if (!url) return res.status(400).json({ error: "URL required" });

    const format = formatId || "best";
    
    const ytdlp = spawn("python3", [
      "-m", "yt_dlp",
      "-f", format,
      "-g",
      "--no-playlist",
      url
    ]);

    let output = "";
    ytdlp.stdout.on("data", (data) => {
      output += data.toString();
    });

    ytdlp.on("close", async (code) => {
      if (code !== 0) {
        try {
          const { stdout } = await execAsync(
            `python3 -m yt_dlp -f "best" -g --no-playlist "${url.replace(/"/g, '\\"')}"`,
            { timeout: 30000 }
          );
          return res.json({ url: stdout.trim() });
        } catch (e: any) {
          return res.status(500).json({ error: e.message });
        }
      }
      res.json({ url: output.trim() });
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
