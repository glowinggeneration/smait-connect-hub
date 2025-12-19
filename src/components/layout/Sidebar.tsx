import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  MessageSquare,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import smaitLogo from "@/assets/smait-logo.png";

interface SidebarProps {
  userType: "admin" | "client";
}

const adminNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: FolderKanban, label: "Projects", path: "/admin/projects" },
  { icon: Users, label: "Clients", path: "/admin/clients" },
  { icon: MessageSquare, label: "Messages", path: "/admin/messages" },
  { icon: FileText, label: "Documents", path: "/admin/documents" },
  { icon: Settings, label: "Settings", path: "/admin/settings" },
];

const clientNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/client" },
  { icon: FolderKanban, label: "My Projects", path: "/client/projects" },
  { icon: MessageSquare, label: "Messages", path: "/client/messages" },
  { icon: FileText, label: "Documents", path: "/client/documents" },
  { icon: Settings, label: "Settings", path: "/client/settings" },
];

export const Sidebar = ({ userType }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navItems = userType === "admin" ? adminNavItems : clientNavItems;

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 gradient-sidebar flex items-center justify-between px-4 z-50">
        <img src={smaitLogo} alt="SMAIT" className="h-8" />
        <Button variant="ghost" size="icon" className="text-sidebar-foreground">
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col gradient-sidebar transition-all duration-300 fixed left-0 top-0 bottom-0 z-40",
          collapsed ? "w-20" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-sidebar-border">
          {!collapsed && (
            <img src={smaitLogo} alt="SMAIT Digital" className="h-10 animate-fade-in" />
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="text-sidebar-foreground hover:bg-sidebar-accent ml-auto"
          >
            <ChevronLeft className={cn("w-5 h-5 transition-transform", collapsed && "rotate-180")} />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="font-medium">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-sidebar-border">
          <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
            <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-semibold">
              {userType === "admin" ? "A" : "C"}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {userType === "admin" ? "Admin User" : "Client User"}
                </p>
                <p className="text-xs text-sidebar-foreground/60 truncate">
                  {userType === "admin" ? "Administrator" : "Client"}
                </p>
              </div>
            )}
          </div>
          
          <NavLink to="/">
            <Button
              variant="ghost"
              className={cn(
                "w-full mt-4 text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10",
                collapsed && "p-2"
              )}
            >
              <LogOut className="w-4 h-4" />
              {!collapsed && <span className="ml-2">Logout</span>}
            </Button>
          </NavLink>
        </div>
      </aside>
    </>
  );
};
