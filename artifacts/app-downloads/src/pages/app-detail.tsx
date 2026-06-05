import { useParams } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { APPS } from "@/data/apps";
import { Button } from "@/components/ui/button";
import { PlatformIcon } from "@/components/ui/AppCard";
import { Download, Star, ShieldCheck, CheckCircle2, Clock, Globe, AlertCircle, ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import NotFound from "./not-found";

export default function AppDetailPage() {
  const params = useParams();
  const app = APPS.find(a => a.id === params.id);

  if (!app) {
    return <NotFound />;
  }

  return (
    <AppLayout>
      <div className="mb-6">
        <Link href="/apps" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Browse
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12 mb-16">
        {/* Main Info Column */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className={`w-24 h-24 sm:w-32 sm:h-32 rounded-[2rem] flex items-center justify-center text-4xl sm:text-5xl font-bold text-white shadow-xl shrink-0 ${app.iconColor}`}>
              {app.iconInitials}
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight">{app.name}</h1>
                {app.isFeatured && (
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider">Featured</span>
                )}
              </div>
              <p className="text-lg text-muted-foreground">{app.developer}</p>
              
              <div className="flex flex-wrap items-center gap-4 text-sm font-medium pt-2">
                <div className="flex items-center text-amber-500">
                  <Star className="w-4 h-4 fill-current mr-1" />
                  {app.rating.toFixed(1)} <span className="text-muted-foreground ml-1 font-normal">({app.downloadCount})</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-border" />
                <div className="text-emerald-600 flex items-center">
                  <ShieldCheck className="w-4 h-4 mr-1" /> Verified Safe
                </div>
                <div className="w-1 h-1 rounded-full bg-border" />
                <div className="text-primary bg-primary/10 px-2 py-0.5 rounded">
                  {app.category}
                </div>
              </div>
            </div>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none">
            <h3 className="text-xl font-display font-semibold mb-3">About this app</h3>
            <p className="text-base leading-relaxed text-muted-foreground">{app.description}</p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-display font-semibold">Features</h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2"><CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> Seamless cross-device synchronization</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> Enterprise-grade security protocols</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> Intuitive user interface design</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> Regular automatic updates</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> 24/7 dedicated customer support</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> Lightweight resource footprint</li>
            </ul>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-card border rounded-2xl p-6 shadow-sm sticky top-24">
            <Button size="lg" className="w-full h-14 text-base font-semibold mb-4 bg-primary hover:bg-primary/90 text-white" data-testid="btn-download">
              <Download className="w-5 h-5 mr-2" />
              Download ({app.size})
            </Button>
            
            <p className="text-xs text-center text-muted-foreground mb-6">
              By downloading, you accept our Terms of Service and Privacy Policy.
            </p>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground flex items-center"><Globe className="w-4 h-4 mr-2" /> Version</span>
                <span className="font-medium">{app.version}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground flex items-center"><Clock className="w-4 h-4 mr-2" /> Updated</span>
                <span className="font-medium">{app.updatedAt}</span>
              </div>
              <div className="py-2 border-b border-border/50">
                <span className="text-muted-foreground flex items-center mb-2"><AlertCircle className="w-4 h-4 mr-2" /> Platforms</span>
                <div className="flex flex-wrap gap-2">
                  {app.platform.map(p => (
                    <span key={p} className="inline-flex items-center gap-1.5 px-2 py-1 bg-secondary rounded text-xs font-medium">
                      <PlatformIcon platform={p} /> {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}