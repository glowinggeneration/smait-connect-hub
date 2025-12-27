import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Bot, LayoutDashboard, FolderKanban, Target, Inbox, Wrench } from "lucide-react";

interface TopHeaderProps {
  userType: "admin" | "client";
}

const adminQuickLinks = [
  { icon: LayoutDashboard, label: "Overview", path: "/admin" },
  { icon: Bot, label: "AI PM", path: "/admin/ai-pm" },
  { icon: FolderKanban, label: "Projects", path: "/admin/projects" },
  { icon: Target, label: "Leads", path: "/admin/leads" },
  { icon: Inbox, label: "Tasks", path: "/admin/tasks" },
  { icon: Wrench, label: "Tools", path: "/admin/tools" },
];

const clientQuickLinks = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/client" },
  { icon: FolderKanban, label: "Projects", path: "/client/projects" },
];

export const TopHeader = ({ userType }: TopHeaderProps) => {
  const location = useLocation();
  const quickLinks = userType === "admin" ? adminQuickLinks : clientQuickLinks;

  return (
    <header className="hidden lg:flex items-center gap-2 mb-6 p-2 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10">
      <div className="flex items-center gap-1 px-2">
        <span className="text-xs font-medium text-white/50 uppercase tracking-wider">Quick Access</span>
      </div>
      <div className="h-6 w-px bg-white/10" />
      <nav className="flex items-center gap-1 flex-1 overflow-x-auto">
        {quickLinks.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 whitespace-nowrap",
                isActive
                  ? "bg-primary/20 text-primary font-medium"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className="w-4 h-4" />
              <span className="text-sm">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </header>
  );
};
