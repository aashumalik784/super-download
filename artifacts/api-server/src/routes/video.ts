router.post("/video/info", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL required" });

    const { stdout } = await execAsync(
      `python3 -m yt_dlp --dump-json --no-playlist --extractor-args "youtube:player_client=android,web" --user-agent "com.google.android.youtube/17.31.35 (Linux; U; Android 11) gzip" "${url.replace(/"/g, '\\"')}"`,
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
        resolution: f.resolution || (f.height ? `${f.height}p` : 'audio'),
        filesize: f.filesize,
        vcodec: f.vcodec,
        acodec: f.acodec,
        url: f.url
      }))
    });
  } catch (error: any) {
    console.error("YT-DLP Error:", error.message);
    res.status(500).json({ error: "Failed to fetch video. YouTube blocked the request." });
  }
});
