import { Link } from "wouter";
import { AppData } from "@/data/apps";
import { Star, Download } from "lucide-react";
import { SiWindows, SiApple, SiAndroid } from "react-icons/si";

interface AppCardProps {
  app: AppData;
}

export function PlatformIcon({ platform, className = "w-3 h-3" }: { platform: string, className?: string }) {
  switch (platform) {
    case "Windows":
      return <SiWindows className={className} />;
    case "Mac":
    case "iOS":
      return <SiApple className={className} />;
    case "Android":
      return <SiAndroid className={className} />;
    default:
      return null;
  }
}

export function AppCard({ app }: AppCardProps) {
  return (
    <Link href={`/apps/${app.id}`}>
      <div 
        className="group relative flex flex-col h-full bg-card rounded-xl border border-border/50 p-5 overflow-hidden hover:shadow-lg hover:border-primary/50 transition-all duration-300"
        data-testid={`app-card-${app.id}`}
      >
        <div className="flex items-start gap-4 mb-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-inner shrink-0 ${app.iconColor}`}>
            {app.iconInitials}
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <h3 className="font-display font-semibold text-lg truncate group-hover:text-primary transition-colors">
              {app.name}
            </h3>
            <p className="text-xs text-muted-foreground truncate">{app.developer}</p>
            <div className="flex items-center gap-1 mt-1.5 text-xs font-medium text-amber-500">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{app.rating.toFixed(1)}</span>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground line-clamp-2 mb-6 flex-1">
          {app.tagline}
        </p>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/40">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            {app.platform.slice(0, 3).map(p => (
              <PlatformIcon key={p} platform={p} className="w-4 h-4" />
            ))}
            {app.platform.length > 3 && (
              <span className="text-xs">+{app.platform.length - 3}</span>
            )}
          </div>
          
          <div className="flex items-center gap-1 text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-md">
            <Download className="w-3 h-3" />
            {app.size}
          </div>
        </div>
      </div>
    </Link>
  );
}