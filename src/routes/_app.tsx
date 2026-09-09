import { createFileRoute, Outlet, useNavigate, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  FileText,
  Building2,
  Box,
  Upload,
  Users,
  Shield,
  Activity,
  Bell,
  Settings,
  LogOut,
  Cog,
  Search,
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Route = createFileRoute("/_app")({
  component: AppShell,
});

function AppShell() {
  const { session, isLoading, role, profile } = useAuth();
  const { can, isSuperAdmin, isCompanyAdmin } = usePermissions();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !session) {
      navigate({ to: "/login", replace: true });
    }
  }, [isLoading, session, navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  };

  if (isLoading || !session) {
    return null; // Will redirect or show root loader
  }

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard", show: true },
    { label: "Documents", icon: FileText, path: "/documents", show: can("view") },
    { label: "Parties", icon: Building2, path: "/parties", show: can("manage_parties") || can("view") },
    { label: "Parts & Drawings", icon: Box, path: "/parts", show: can("manage_documents") || can("view") },
    { label: "Upload Document", icon: Upload, path: "/upload", show: can("upload") },
    { label: "Users", icon: Users, path: "/users", show: can("manage_users") },
    { label: "Roles & Permissions", icon: Shield, path: "/roles", show: can("manage_roles") },
    { label: "Audit Logs", icon: Activity, path: "/audit-logs", show: can("view_audit") },
    { label: "Notifications", icon: Bell, path: "/notifications", show: true },
    { label: "Settings", icon: Settings, path: "/settings", show: can("manage_settings") || true },
  ];

  const filteredNavItems = navItems.filter((item) => item.show);

  const NavContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-slate-800">
        <Link to="/dashboard" className="flex items-center gap-3 font-bold text-xl text-white">
          <Cog className="w-8 h-8 text-indigo-500" />
          <span>CNC Vault</span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {filteredNavItems.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors [&.active]:bg-indigo-600 [&.active]:text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-slate-800 p-4">
        <div className="flex items-center gap-3 mb-4 px-2">
          <Avatar className="h-9 w-9 bg-indigo-600 border border-slate-700">
            <AvatarFallback className="text-slate-900 bg-indigo-200">
              {profile?.full_name?.charAt(0) || session.user.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-medium text-white truncate">
              {profile?.full_name || "User"}
            </span>
            <span className="text-xs text-slate-400 truncate">
              {role?.name || "Viewer"}
            </span>
          </div>
        </div>
          {(isSuperAdmin || isCompanyAdmin) && (
            <Button 
              variant="outline" 
              className="w-full justify-start border-blue-500/30 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 gap-3 mb-2"
              onClick={() => navigate({ to: "/settings" })}
            >
              <Box className="h-5 w-5" />
              Connect Drive
            </Button>
          )}
          <Button 
            variant="ghost" 
            className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800 gap-3"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            Logout
          </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50 bg-slate-950 text-slate-300">
        <NavContent />
      </div>

      {/* Main content wrapper */}
      <div className="md:pl-64 flex flex-col flex-1 w-full">
        {/* Top bar */}
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-slate-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden -m-2.5 p-2.5 text-slate-700">
                <span className="sr-only">Open sidebar</span>
                <Menu className="h-6 w-6" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-slate-950 p-0 text-slate-300 border-r-slate-800">
              <NavContent />
            </SheetContent>
          </Sheet>

          {/* Separator */}
          <div className="h-6 w-px bg-slate-200 md:hidden" aria-hidden="true" />

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 items-center justify-between">
            <div className="flex flex-1">
              <div className="relative w-full max-w-md hidden sm:block">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-5 w-5 text-slate-400" aria-hidden="true" />
                </div>
                <input
                  type="search"
                  name="search"
                  id="global-search"
                  className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-slate-50"
                  placeholder="Search documents, parts, parties..."
                />
              </div>
            </div>
            
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <Link 
                to="/notifications" 
                className="-m-2.5 p-2.5 text-slate-400 hover:text-slate-500 relative"
              >
                <span className="sr-only">View notifications</span>
                <Bell className="h-6 w-6" aria-hidden="true" />
                {/* Notification Badge Placeholder */}
                <span className="absolute top-2 right-2.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
              </Link>

              {/* Separator */}
              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-slate-200" aria-hidden="true" />

              <div className="hidden lg:flex lg:items-center lg:gap-x-4">
                <span className="flex items-center gap-2">
                  <span className="text-sm font-medium leading-6 text-slate-900">
                    {profile?.full_name || session.user.email}
                  </span>
                  {role?.name && (
                    <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                      {role.name}
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
