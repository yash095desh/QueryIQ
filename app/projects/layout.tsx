import { AppSidebar } from "@/components/app-sidebar";
import React from "react";

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex w-full h-screen ">
      {/* Sidebar */}
      <AppSidebar />

      {children}
    </div>
  );
};

export default layout;
