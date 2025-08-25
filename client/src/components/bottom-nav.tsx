import { useLocation } from 'wouter';
import { Home, Search, MessageCircle, Settings } from 'lucide-react';

export function BottomNav() {
  const [location, navigate] = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/discovery', icon: Search, label: 'Discover' },
    { path: '/messages', icon: MessageCircle, label: 'Messages' },
    { path: '/settings', icon: Settings, label: 'Settings' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-sm mx-auto bg-secondary border-t border-border">
      <div className="flex items-center justify-around py-2">
        {navItems.map(({ path, icon: Icon, label }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`flex flex-col items-center py-2 px-4 transition-colors ${
              location === path ? 'text-primary' : 'text-muted-foreground'
            }`}
            data-testid={`nav-${label.toLowerCase()}`}
          >
            <Icon className="text-lg mb-1" size={20} />
            <span className="text-xs">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
