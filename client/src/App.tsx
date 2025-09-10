import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BottomNav } from "@/components/bottom-nav";
import Home from "@/pages/home";
import Discovery from "@/pages/discovery";
import Messages from "@/pages/messages";
import Git from "@/pages/git";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/discovery" component={Discovery} />
      <Route path="/messages" component={Messages} />
      <Route path="/git" component={Git} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen max-w-sm mx-auto bg-background text-foreground relative overflow-hidden">
          {/* Status Bar */}
          <div className="flex justify-between items-center px-4 py-2 text-sm text-muted-foreground">
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <span className="text-xs">📶</span>
              <span className="text-xs">📶</span>
              <span className="text-xs">🔋</span>
            </div>
          </div>

          <Router />
          <BottomNav />
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
