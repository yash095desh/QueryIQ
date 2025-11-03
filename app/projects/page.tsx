import { AppSidebar } from "@/components/app-sidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import React from "react";
import { PlusCircle, FolderKanban } from "lucide-react";

const projects = [
  {
    id: 1,
    name: "QueryIQ Data Analysis",
    description: "AI-powered query summarizer with real-time database insight extraction.",
    updatedAt: "2 days ago",
    status: "Active",
  },
  {
    id: 2,
    name: "StayFinder Platform",
    description: "Full-stack booking application with payments, maps, and automated workflows.",
    updatedAt: "1 week ago",
    status: "In Progress",
  },
  {
    id: 3,
    name: "QuickChat Realtime",
    description: "Realtime MERN chat app using Socket.IO and custom notifications.",
    updatedAt: "3 weeks ago",
    status: "Completed",
  },
];

const MyProjects = () => {
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Create New Card */}
            <div
              className="group border border-border rounded-xl p-6 flex flex-col items-center justify-center text-center 
              bg-white/10 dark:bg-zinc-800/40 backdrop-blur-lg hover:bg-white/20 transition-all cursor-pointer"
            >
              <PlusCircle className="size-10 text-muted-foreground group-hover:text-primary transition-colors" />
              <h3 className="mt-3 font-medium text-foreground">Create New Project</h3>
              <p className="text-sm text-muted-foreground mt-1">Start a new AI workspace</p>
            </div>

            {/* Project Cards */}
            {projects.map((project) => (
              <div
                key={project.id}
                className="border border-border rounded-xl p-5 flex flex-col justify-between 
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
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      project.status === "Active"
                        ? "bg-green-500/20 text-green-400"
                        : project.status === "Completed"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {project.status}
                  </span>
                  <span className="text-muted-foreground">Updated {project.updatedAt}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Subtle footer text */}
          <div className="text-center text-xs text-muted-foreground mt-8">
            Last synced a few minutes ago
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProjects;
