import { Link } from "wouter";
import { useHistory } from "@/hooks/use-history";
import { getPlatformInfo } from "@/lib/platform";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Clock, History as HistoryIcon, Trash2, DownloadCloud } from "lucide-react";

export default function History() {
  const { history, clearHistory } = useHistory();

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight flex items-center gap-3">
            <HistoryIcon className="w-8 h-8 text-primary" /> Download History
          </h1>
          <p className="text-muted-foreground mt-2">
            Your most recently fetched videos are saved here locally.
          </p>
        </div>
        
        {history.length > 0 && (
          <Button 
            variant="outline" 
            className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
            onClick={clearHistory}
            data-testid="btn-clear-history"
          >
            <Trash2 className="w-4 h-4 mr-2" /> Clear History
          </Button>
        )}
      </div>

      {history.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-24 text-center border-dashed bg-card/50">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center text-muted-foreground mb-6">
            <HistoryIcon className="w-10 h-10 opacity-50" />
          </div>
          <h3 className="text-2xl font-bold mb-2">No history yet</h3>
          <p className="text-muted-foreground mb-8 max-w-sm">
            Videos you fetch and download will appear here for easy access later.
          </p>
          <Button asChild size="lg">
            <Link href="/">Fetch a Video</Link>
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {history.map((item) => {
            const platformInfo = getPlatformInfo(item.platform);
            const PlatformIcon = platformInfo.icon;
            
            return (
              <Card key={item.id} className="overflow-hidden flex flex-col sm:flex-row bg-card hover:border-primary/50 transition-colors group">
                <div className="w-full sm:w-48 aspect-video sm:aspect-auto relative bg-black shrink-0">
                  <img 
                    src={item.thumbnail} 
                    alt={item.title} 
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                  />
                  <div className={`absolute top-2 left-2 p-1.5 rounded-md ${platformInfo.bg} ${platformInfo.color} backdrop-blur-md`}>
                    <PlatformIcon className="w-4 h-4" />
                  </div>
                </div>
                
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-lg line-clamp-2 leading-tight mb-2" data-testid={`text-history-title-${item.id}`}>
                      {item.title}
                    </h3>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(item.timestamp).toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="pt-4 flex justify-end">
                    <Button asChild variant="secondary" className="w-full sm:w-auto hover:bg-primary hover:text-primary-foreground">
                      <Link href={`/?url=${encodeURIComponent(item.url)}`} data-testid={`btn-refetch-${item.id}`}>
                        <DownloadCloud className="w-4 h-4 mr-2" /> Re-fetch
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
