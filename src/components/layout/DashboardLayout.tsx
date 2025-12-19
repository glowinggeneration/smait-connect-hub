import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
  userType: "admin" | "client";
}

export const DashboardLayout = ({ children, userType }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar userType={userType} />
      
      {/* Main content */}
      <main className={cn(
        "transition-all duration-300 lg:ml-64 min-h-screen",
        "pt-16 lg:pt-0"
      )}>
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
