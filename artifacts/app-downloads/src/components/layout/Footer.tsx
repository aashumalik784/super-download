import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="border-t bg-muted/20">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="font-display font-bold text-lg">AppZone</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The modern marketplace for safe, verified software downloads across all your devices.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Platforms</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/apps?platform=Windows" className="text-muted-foreground hover:text-foreground transition-colors">Windows</Link></li>
              <li><Link href="/apps?platform=Mac" className="text-muted-foreground hover:text-foreground transition-colors">macOS</Link></li>
              <li><Link href="/apps?platform=Android" className="text-muted-foreground hover:text-foreground transition-colors">Android</Link></li>
              <li><Link href="/apps?platform=iOS" className="text-muted-foreground hover:text-foreground transition-colors">iOS</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Top Categories</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/category/Games" className="text-muted-foreground hover:text-foreground transition-colors">Games</Link></li>
              <li><Link href="/category/Productivity" className="text-muted-foreground hover:text-foreground transition-colors">Productivity</Link></li>
              <li><Link href="/category/Security" className="text-muted-foreground hover:text-foreground transition-colors">Security</Link></li>
              <li><Link href="/category/Media" className="text-muted-foreground hover:text-foreground transition-colors">Media</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">About Us</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Developers</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} AppZone Marketplace. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Built for safety and speed.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}