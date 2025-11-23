"use client";

import {
  BarChart3,
  ChevronsUpDown,
  FolderKanban,
  ImageIcon,
  Settings,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

const items = [
  { title: "Projects", url: "/projects", icon: FolderKanban },
  { title: "Graphs", url: "/graphs", icon: BarChart3 },
  { title: "Media", url: "/media", icon: ImageIcon },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { user } = useUser();
  const pathname = usePathname();

  return (
    <Sidebar
      collapsible="icon"
      className="
        bg-white/10 dark:bg-black/20
        backdrop-blur-xl
        border border-white/10 dark:border-white/10
        rounded-xl
        shadow-md
        transition-all  
      "
    >
      <SidebarHeader className="px-3 py-2">
        <SidebarTrigger />
      </SidebarHeader>

      <SidebarContent className="py-4">
        <SidebarGroup>
          {/* Brand / Title */}
          <SidebarGroupLabel
            className="
            font-audiowide text-xl tracking-wide px-3 
            bg-linear-to-r from-white via-gray-200 to-gray-300 
            bg-clip-text text-transparent select-none
          "
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-linear-to-br from-chart-1 to-chart-2 flex items-center justify-center">
                <Zap size={20} className="text-black" />
              </div>
              <span className="text-2xl font-bold font-display gradient-green-text">
                QueryIQ
              </span>
            </div>
          </SidebarGroupLabel>

          {/* Menu */}
          <SidebarGroupContent className="mt-6">
            <SidebarMenu className="gap-2">
              {items.map((item) => {
                const isActive = pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={`flex items-center gap-4 px-3 py-4 rounded-lg transition-all ${
                        isActive
                          ? "bg-white/20 text-primary font-semibold border border-white/20 shadow-sm"
                          : "hover:bg-white/10 text-foreground"
                      }`}
                    >
                      <Link href={item.url} className="flex items-center gap-5">
                        <item.icon
                          className={`size-6 transition-colors ${
                            isActive ? "text-primary" : "text-muted-foreground"
                          }`}
                        />
                        <span className="text-sm">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-white/10 mt-auto px-2">
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarImage
              src={user?.imageUrl}
              alt={user?.firstName || "avatar"}
            />
            <AvatarFallback className="rounded-lg">CN</AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">
              {user?.firstName} {user?.lastName}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {user?.emailAddresses?.[0]?.emailAddress}
            </span>
          </div>
          <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
