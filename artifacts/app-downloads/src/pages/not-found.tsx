import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Search, Home, AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 md:py-32 text-center max-w-lg mx-auto">
      <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center text-muted-foreground mb-8">
        <AlertCircle className="w-12 h-12" />
      </div>
      <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 tracking-tight">404 - Page Not Found</h1>
      <p className="text-lg text-muted-foreground mb-8">
        We couldn't find the page you're looking for. It might have been moved, or the link might be broken.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
        <Button asChild size="lg" className="w-full sm:w-auto h-12">
          <Link href="/" data-testid="btn-home">
            <Home className="w-5 h-5 mr-2" />
            Go to Homepage
          </Link>
        </Button>
      </div>
    </div>
  );
}
