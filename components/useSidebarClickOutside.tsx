"use client";

import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils"; 
import * as React from "react";

export function SidebarOverlay() {
  const { open, setOpen } = useSidebar();

  if (!open) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-40 bg-black/50 transition-opacity duration-300",
        open ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      onClick={() => setOpen(false)}
    />
  );
}