import { useState, useCallback } from "react";
import { getVideoInfo, downloadVideo, VideoInfo } from "@workspace/api-client-react";
import { getPlatformInfo } from "@/lib/platform";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Loader2, Download, Music, Trash2, Plus, CheckCircle,
  AlertCircle, Clock, ListVideo, X
} from "lucide-react";

type QueueStatus = "idle" | "fetching" | "ready" | "downloading" | "done" | "error";

interface QueueItem {
  id: string;
  url: string;
  status: QueueStatus;
  videoInfo?: VideoInfo;
  selectedFormatId: string;
  error?: string;
}

function statusBadge(status: QueueStatus) {
  switch (status) {
    case "idle":
      return <Badge variant="outline" className="text-xs gap-1"><Clock className="w-3 h-3" /> Queued</Badge>;
    case "fetching":
      return <Badge variant="outline" className="text-xs gap-1 border-primary/50 text-primary"><Loader2 className="w-3 h-3 animate-spin" /> Fetching...</Badge>;
    case "ready":
      return <Badge variant="outline" className="text-xs gap-1 border-green-500/50 text-green-400"><CheckCircle className="w-3 h-3" /> Ready</Badge>;
    case "downloading":
      return <Badge variant="outline" className="text-xs gap-1 border-primary/50 text-primary"><Loader2 className="w-3 h-3 animate-spin" /> Downloading...</Badge>;
    case "done":
      return <Badge variant="outline" className="text-xs gap-1 border-green-500/50 text-green-400"><CheckCircle className="w-3 h-3" /> Done</Badge>;
    case "error":
      return <Badge variant="outline" className="text-xs gap-1 border-destructive/50 text-destructive"><AlertCircle className="w-3 h-3" /> Failed</Badge>;
  }
}

