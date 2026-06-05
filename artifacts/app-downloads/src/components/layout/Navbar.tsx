import { Link, useLocation } from "wouter";
import { Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground shadow-sm">
              <Download className="w-5 h-5" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-foreground">VidGrab</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link href="/" className={`hover:text-foreground transition-colors ${location === "/" ? "text-foreground" : ""}`} data-testid="nav-home">
              Downloader
            </Link>
            <Link href="/bulk" className={`hover:text-foreground transition-colors ${location === "/bulk" ? "text-foreground" : ""}`} data-testid="nav-bulk">
              Bulk Download
            </Link>
            <Link href="/history" className={`hover:text-foreground transition-colors ${location === "/history" ? "text-foreground" : ""}`} data-testid="nav-history">
              History
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}