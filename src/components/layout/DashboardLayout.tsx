import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";
import { CommandDock } from "./CommandDock";

interface DashboardLayoutProps {
  children: ReactNode;
  userType: "admin" | "client";
}

export const DashboardLayout = ({ children, userType }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar userType={userType} />
      
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