export default function Bulk() {
  const [rawInput, setRawInput] = useState("");
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [defaultFormat, setDefaultFormat] = useState<"best" | "720p" | "480p" | "mp3">("best");
  const [isFetchingAll, setIsFetchingAll] = useState(false);
  const { toast } = useToast();

  const parseUrls = (text: string): string[] => {
    return text
      .split(/[\n,]+/)
      .map((u) => u.trim())
      .filter((u) => u.startsWith("http"));
  };

  const addToQueue = () => {
    const urls = parseUrls(rawInput);
    if (urls.length === 0) {
      toast({ variant: "destructive", title: "No valid URLs found", description: "Paste at least one valid http/https URL." });
      return;
    }
    const newItems: QueueItem[] = urls
      .filter((url) => !queue.some((q) => q.url === url))
      .map((url) => ({
        id: `${Date.now()}-${Math.random()}`,
        url,
        status: "idle" as QueueStatus,
        selectedFormatId: "",
      }));
    if (newItems.length === 0) {
      toast({ title: "Already in queue", description: "All pasted URLs are already queued." });
      return;
    }
    setQueue((prev) => [...prev, ...newItems]);
    setRawInput("");
    toast({ title: `${newItems.length} URL(s) added`, description: "Click 'Fetch All' to load video info." });
  };

  const removeItem = (id: string) => {
    setQueue((prev) => prev.filter((i) => i.id !== id));
  };

  const clearQueue = () => setQueue([]);

  const updateItem = useCallback((id: string, patch: Partial<QueueItem>) => {
    setQueue((prev) => prev.map((item) => item.id === id ? { ...item, ...patch } : item));
  }, []);

  const pickBestFormat = (formats: VideoInfo["formats"], pref: typeof defaultFormat): string => {
    if (pref === "mp3") return "bestaudio_mp3";
    if (pref === "best") {
      const f = formats.find((f) => f.hasVideo && f.hasAudio);
      return f?.formatId ?? formats[0]?.formatId ?? "best";
    }
    const targetHeight = pref === "720p" ? 720 : 480;
    const closest = formats
      .filter((f) => f.hasVideo)
      .sort((a, b) => {
        const aH = parseInt(a.quality) || 0;
        const bH = parseInt(b.quality) || 0;
        return Math.abs(aH - targetHeight) - Math.abs(bH - targetHeight);
      });
    return closest[0]?.formatId ?? formats[0]?.formatId ?? "best";
  };

  const fetchOne = useCallback(async (item: QueueItem): Promise<void> => {
    updateItem(item.id, { status: "fetching", error: undefined });
    try {
      const data = await getVideoInfo({ url: item.url });
      const formatId = pickBestFormat(data.formats, defaultFormat);
      updateItem(item.id, { status: "ready", videoInfo: data, selectedFormatId: formatId });
    } catch {
      updateItem(item.id, { status: "error", error: "Failed to fetch video info." });
    }
  }, [updateItem, defaultFormat]);

  const fetchAll = async () => {
    const toFetch = queue.filter((i) => i.status === "idle" || i.status === "error");
    if (toFetch.length === 0) {
      toast({ title: "Nothing to fetch", description: "All queued URLs are already fetched or ready." });
      return;
    }
    setIsFetchingAll(true);
    // Fetch up to 3 concurrently
    const chunks: QueueItem[][] = [];
    for (let i = 0; i < toFetch.length; i += 3) chunks.push(toFetch.slice(i, i + 3));
    for (const chunk of chunks) {
      await Promise.all(chunk.map(fetchOne));
    }
    setIsFetchingAll(false);
    toast({ title: "All videos fetched!", description: "You can now download them individually or all at once." });
  };

  const downloadOne = async (item: QueueItem, formatId?: string) => {
    const fmtId = formatId ?? item.selectedFormatId;
    if (!fmtId || !item.videoInfo) return;

    if (fmtId === "bestaudio_mp3") {
      const a = document.createElement("a");
      a.href = `/api/video/audio?url=${encodeURIComponent(item.url)}`;
      a.download = "audio.mp3";
      a.click();
      updateItem(item.id, { status: "done" });
      return;
    }

    updateItem(item.id, { status: "downloading" });
    try {
      const result = await downloadVideo({ url: item.url, formatId: fmtId });
      window.open(result.downloadUrl, "_blank");
      updateItem(item.id, { status: "done" });
    } catch {
      updateItem(item.id, { status: "error", error: "Download failed." });
    }
  };

  const downloadAll = async () => {
    const ready = queue.filter((i) => i.status === "ready");
    if (ready.length === 0) {
      toast({ title: "No videos ready", description: "Fetch video info first." });
      return;
    }
    for (const item of ready) {
      await downloadOne(item);
      // Small delay to avoid overwhelming the server
      await new Promise((r) => setTimeout(r, 500));
    }
  };

  const readyCount = queue.filter((i) => i.status === "ready").length;
  const doneCount = queue.filter((i) => i.status === "done").length;
  const errorCount = queue.filter((i) => i.status === "error").length;
  const idleCount = queue.filter((i) => i.status === "idle").length;

  return (
    <div className="space-y-8 py-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <ListVideo className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold">Bulk Download</h1>
            <p className="text-muted-foreground text-sm">Paste multiple URLs and download them all at once</p>
          </div>
        </div>
      </div>

      {/* URL Input Card */}
      <Card className="p-6 space-y-4 border-border/60">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Paste URLs (one per line)</label>
          <Textarea
            placeholder={"https://youtube.com/watch?v=...\nhttps://instagram.com/p/...\nhttps://tiktok.com/@user/video/..."}
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            className="min-h-[120px] font-mono text-sm resize-none bg-muted/30 border-border/50 focus-visible:ring-primary/30"
            data-testid="textarea-urls"
          />
          <p className="text-xs text-muted-foreground">Supports YouTube, Instagram, TikTok, Facebook, Twitter/X, Reddit, Vimeo, and 1000+ more sites.</p>
        </div>

        {/* Default format selector */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Default quality:</span>
          {(["best", "720p", "480p", "mp3"] as const).map((opt) => (
            <Button
              key={opt}
              size="sm"
              variant={defaultFormat === opt ? "default" : "outline"}
              onClick={() => setDefaultFormat(opt)}
              className="h-8 text-xs font-semibold"
              data-testid={`btn-default-format-${opt}`}
            >
              {opt === "mp3" ? <><Music className="w-3 h-3 mr-1" />MP3</> : opt === "best" ? "Best Available" : opt}
            </Button>
          ))}
        </div>

        <div className="flex gap-3">
          <Button
            onClick={addToQueue}
            disabled={!rawInput.trim()}
            className="gap-2"
            data-testid="btn-add-queue"
          >
            <Plus className="w-4 h-4" /> Add to Queue
          </Button>
        </div>
      </Card>

      {/* Queue controls */}
      {queue.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-muted-foreground font-medium">{queue.length} in queue</span>
            {readyCount > 0 && <span className="text-xs text-green-400">{readyCount} ready</span>}
            {doneCount > 0 && <span className="text-xs text-green-500">{doneCount} done</span>}
            {errorCount > 0 && <span className="text-xs text-destructive">{errorCount} failed</span>}
            {idleCount > 0 && <span className="text-xs text-muted-foreground">{idleCount} pending</span>}
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAll}
              disabled={isFetchingAll || queue.every((i) => i.status === "ready" || i.status === "done")}
              className="gap-2"
              data-testid="btn-fetch-all"
            >
              {isFetchingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Fetch All
            </Button>
            {readyCount > 0 && (
              <Button
                size="sm"
                onClick={downloadAll}
                className="gap-2"
                data-testid="btn-download-all"
              >
                <Download className="w-4 h-4" /> Download All ({readyCount})
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={clearQueue}
              className="gap-2 text-destructive border-destructive/30 hover:border-destructive/60 hover:bg-destructive/5"
              data-testid="btn-clear-queue"
            >
              <Trash2 className="w-4 h-4" /> Clear
            </Button>
          </div>
        </div>
      )}

      {/* Queue items */}
      {queue.length > 0 && (
        <div className="space-y-3" data-testid="container-queue">
          {queue.map((item) => {
            const platformInfo = getPlatformInfo(item.url);
            const PlatformIcon = platformInfo.icon;
            const videoFormats = item.videoInfo?.formats.filter((f) => f.hasVideo) ?? [];
            const audioFmt = item.videoInfo?.formats.find((f) => f.formatId === "bestaudio_mp3");

            return (
              <Card
                key={item.id}
                className={`p-4 border transition-colors ${
                  item.status === "done" ? "border-green-500/20 bg-green-500/5" :
                  item.status === "error" ? "border-destructive/20 bg-destructive/5" :
                  item.status === "ready" ? "border-primary/20" :
                  "border-border/50"
                }`}
                data-testid={`queue-item-${item.id}`}
              >
                <div className="flex items-start gap-4">
                  {/* Thumbnail or icon */}
                  <div className="shrink-0 w-16 h-12 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                    {item.videoInfo?.thumbnail ? (
                      <img src={item.videoInfo.thumbnail} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <PlatformIcon className={`w-6 h-6 ${platformInfo.color}`} />
                    )}
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm line-clamp-1 text-foreground" data-testid={`text-title-${item.id}`}>
                          {item.videoInfo?.title ?? item.url}
                        </p>
                        {item.videoInfo && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.videoInfo.uploader} · {item.videoInfo.platform}
                            {item.videoInfo.duration && ` · ${item.videoInfo.duration}`}
                          </p>
                        )}
                        {!item.videoInfo && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{item.url}</p>
                        )}
                        {item.error && (
                          <p className="text-xs text-destructive mt-0.5">{item.error}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {statusBadge(item.status)}
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-muted-foreground hover:text-foreground transition-colors p-1"
                          data-testid={`btn-remove-${item.id}`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Format selector + actions (only when ready) */}
                    {item.status === "ready" && item.videoInfo && (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <select
                          value={item.selectedFormatId}
                          onChange={(e) => updateItem(item.id, { selectedFormatId: e.target.value })}
                          className="h-8 text-xs rounded-md border border-border bg-muted/50 px-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          data-testid={`select-format-${item.id}`}
                        >
                          {videoFormats.map((f) => (
                            <option key={f.formatId} value={f.formatId}>{f.label}</option>
                          ))}
                          {audioFmt && <option value="bestaudio_mp3">Audio Only (MP3)</option>}
                        </select>
                        <Button
                          size="sm"
                          className="h-8 text-xs gap-1.5 font-semibold"
                          onClick={() => downloadOne(item)}
                          data-testid={`btn-download-${item.id}`}
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download
                        </Button>
                        {audioFmt && item.selectedFormatId !== "bestaudio_mp3" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
                            onClick={() => downloadOne(item, "bestaudio_mp3")}
                            data-testid={`btn-mp3-${item.id}`}
                          >
                            <Music className="w-3.5 h-3.5" /> MP3
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {queue.length === 0 && (
        <div className="text-center py-20 space-y-4 text-muted-foreground">
          <ListVideo className="w-12 h-12 mx-auto opacity-30" />
          <div>
            <p className="font-medium text-foreground">Your queue is empty</p>
            <p className="text-sm mt-1">Paste some URLs above and click "Add to Queue" to get started.</p>
          </div>
        </div>
      )}
    </div>
  );
}
