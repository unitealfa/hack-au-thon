import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sprout, User, LogOut, LayoutDashboard, MapPin, Sparkles } from 'lucide-react';

export function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Sprout className="h-6 w-6 text-green-600" />
            <h1 className="text-xl font-bold">Agricoole</h1>
          </div>

          <nav className="flex items-center gap-2">
            <Link to="/dashboard">
              <Button variant={isActive('/dashboard') ? 'default' : 'ghost'} className="gap-2">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <Link to="/fields">
              <Button variant={isActive('/fields') ? 'default' : 'ghost'} className="gap-2">
                <MapPin className="h-4 w-4" />
                Fields
              </Button>
            </Link>
            <Link to="/plant-analysis">
              <Button variant={isActive('/plant-analysis') ? 'default' : 'ghost'} className="gap-2">
                <Sparkles className="h-4 w-4" />
                AI Analysis
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <User className="h-4 w-4" />
                  {user?.full_name}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                    {user?.farm_name && (
                      <p className="text-xs text-muted-foreground">{user.farm_name}</p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto">
        <Outlet />
      </main>
    </div>
  );
}
