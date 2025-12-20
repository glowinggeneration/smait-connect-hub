import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  MessageSquare,
  FileText,
  Settings,
  LogOut,
  Inbox,
  Clock,
  Calendar,
  Plus,
  Bell,
  Menu,
  Home,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface SidebarProps {
  userType: "admin" | "client";
}

interface UserProfile {
  full_name: string;
  email: string;
  avatar_url: string | null;
  company: string | null;
}

const adminNavItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/admin" },
  { icon: FolderKanban, label: "Projects", path: "/admin/projects" },
  { icon: Inbox, label: "My Tasks", path: "/admin/tasks" },
  { icon: FileText, label: "Briefs", path: "/admin/briefs" },
  { icon: MessageSquare, label: "Inbox", path: "/admin/inbox" },
  { icon: Clock, label: "Standups", path: "/admin/standups" },
  { icon: Calendar, label: "Meetings", path: "/admin/meetings" },
  { icon: Users, label: "Clients", path: "/admin/clients" },
  { icon: Wrench, label: "Tools", path: "/admin/tools" },
  { icon: Settings, label: "Settings", path: "/admin/settings" },
];

const clientNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/client" },
  { icon: FolderKanban, label: "My Projects", path: "/client/projects" },
  { icon: Plus, label: "New Brief", path: "/client/new-brief" },
  { icon: MessageSquare, label: "Messages", path: "/client/messages" },
  { icon: Bell, label: "Notifications", path: "/client/notifications" },
  { icon: Settings, label: "Settings", path: "/client/settings" },
];

// Bottom nav items (limited for mobile)
const adminBottomNav = [
  { icon: Home, label: "Home", path: "/admin" },
  { icon: FolderKanban, label: "Projects", path: "/admin/projects" },
  { icon: Inbox, label: "Tasks", path: "/admin/tasks" },
  { icon: Wrench, label: "Tools", path: "/admin/tools" },
];

const clientBottomNav = [
  { icon: Home, label: "Home", path: "/client" },
  { icon: FolderKanban, label: "Projects", path: "/client/projects" },
  { icon: Plus, label: "Brief", path: "/client/new-brief" },
  { icon: MessageSquare, label: "Messages", path: "/client/messages" },
];

export const Sidebar = ({ userType }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const navItems = userType === "admin" ? adminNavItems : clientNavItems;
  const bottomNavItems = userType === "admin" ? adminBottomNav : clientBottomNav;
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email, avatar_url, company")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        setUserProfile(profile);
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (roleData) {
        setUserRole(roleData.role);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleLabel = () => {
    if (userRole === "admin") return "Project Manager";
    if (userRole === "client") return "Client";
    return "User";
  };

  const NavContent = () => (
    <>
      {/* User Profile */}
      <div className="p-5 border-b border-border/50">
        <div className="flex items-center gap-3">
          <Avatar className="w-11 h-11 ring-2 ring-primary/20">
            <AvatarImage src={userProfile?.avatar_url || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/40 text-primary font-semibold">
              {getInitials(userProfile?.full_name || "U")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate text-sm">
              {userProfile?.full_name || "Loading..."}
            </p>
            <p className="text-xs text-primary truncate">{getRoleLabel()}</p>
          </div>
        </div>
      </div>

      {/* Menu Section */}
      <div className="flex-1 py-3 px-3 overflow-y-auto">
        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative group",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-primary")} />
                <span className="text-sm">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-border/50">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-10 rounded-xl"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm">Logout</span>
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-card/95 backdrop-blur-lg border-b border-border/50 z-50 flex items-center justify-between px-4 safe-area-top">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 flex flex-col">
            <NavContent />
          </SheetContent>
        </Sheet>

        <h1 className="font-semibold text-foreground">
          {userType === "admin" ? "SMAIT Admin" : "SMAIT Portal"}
        </h1>

        <Avatar className="w-8 h-8">
          <AvatarImage src={userProfile?.avatar_url || undefined} />
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/40 text-primary text-xs font-semibold">
            {getInitials(userProfile?.full_name || "U")}
          </AvatarFallback>
        </Avatar>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-card/95 backdrop-blur-lg border-t border-border/50 z-50 flex items-center justify-around px-2 safe-area-bottom">
        {bottomNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[60px]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-xl transition-all",
                isActive && "bg-primary/10"
              )}>
                <item.icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col bg-card border-r border-border/50 transition-all duration-300 fixed left-0 top-0 bottom-0 z-40 w-60">
        <NavContent />
      </aside>
    </>
  );
};
