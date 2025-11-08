"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import React, { useEffect, useState } from "react";
import { PlusCircle, FolderKanban } from "lucide-react";
import CreateProjectModal from "@/components/createProjectModal";
import axios from "axios";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";


interface Project {
  id: string;
  name: string;
  description: string;
  updatedAt: string;
  dbType: string;
}

const DB_TYPES: Record<
  string,
  { label: string; color: string; icon: string }
> = {
  postgres: { label: "postgres", color: "bg-sky-500/20 text-sky-400", icon: "🐘" },
  mysql: { label: "mysql", color: "bg-blue-500/20 text-blue-400", icon: "🐬" },
  mongodb: { label: "mongodb", color: "bg-green-500/20 text-green-400", icon: "🍃" },
  other: { label: "Unknown", color: "bg-gray-500/20 text-gray-400", icon: "🗃️" },
};


function formatUpdatedDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Today";
  if (diff === 1) return "1 day ago";
  if (diff < 7) return `${diff} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const MyProjects = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();


  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/api/projects");
        setProjects(response.data?.projects || []);
      } catch (err: any) {
        console.error("Error fetching projects:", err);
        setError("Failed to load projects");
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  return (
    <div className="flex w-full h-screen p-2 gap-2">
      {/* Sidebar */}
      <AppSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col backdrop-blur-md bg-white/10 dark:bg-zinc-900/30 border border-border rounded-xl overflow-hidden">
        {/* Header */}
        <div className="border-b border-border p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <h2 className="text-lg font-semibold tracking-wide">My Projects</h2>
          </div>
          <p className="text-sm text-muted-foreground mr-2">Welcome back, Yash</p>
        </div>

        {/* Content */}
        <div className="flex-1 w-full max-w-6xl mx-auto p-6 overflow-y-auto">
          {loading ? (
            <div className="text-center text-muted-foreground py-10">
              Loading projects...
            </div>
          ) : error ? (
            <div className="text-center text-red-400 py-10">{error}</div>
          ) : projects.length === 0 ? (
            <div className="text-center text-muted-foreground py-10">
              No projects yet. Create one to get started!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Create New Project Card */}
              <div
                onClick={() => setIsModalOpen(true)}
                className="group border border-border rounded-xl p-6 flex flex-col items-center justify-center text-center 
                bg-white/10 dark:bg-zinc-800/40 backdrop-blur-lg hover:bg-white/20 transition-all cursor-pointer"
              >
                <PlusCircle className="size-10 text-muted-foreground group-hover:text-primary transition-colors" />
                <h3 className="mt-3 font-medium text-foreground">Create New Project</h3>
                <p className="text-sm text-muted-foreground mt-1">Start a new AI workspace</p>
              </div>

              {/* Existing Projects */}
              {projects.map((project) => {
                const typeInfo = DB_TYPES[project.dbType] || DB_TYPES.other;
                return (
                  <div
                    key={project.id}
                    onClick={() => router.push(`/chat/${project.id}`)}
                    className="border border-border rounded-xl p-5 flex flex-col justify-between cursor-pointer 
                    bg-white/10 dark:bg-zinc-800/40 backdrop-blur-lg hover:bg-white/20 transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <FolderKanban className="size-6 text-primary" />
                        <h3 className="font-semibold text-lg">{project.name}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {project.description}
                      </p>
                    </div>

                    <div className="mt-4 flex justify-between items-center text-sm">
                      <Badge
                        variant="secondary"
                        className={`flex items-center gap-1 capitalize ${typeInfo.color}`}
                      >
                        <span>{typeInfo.icon}</span>
                        {typeInfo.label}
                      </Badge>
                      <span className="text-muted-foreground">
                        Updated {formatUpdatedDate(project.updatedAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground mt-8">
            Last synced a few minutes ago
          </div>
        </div>
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} />
    </div>
  );
};

export default MyProjects;
