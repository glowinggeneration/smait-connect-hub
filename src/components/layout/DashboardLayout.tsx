import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";
import marsBackground from "@/assets/mars-background.jpg";

interface DashboardLayoutProps {
  children: ReactNode;
  userType: "admin" | "client";
}

export const DashboardLayout = ({ children, userType }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen relative">
      {/* Mars Space Background */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{ backgroundImage: `url(${marsBackground})` }}
      />
      <div className="fixed inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70 backdrop-blur-sm z-0" />
      <div className="fixed inset-0 stars-overlay z-0" />
      
      {/* Content */}
      <div className="relative z-10 min-h-screen">
        <Sidebar userType={userType} />
        
        {/* Main content */}
        <main className={cn(
          "transition-all duration-300",
          "lg:ml-64 min-h-screen",
          "pt-14 pb-20 lg:pt-0 lg:pb-0"
        )}>
          <div className="p-4 lg:p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
