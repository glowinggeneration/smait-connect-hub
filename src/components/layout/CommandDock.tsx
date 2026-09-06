import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Briefcase, BrainCircuit, Users, FolderOpen, Settings2 } from "lucide-react";
import { Dock, DockIcon } from "@/components/ui/dock";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const dockItems = [
  { to: "/command", label: "Command", icon: LayoutDashboard },
  { to: "/work", label: "Work", icon: Briefcase },
  { to: "/intelligence", label: "Intelligence", icon: BrainCircuit },
  { to: "/network", label: "Network", icon: Users },
  { to: "/assets", label: "Assets", icon: FolderOpen },
  { to: "/operations", label: "Operations", icon: Settings2 },
];

/**
 * Desktop-only quick-jump dock. Mobile keeps the existing bottom navigation.
 */
export const CommandDock = () => {
  const location = useLocation();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-40 hidden justify-center lg:flex lg:pl-56">
      <Dock className="pointer-events-auto">
        {dockItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <DockIcon key={item.to}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <NavLink
                    to={item.to}
                    aria-label={item.label}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex h-full w-full items-center justify-center rounded-full border transition-colors",
                      isActive
                        ? "border-border bg-muted text-foreground"
                        : "border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                  </NavLink>
                </TooltipTrigger>
                <TooltipContent side="top">{item.label}</TooltipContent>
              </Tooltip>
            </DockIcon>
          );
        })}
      </Dock>
    </div>
  );
};

export default CommandDock;
