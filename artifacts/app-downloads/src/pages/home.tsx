import { useState, useEffect } from "react";
import { useGetVideoInfo, useDownloadVideo, VideoInfo } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useHistory } from "@/hooks/use-history";
import { getPlatformInfo } from "@/lib/platform";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Download, Loader2, Clock, Eye, AlertCircle, 
  CheckCircle, PlayCircle, HardDrive, RefreshCw
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SiYoutube, SiInstagram, SiTiktok, SiFacebook, SiX, SiReddit, SiVimeo } from "react-icons/si";

export default function Home() {
  const [url, setUrl] = useState("");
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [selectedFormatId, setSelectedFormatId] = useState<string>("");
  const { toast } = useToast();
  const { addHistory } = useHistory();

  const getInfo = useGetVideoInfo();
  const downloadVideo = useDownloadVideo();

  // Load URL from query string if returning from history
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryUrl = params.get('url');
    if (queryUrl) {
      setUrl(queryUrl);
      fetchInfo(queryUrl);
      // Clean up URL
      window.history.replaceState({}, '', '/');
    }
  }, []);

  const fetchInfo = (targetUrl: string) => {
    if (!targetUrl.trim()) return;
    setVideoInfo(null);
    setSelectedFormatId("");

    getInfo.mutate({ data: { url: targetUrl } }, {
      onSuccess: (data) => {
        setVideoInfo(data);
        if (data.formats && data.formats.length > 0) {
          setSelectedFormatId(data.formats[0].formatId);
        }
        addHistory(data);
      },
      onError: (err) => {
        toast({
          variant: "destructive",
          title: "Failed to fetch video",
          description: err.error || "Please check the URL and try again."
        });
      }
    });
  };

  const handleFetch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInfo(url);
  };

  const handleDownload = () => {
    if (!url || !selectedFormatId) return;

    downloadVideo.mutate({ data: { url, formatId: selectedFormatId } }, {
      onSuccess: (data) => {
        toast({
          title: "Download Started",
          description: `Downloading ${data.filename}`,
        });
        window.open(data.downloadUrl, '_blank');
      },
      onError: (err) => {
        toast({
          variant: "destructive",
          title: "Download Failed",
          description: err.error || "An error occurred while downloading."
        });
      }
    });
  };

  const platformData = getPlatformInfo(url);
  const InputIcon = platformData.icon;

  const currentPlatformInfo = videoInfo ? getPlatformInfo(videoInfo.platform) : null;
  const CardPlatformIcon = currentPlatformInfo?.icon;

  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="text-center space-y-8 max-w-3xl mx-auto">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20 mb-2">
            <RefreshCw className="w-4 h-4" /> Universal Downloader
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight">
            Grab any video. <br className="hidden md:block" />
            <span className="text-primary">Instantly.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            Paste a link from YouTube, TikTok, Instagram, X, or Reddit and save it in the highest quality available.
          </p>
        </div>

        <form onSubmit={handleFetch} className="relative group max-w-2xl mx-auto">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full transition-opacity opacity-0 group-hover:opacity-100 duration-500" />
          <div className="relative flex flex-col md:flex-row gap-3 p-2 bg-card rounded-2xl border shadow-xl">
            <div className="relative flex-1 flex items-center">
              <div className="absolute left-4 text-muted-foreground flex items-center justify-center">
                <InputIcon className={`w-6 h-6 ${url ? platformData.color : ''}`} />
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

      {/* Result Section */}
      {videoInfo && (
        <section className="animate-in slide-in-from-bottom-8 fade-in duration-500 max-w-4xl mx-auto">
          <Card className="overflow-hidden border-primary/20 shadow-2xl bg-card/50 backdrop-blur-xl">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-0">
              {/* Thumbnail */}
              <div className="md:col-span-2 relative aspect-video md:aspect-auto bg-black">
                <img 
                  src={videoInfo.thumbnail} 
                  alt={videoInfo.title} 
                  className="w-full h-full object-cover opacity-90"
                  data-testid="img-thumbnail"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4">
                  {videoInfo.duration && (
                    <Badge variant="secondary" className="w-fit bg-black/60 text-white border-none backdrop-blur-sm">
                      <Clock className="w-3 h-3 mr-1" /> {videoInfo.duration}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Info & Actions */}
              <div className="md:col-span-3 p-6 md:p-8 flex flex-col">
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-xl md:text-2xl font-display font-bold line-clamp-2 leading-tight" data-testid="text-title">
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
                  </div>

                  <div className="pt-4 space-y-3">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <HardDrive className="w-4 h-4" /> Select Quality
                    </label>
                    <div className="grid grid-cols-2 gap-2" data-testid="container-formats">
                      {videoInfo.formats.map((fmt) => (
                        <Button
                          key={fmt.formatId}
                          variant={selectedFormatId === fmt.formatId ? "default" : "outline"}
                          className={`justify-between h-auto py-3 ${selectedFormatId === fmt.formatId ? 'border-primary' : ''}`}
                          onClick={() => setSelectedFormatId(fmt.formatId)}
                          data-testid={`btn-format-${fmt.formatId}`}
                        >
                          <div className="flex flex-col items-start gap-1">
                            <span className="font-bold leading-none">{fmt.label}</span>
                            <span className="text-xs opacity-70 leading-none">{fmt.ext.toUpperCase()} • {fmt.quality}</span>
                          </div>
                          {fmt.filesize && (
                            <span className="text-xs opacity-70">{fmt.filesize}</span>
                          )}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-8">
                  <Button 
                    size="lg" 
                    className="w-full h-14 text-lg font-bold" 
                    onClick={handleDownload}
                    disabled={downloadVideo.isPending || !selectedFormatId}
                    data-testid="btn-download"
                  >
                    {downloadVideo.isPending ? (
                      <><Loader2 className="w-6 h-6 mr-2 animate-spin" /> Processing...</>
                    ) : (
                      <><Download className="w-6 h-6 mr-2" /> Download Video</>
                    )}
                  </Button>
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
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <span className="text-2xl font-bold">1</span>
            </div>
            <h3 className="text-xl font-bold">Copy Link</h3>
            <p className="text-muted-foreground">Find the video you want to save and copy its URL from the browser or app.</p>
          </div>
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <span className="text-2xl font-bold">2</span>
            </div>
            <h3 className="text-xl font-bold">Paste & Fetch</h3>
            <p className="text-muted-foreground">Paste the link into the search box above and click the Fetch button.</p>
          </div>
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <span className="text-2xl font-bold">3</span>
            </div>
            <h3 className="text-xl font-bold">Download</h3>
            <p className="text-muted-foreground">Choose your preferred quality format and click download. That's it!</p>
          </div>
        </div>
      </section>
      
      {/* Platforms */}
      <section className="py-12 bg-muted/30 rounded-3xl text-center">
        <h2 className="text-2xl font-display font-bold mb-8">Supported Platforms</h2>
        <div className="flex flex-wrap justify-center gap-8 opacity-70">
          <SiYoutube className="w-10 h-10 hover:text-[#FF0000] transition-colors" />
          <SiInstagram className="w-10 h-10 hover:text-[#E1306C] transition-colors" />
          <SiTiktok className="w-10 h-10 hover:text-foreground transition-colors" />
          <SiFacebook className="w-10 h-10 hover:text-[#1877F2] transition-colors" />
          <SiX className="w-10 h-10 hover:text-foreground transition-colors" />
          <SiReddit className="w-10 h-10 hover:text-[#FF4500] transition-colors" />
          <SiVimeo className="w-10 h-10 hover:text-[#1AB7EA] transition-colors" />
        </div>
      </section>

    </div>
  );
}
