import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";
import { CommandDock } from "./CommandDock";
import { ScrollProgress } from "@/components/ui/scroll-progress";

interface DashboardLayoutProps {
  children: ReactNode;
  userType: "admin" | "client";
}

export const DashboardLayout = ({ children, userType }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar userType={userType} />

      {/* Reading progress hairline — top of the content column */}
      <div className="fixed top-0 left-0 right-0 z-40 lg:left-56">
        <ScrollProgress />
      </div>

      {/* Main content */}
      <main className={cn(
        "transition-all duration-300",
        "lg:ml-56 min-h-screen",
        "pt-12 pb-16 lg:pt-0 lg:pb-0"
      )}>
        <div className="p-6 lg:p-8 lg:pb-24">
          {children}
        </div>
      </main>

      {userType === "admin" && <CommandDock />}
    </div>
  );
};
