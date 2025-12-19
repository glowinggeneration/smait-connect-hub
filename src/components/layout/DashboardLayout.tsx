import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";

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
        "lg:ml-60 min-h-screen",
        "pt-14 pb-20 lg:pt-0 lg:pb-0" // Account for mobile header and bottom nav
      )}>
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
