import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import React from "react";

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider
                defaultOpen={false}
                className="[--sidebar-width: 14rem]"
              >
    <div className="flex w-full h-screen ">
      {/* Sidebar */}
      <AppSidebar />

      {children}
    </div>
    </SidebarProvider>
  );
};

export default layout;
