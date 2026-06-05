import { useState, useEffect } from "react";
import { useGetVideoInfo, useDownloadVideo, VideoInfo } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useHistory } from "@/hooks/use-history";
import { getPlatformInfo } from "@/lib/platform";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Download, Loader2, Clock, Eye, AlertCircle,
  CheckCircle, HardDrive, RefreshCw, Music
} from "lucide-react";
import { SiYoutube, SiInstagram, SiTiktok, SiFacebook, SiX, SiReddit, SiVimeo } from "react-icons/si";

export default function Home() {
  const [url, setUrl] = useState("");
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [selectedFormatId, setSelectedFormatId] = useState<string>("");
  const [isAudioDownloading, setIsAudioDownloading] = useState(false);
  const { toast } = useToast();
  const { addHistory } = useHistory();

  const getInfo = useGetVideoInfo();
  const downloadVideo = useDownloadVideo();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryUrl = params.get("url");
    if (queryUrl) {
      setUrl(queryUrl);
      fetchInfo(queryUrl);
      window.history.replaceState({}, "", "/");
    }
  }, []);

  const fetchInfo = (targetUrl: string) => {
    if (!targetUrl.trim()) return;
    setVideoInfo(null);
    setSelectedFormatId("");

    getInfo.mutate({ data: { url: targetUrl } }, {
      onSuccess: (data) => {
        setVideoInfo(data);
        // Auto-select first video format (not the MP3 one)
        const firstVideo = data.formats.find((f) => f.hasVideo);
        if (firstVideo) setSelectedFormatId(firstVideo.formatId);
        addHistory(data);
      },
      onError: (err) => {
        toast({
          variant: "destructive",
          title: "Failed to fetch video",
          description: err.error || "Please check the URL and try again.",
        });
      },
    });
  };

  const handleFetch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInfo(url);
  };

  const handleDownload = () => {
    if (!url || !selectedFormatId) return;

    // If user selected the MP3 format, use the direct audio streaming URL
    if (selectedFormatId === "bestaudio_mp3") {
      handleMp3Download();
      return;
    }

    downloadVideo.mutate({ data: { url, formatId: selectedFormatId } }, {
      onSuccess: (data) => {
        toast({ title: "Download Started", description: `Opening download for ${data.filename}` });
        window.open(data.downloadUrl, "_blank");
      },
      onError: (err) => {
        toast({
          variant: "destructive",
          title: "Download Failed",
          description: err.error || "An error occurred while downloading.",
        });
      },
    });
  };

  const handleMp3Download = () => {
    if (!url) return;
    setIsAudioDownloading(true);
    toast({ title: "Preparing MP3", description: "Extracting audio... this may take a moment." });
    // Direct stream download — browser handles it
    const audioUrl = `/api/video/audio?url=${encodeURIComponent(url)}`;
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = "audio.mp3";
    a.click();
    setTimeout(() => setIsAudioDownloading(false), 3000);
  };

  const platformData = getPlatformInfo(url);
  const InputIcon = platformData.icon;

  const currentPlatformInfo = videoInfo ? getPlatformInfo(videoInfo.platform) : null;
  const CardPlatformIcon = currentPlatformInfo?.icon;

  const videoFormats = videoInfo?.formats.filter((f) => f.hasVideo) ?? [];
  const audioFormat = videoInfo?.formats.find((f) => f.formatId === "bestaudio_mp3");
  const selectedFormat = videoInfo?.formats.find((f) => f.formatId === selectedFormatId);
  const isSelectedAudio = selectedFormatId === "bestaudio_mp3";

  return (
    <div className="space-y-16 py-8">
      {/* Hero */}
      <section className="text-center space-y-8 max-w-3xl mx-auto">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20 mb-2">
            <RefreshCw className="w-4 h-4" /> Universal Downloader
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight">
            Grab any video.<br className="hidden md:block" />
            <span className="text-primary">Instantly.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            Paste a link from YouTube, TikTok, Instagram, Facebook, X, or Reddit and save it in the highest quality available.
          </p>
        </div>

        <form onSubmit={handleFetch} className="relative group max-w-2xl mx-auto">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full transition-opacity opacity-0 group-hover:opacity-100 duration-500" />
          <div className="relative flex flex-col md:flex-row gap-3 p-2 bg-card rounded-2xl border shadow-xl">
            <div className="relative flex-1 flex items-center">
              <div className="absolute left-4 text-muted-foreground flex items-center justify-center">
                <InputIcon className={`w-6 h-6 ${url ? platformData.color : ""}`} />
              </div>
              <Input
                type="url"
                placeholder="Paste video URL here..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full h-14 pl-14 pr-4 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-lg"
                data-testid="input-url"
                required
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="h-14 px-8 rounded-xl font-bold text-lg"
              disabled={getInfo.isPending || !url.trim()}
              data-testid="btn-fetch"
            >
              {getInfo.isPending ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Fetching...</>
              ) : (
                <><Download className="w-5 h-5 mr-2" /> Fetch Video</>
              )}
            </Button>
          </div>
        </form>
      </section>

      {/* Error state */}
      {getInfo.isError && (
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">
              {(getInfo.error as { error?: string })?.error || "Failed to fetch video. Please check the URL."}
            </p>
          </div>
        </div>
      )}

      {/* Result */}
      {videoInfo && (
        <section className="animate-in slide-in-from-bottom-8 fade-in duration-500 max-w-4xl mx-auto space-y-4">
          <Card className="overflow-hidden border-primary/20 shadow-2xl bg-card/50 backdrop-blur-xl">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-0">
              {/* Thumbnail */}
              <div className="md:col-span-2 relative aspect-video md:aspect-auto bg-black">
                {videoInfo.thumbnail ? (
                  <img
                    src={videoInfo.thumbnail}
                    alt={videoInfo.title}
                    className="w-full h-full object-cover opacity-90"
                    data-testid="img-thumbnail"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <HardDrive className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4">
                  {videoInfo.duration && (
                    <Badge variant="secondary" className="w-fit bg-black/60 text-white border-none backdrop-blur-sm">
                      <Clock className="w-3 h-3 mr-1" /> {videoInfo.duration}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Info & Actions */}
              <div className="md:col-span-3 p-6 md:p-8 flex flex-col gap-6">
                {/* Meta */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <h2
                      className="text-xl md:text-2xl font-display font-bold line-clamp-2 leading-tight"
                      data-testid="text-title"
                    >
                      {videoInfo.title}
                    </h2>
                    {CardPlatformIcon && currentPlatformInfo && (
                      <div className={`p-2 rounded-lg ${currentPlatformInfo.bg} ${currentPlatformInfo.color} shrink-0`}>
                        <CardPlatformIcon className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center" data-testid="text-uploader">
                      <CheckCircle className="w-4 h-4 mr-1 text-primary" /> {videoInfo.uploader}
                    </span>
                    {videoInfo.viewCount && (
                      <span className="flex items-center" data-testid="text-views">
                        <Eye className="w-4 h-4 mr-1" /> {videoInfo.viewCount}
                      </span>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {videoInfo.platform}
                    </Badge>
                  </div>
                </div>

                {/* Format selector — Video */}
                {videoFormats.length > 0 && (
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <HardDrive className="w-4 h-4" /> Select Video Quality
                    </label>
                    <div className="grid grid-cols-2 gap-2" data-testid="container-formats">
                      {videoFormats.map((fmt) => (
                        <Button
                          key={fmt.formatId}
                          variant={selectedFormatId === fmt.formatId ? "default" : "outline"}
                          className={`justify-between h-auto py-3 ${selectedFormatId === fmt.formatId ? "border-primary ring-1 ring-primary" : ""}`}
                          onClick={() => setSelectedFormatId(fmt.formatId)}
                          data-testid={`btn-format-${fmt.formatId}`}
                        >
                          <div className="flex flex-col items-start gap-1">
                            <span className="font-bold leading-none text-sm">{fmt.label}</span>
                            <span className="text-xs opacity-60 leading-none">{fmt.ext.toUpperCase()}</span>
                          </div>
                          {fmt.filesize && (
                            <span className="text-xs opacity-60">{fmt.filesize}</span>
                          )}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-col gap-3 pt-2">
                  {/* Primary: Download Video */}
                  <Button
                    size="lg"
                    className="w-full h-14 text-lg font-bold"
                    onClick={handleDownload}
                    disabled={downloadVideo.isPending || isAudioDownloading || !selectedFormatId || isSelectedAudio}
                    data-testid="btn-download-video"
                  >
                    {downloadVideo.isPending ? (
                      <><Loader2 className="w-6 h-6 mr-2 animate-spin" /> Processing...</>
                    ) : (
                      <>
                        <Download className="w-6 h-6 mr-2" />
                        Download Video
                        {selectedFormat && selectedFormat.hasVideo && (
                          <span className="ml-2 text-sm opacity-70">({selectedFormat.quality})</span>
                        )}
                      </>
                    )}
                  </Button>

                  {/* Secondary: Download MP3 */}
                  {audioFormat && (
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full h-12 font-semibold border-primary/30 hover:border-primary hover:bg-primary/5 text-primary"
                      onClick={handleMp3Download}
                      disabled={isAudioDownloading || downloadVideo.isPending}
                      data-testid="btn-download-mp3"
                    >
                      {isAudioDownloading ? (
                        <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Preparing MP3...</>
                      ) : (
                        <><Music className="w-5 h-5 mr-2" /> Download Audio (MP3)</>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* How it works */}
      <section className="py-12 border-t border-border/50">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-display font-bold">How it works</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            {
              step: "1",
              title: "Copy Link",
              desc: "Find the video you want to save and copy its URL from the browser or app.",
            },
            {
              step: "2",
              title: "Paste & Fetch",
              desc: "Paste the link into the search box above and click the Fetch Video button.",
            },
            {
              step: "3",
              title: "Download",
              desc: "Choose video quality or grab just the audio as MP3 — then download instantly.",
            },
          ].map(({ step, title, desc }) => (
            <div key={step} className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <span className="text-2xl font-bold">{step}</span>
              </div>
              <h3 className="text-xl font-bold">{title}</h3>
              <p className="text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Platforms */}
      <section className="py-12 bg-muted/30 rounded-3xl text-center space-y-6">
        <h2 className="text-2xl font-display font-bold">Supported Platforms</h2>
        <div className="flex flex-wrap justify-center gap-8 text-muted-foreground">
          {[
            { Icon: SiYoutube, label: "YouTube", color: "hover:text-[#FF0000]" },
            { Icon: SiInstagram, label: "Instagram", color: "hover:text-[#E1306C]" },
            { Icon: SiTiktok, label: "TikTok", color: "hover:text-foreground" },
            { Icon: SiFacebook, label: "Facebook", color: "hover:text-[#1877F2]" },
            { Icon: SiX, label: "Twitter/X", color: "hover:text-foreground" },
            { Icon: SiReddit, label: "Reddit", color: "hover:text-[#FF4500]" },
            { Icon: SiVimeo, label: "Vimeo", color: "hover:text-[#1AB7EA]" },
          ].map(({ Icon, label, color }) => (
            <div key={label} className="flex flex-col items-center gap-2 group">
              <Icon className={`w-10 h-10 transition-colors duration-200 ${color}`} />
              <span className="text-xs font-medium opacity-50 group-hover:opacity-100 transition-opacity">{label}</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          + Dailymotion, Reddit, and 1000+ more sites supported
        </p>
      </section>
    </div>
  );
}
