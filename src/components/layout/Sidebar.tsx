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
  Home,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
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

interface NavSection {
  title: string;
  collapsible: boolean;
  items: { icon: React.ElementType; label: string; path: string; badge?: number }[];
}

const clientNavItems = [
  { icon: Home, label: "Dashboard", path: "/client" },
  { icon: Briefcase, label: "My Initiatives", path: "/client/projects" },
  { icon: Package, label: "New Brief", path: "/client/new-brief" },
  { icon: Network, label: "Messages", path: "/client/messages" },
  { icon: Settings, label: "Settings", path: "/client/settings" },
];

// Bottom nav items (limited for mobile)
const adminBottomNav = [
  { icon: Radio, label: "Command", path: "/command" },
  { icon: Briefcase, label: "Work", path: "/work" },
  { icon: Brain, label: "Intel", path: "/intelligence" },
  { icon: Network, label: "Network", path: "/network" },
];

const clientBottomNav = [
  { icon: Home, label: "Home", path: "/client" },
  { icon: Briefcase, label: "Initiatives", path: "/client/projects" },
  { icon: Package, label: "Brief", path: "/client/new-brief" },
  { icon: Network, label: "Messages", path: "/client/messages" },
];

export const Sidebar = ({ userType }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const bottomNavItems = userType === "admin" ? adminBottomNav : clientBottomNav;
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [operationsExpanded, setOperationsExpanded] = useState(false);
  
  // Get signal count for badge
  const { signals } = useIntelligence();
  const unacknowledgedCount = signals.filter(s => !s.acknowledged).length;

  const adminNavSections: NavSection[] = [
    {
      title: "Primary",
      collapsible: false,
      items: [
        { icon: Radio, label: "Command", path: "/command", badge: unacknowledgedCount > 0 ? unacknowledgedCount : undefined },
        { icon: Briefcase, label: "Work", path: "/work" },
        { icon: Brain, label: "Intelligence", path: "/intelligence" },
        { icon: Network, label: "Network", path: "/network" },
        { icon: Package, label: "Assets", path: "/assets" },
      ],
    },
    {
      title: "Operations",
      collapsible: true,
      items: [
        { icon: Settings, label: "Operations", path: "/operations" },
      ],
    },
  ];

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
    if (userRole === "admin") return "Operator";
    if (userRole === "client") return "Principal";
    return "User";
  };

  const NavContent = () => (
    <>
      {/* User Profile */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Avatar className="w-11 h-11 ring-2 ring-white/20">
            <AvatarImage src={userProfile?.avatar_url || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/60 text-white font-semibold">
              {getInitials(userProfile?.full_name || "U")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white truncate text-sm">
              {userProfile?.full_name || "Loading..."}
            </p>
            <p className="text-xs text-primary truncate">{getRoleLabel()}</p>
          </div>
        </div>
      </div>

      {/* Menu Section */}
      <div className="flex-1 py-3 px-3 overflow-y-auto">
        {userType === "admin" ? (
          <nav className="space-y-1">
            {adminNavSections.map((section) => (
              section.collapsible ? (
                <Collapsible 
                  key={section.title}
                  open={operationsExpanded}
                  onOpenChange={setOperationsExpanded}
                  className="mt-4"
                >
                  <CollapsibleTrigger className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-white/40 uppercase tracking-wider hover:text-white/60 transition-colors">
                    {section.title}
                    <ChevronDown className={cn(
                      "h-3 w-3 transition-transform",
                      operationsExpanded && "rotate-180"
                    )} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-0.5">
                    {section.items.map((item) => {
                      const isActive = location.pathname.startsWith(item.path);
                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative group",
                            isActive
                              ? "bg-white/10 text-white font-medium backdrop-blur-sm"
                              : "text-white/70 hover:text-white hover:bg-white/5"
                          )}
                        >
                          <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-primary")} />
                          <span className="text-sm">{item.label}</span>
                        </NavLink>
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <div key={section.title} className="space-y-0.5">
                  {section.items.map((item) => {
                    const isActive = location.pathname === item.path || 
                      (item.path !== "/command" && location.pathname.startsWith(item.path));
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 relative group",
                          isActive
                            ? "bg-white/10 text-white font-medium backdrop-blur-sm"
                            : "text-white/70 hover:text-white hover:bg-white/5"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-primary")} />
                          <span className="text-sm">{item.label}</span>
                        </div>
                        {item.badge && (
                          <Badge variant="secondary" className="h-5 w-5 p-0 justify-center text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              )
            ))}
          </nav>
        ) : (
          <nav className="space-y-1">
            {clientNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative group",
                    isActive
                      ? "bg-white/10 text-white font-medium backdrop-blur-sm"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-primary")} />
                  <span className="text-sm">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        )}
      </div>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-3 text-white/70 hover:text-red-400 hover:bg-red-500/10 h-10 rounded-xl"
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
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-black/40 backdrop-blur-xl border-b border-white/10 z-50 flex items-center justify-between px-4 safe-area-top">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-white hover:bg-white/10">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 flex flex-col bg-black/60 backdrop-blur-2xl border-white/10">
            <NavContent />
          </SheetContent>
        </Sheet>

        <h1 className="font-semibold text-white tracking-tight">
          {userType === "admin" ? "SMAIT" : "SMAIT Portal"}
        </h1>

        <Avatar className="w-8 h-8">
          <AvatarImage src={userProfile?.avatar_url || undefined} />
          <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/60 text-white text-xs font-semibold">
            {getInitials(userProfile?.full_name || "U")}
          </AvatarFallback>
        </Avatar>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-black/40 backdrop-blur-xl border-t border-white/10 z-50 flex items-center justify-around px-2 safe-area-bottom">
        {bottomNavItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== "/command" && location.pathname.startsWith(item.path));
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[60px]",
                isActive
                  ? "text-primary"
                  : "text-white/60"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-xl transition-all",
                isActive && "bg-primary/20"
              )}>
                <item.icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col bg-black/40 backdrop-blur-2xl border-r border-white/10 transition-all duration-300 fixed left-0 top-0 bottom-0 z-40 w-64">
        <NavContent />
      </aside>
    </>
  );
};
