import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { APPS, CATEGORIES, Platform } from "@/data/apps";
import { AppCard } from "@/components/ui/AppCard";
import { Search, FilterX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function AppsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("All");
  const [location] = useLocation();

  const platforms: ("All" | Platform)[] = ["All", "Windows", "Mac", "Android", "iOS"];
  const categories = ["All", ...CATEGORIES];

  const filteredApps = useMemo(() => {
    return APPS.filter(app => {
      const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            app.tagline.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || app.category === selectedCategory;
      const matchesPlatform = selectedPlatform === "All" || app.platform.includes(selectedPlatform as Platform);
      
      return matchesSearch && matchesCategory && matchesPlatform;
    });
  }, [searchQuery, selectedCategory, selectedPlatform]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    setSelectedPlatform("All");
  };

  return (
    <AppLayout>
      <div className="mb-8 space-y-6">
        <h1 className="text-4xl font-display font-bold">Browse All Apps</h1>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search by name or description..."
              className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="apps-search"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            <select 
              className="h-11 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary min-w-[140px]"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              data-testid="filter-category"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select 
              className="h-11 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary min-w-[140px]"
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              data-testid="filter-platform"
            >
              {platforms.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filteredApps.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {filteredApps.map((app, index) => (
            <div key={app.id} style={{ animationDelay: `${index * 50}ms` }} className="animate-in fade-in fill-mode-backwards">
              <AppCard app={app} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 border border-dashed rounded-2xl bg-muted/20">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No apps found</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            We couldn't find any apps matching your current filters. Try adjusting your search or clearing the filters.
          </p>
          <Button onClick={clearFilters} variant="outline" data-testid="btn-clear-filters">
            <FilterX className="w-4 h-4 mr-2" />
            Clear Filters
          </Button>
        </div>
      )}
    </AppLayout>
  );
}