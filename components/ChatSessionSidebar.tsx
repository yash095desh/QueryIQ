"use client";

import { MessageSquare, Plus, Trash2, Clock, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
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
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ChatSession {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    messages: number;
  };
}

export function ChatSessionSidebar() {
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params.projectId as string;
  const currentSessionId = searchParams.get("session");

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (projectId) {
      loadSessions();
    }
  }, [projectId]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/chat/${projectId}/sessions`);
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error("Failed to load sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!sessionToDelete) return;

    try {
      const response = await fetch(
        `/api/chat/${projectId}/sessions/${sessionToDelete}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionToDelete));

        if (sessionToDelete === currentSessionId) {
          window.location.href = `/project/${projectId}/chat`;
        }
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
    } finally {
      setDeleteDialogOpen(false);
      setSessionToDelete(null);
    }
  };

  return (
    <>
      <Sidebar
        side="right"
        className="
            bg-white/10 dark:bg-black/20
            backdrop-blur-xl
            border border-white/10 dark:border-white/10
            rounded-xl
            shadow-md
            transition-all  
          "
      >
        <SidebarContent className="py-4">
          <SidebarGroup>
            <div className="px-3 flex items-center justify-between mb-4">
              <SidebarGroupLabel className="font-semibold text-sm">
                Chat History
              </SidebarGroupLabel>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" asChild>
                <Link href={`/projects/${projectId}/chat`}>
                  <Plus className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <SidebarGroupContent>
              <ScrollArea className="h-[calc(100vh-200px)]">
                <SidebarMenu className="gap-1 w-full">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : sessions.length === 0 ? (
                    <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                      No chat history yet
                    </div>
                  ) : (
                    sessions.map((session) => {
                      const isActive = session.id === currentSessionId;
                      return (
                        <SidebarMenuItem key={session.id} className="w-full">
                          <div className="group relative w-full">
                            <SidebarMenuButton
                              asChild
                              className={`flex items-center gap-2 rounded-lg transition-all pr-8 w-full ${
                                isActive
                                  ? "bg-white/20 text-primary font-medium border border-white/20 shadow-sm"
                                  : "hover:bg-white/10 text-foreground"
                              }`}
                            >
                              <Link
                                href={`/projects/${projectId}/chat?session=${session.id}`}
                                className="flex items-center gap-2 min-w-0 w-full overflow-hidden"
                              >
                                <MessageSquare
                                  className={`h-4 w-4 shrink-0 ${
                                    isActive
                                      ? "text-primary"
                                      : "text-muted-foreground"
                                  }`}
                                />
                                <span className="text-xs truncate block flex-1 min-w-0">
                                  {session.title}
                                </span>
                              </Link>
                            </SidebarMenuButton>

                            <Button
                              size="sm"
                              variant="ghost"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                              onClick={(e) => {
                                e.preventDefault();
                                setSessionToDelete(session.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        </SidebarMenuItem>
                      );
                    })
                  )}
                </SidebarMenu>
              </ScrollArea>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat Session?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              chat session and all its messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
