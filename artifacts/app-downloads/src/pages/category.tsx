import { AppLayout } from "@/components/layout/AppLayout";
import { APPS } from "@/data/apps";
import { AppCard } from "@/components/ui/AppCard";
import { Link } from "wouter";

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const categoryName = params.slug;
  const filteredApps = APPS.filter(app => app.category === categoryName);

  return (
    <AppLayout>
      <div className="mb-10">
        <Link href="/apps" className="text-sm text-muted-foreground hover:text-primary mb-4 inline-block">
          ← Back to All Apps
        </Link>
        <h1 className="text-4xl font-display font-bold">{categoryName} Apps</h1>
        <p className="text-muted-foreground mt-2 text-lg">Browse the best {categoryName.toLowerCase()} software and applications.</p>
      </div>

      {filteredApps.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredApps.map((app, index) => (
            <div key={app.id} style={{ animationDelay: `${index * 50}ms` }} className="animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards">
              <AppCard app={app} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-muted/10 rounded-2xl border border-dashed">
          <h3 className="text-xl font-semibold mb-2">No apps found</h3>
          <p className="text-muted-foreground">Check back later for new additions to this category.</p>
        </div>
      )}
    </AppLayout>
  );
}