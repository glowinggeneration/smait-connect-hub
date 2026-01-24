import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  Radio,
  Briefcase,
  Brain,
  Network,
  Package,
  Settings,
  LogOut,
  Menu,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useIntelligence } from "@/contexts/IntelligenceContext";

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
  { icon: Radio, label: "Command", path: "/command" },
  { icon: Briefcase, label: "Work", path: "/work" },
  { icon: Brain, label: "Intelligence", path: "/intelligence" },
  { icon: Network, label: "Network", path: "/network" },
  { icon: Package, label: "Assets", path: "/assets" },
];

const clientNavItems = [
  { icon: Radio, label: "Overview", path: "/client" },
  { icon: Briefcase, label: "Initiatives", path: "/client/projects" },
  { icon: Package, label: "New Brief", path: "/client/new-brief" },
  { icon: Network, label: "Messages", path: "/client/messages" },
];

const adminBottomNav = [
  { icon: Radio, label: "Command", path: "/command" },
  { icon: Briefcase, label: "Work", path: "/work" },
  { icon: Brain, label: "Intel", path: "/intelligence" },
  { icon: Network, label: "Network", path: "/network" },
];

const clientBottomNav = [
  { icon: Radio, label: "Home", path: "/client" },
  { icon: Briefcase, label: "Initiatives", path: "/client/projects" },
  { icon: Package, label: "Brief", path: "/client/new-brief" },
  { icon: Network, label: "Messages", path: "/client/messages" },
];

export const Sidebar = ({ userType }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const bottomNavItems = userType === "admin" ? adminBottomNav : clientBottomNav;
  const navItems = userType === "admin" ? adminNavItems : clientNavItems;
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [operationsExpanded, setOperationsExpanded] = useState(false);
  
  const { signals } = useIntelligence();
  const unacknowledgedCount = signals.filter(s => !s.acknowledged).length;

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

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo / Brand */}
      <div className="px-4 py-5 border-b border-border">
        <span className="text-sm font-semibold tracking-tight">SMAIT</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== "/command" && item.path !== "/client" && location.pathname.startsWith(item.path));
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors duration-150",
                isActive
                  ? "bg-accent text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
              {item.path === "/command" && unacknowledgedCount > 0 && (
                <span className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">
                  {unacknowledgedCount}
                </span>
              )}
            </NavLink>
          );
        })}

        {userType === "admin" && (
          <Collapsible 
            open={operationsExpanded}
            onOpenChange={setOperationsExpanded}
            className="mt-4"
          >
            <CollapsibleTrigger className="w-full flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Settings className="w-4 h-4" />
              <span>Operations</span>
              <ChevronRight className={cn(
                "h-3 w-3 ml-auto transition-transform duration-200",
                operationsExpanded && "rotate-90"
              )} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-7 space-y-0.5 mt-0.5">
              {["Team", "Tools", "Integrations", "Settings"].map((item) => {
                const path = `/operations?tab=${item.toLowerCase()}`;
                const isActive = location.pathname === "/operations" && 
                  location.search.includes(item.toLowerCase());
                return (
                  <NavLink
                    key={item}
                    to={path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "block px-3 py-1.5 rounded-md text-sm transition-colors",
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {item}
                  </NavLink>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        )}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar className="w-8 h-8">
            <AvatarImage src={userProfile?.avatar_url || undefined} />
            <AvatarFallback className="bg-muted text-xs font-medium">
              {getInitials(userProfile?.full_name || "U")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {userProfile?.full_name || "Loading..."}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-12 bg-background border-b border-border z-50 flex items-center justify-between px-4 safe-area-top">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Menu className="w-4 h-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 border-r border-border">
            <NavContent />
          </SheetContent>
        </Sheet>

        <span className="text-sm font-semibold tracking-tight">SMAIT</span>

        <Avatar className="w-7 h-7">
          <AvatarImage src={userProfile?.avatar_url || undefined} />
          <AvatarFallback className="bg-muted text-xs">
            {getInitials(userProfile?.full_name || "U")}
          </AvatarFallback>
        </Avatar>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-14 bg-background border-t border-border z-50 flex items-center justify-around px-2 safe-area-bottom">
        {bottomNavItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== "/command" && item.path !== "/client" && location.pathname.startsWith(item.path));
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 min-w-[56px]",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px]">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col bg-card border-r border-border fixed left-0 top-0 bottom-0 z-40 w-56">
        <NavContent />
      </aside>
    </>
  );
};
