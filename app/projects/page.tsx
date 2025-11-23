"use client";

import React, { useEffect, useState } from "react";
import { PlusCircle, FolderKanban, Clock } from "lucide-react";
import CreateProjectModal from "@/components/createProjectModal";
import axios from "axios";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";

interface Project {
  id: string;
  name: string;
  description: string;
  updatedAt: string;
  dbType: string;
}

const DB_TYPES: Record<string, { label: string; color: string; icon: string }> =
  {
    postgres: {
      label: "PostgreSQL",
      color: "bg-sky-500/10 text-sky-400 border-sky-500/20",
      icon: "🐘",
    },
    mysql: {
      label: "MySQL",
      color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      icon: "🐬",
    },
    mongodb: {
      label: "MongoDB",
      color: "bg-green-500/10 text-green-400 border-green-500/20",
      icon: "🍃",
    },
    other: {
      label: "Database",
      color: "bg-gray-500/10 text-gray-400 border-gray-500/20",
      icon: "🗃️",
    },
  };

function formatUpdatedDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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
    <div className="m-2 flex-1 flex flex-col backdrop-blur-md bg-white/10 dark:bg-zinc-900/30 border border-border rounded-xl overflow-hidden relative">
      {/* Ambient background gradients */}
      <motion.div
        className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-chart-3/5 rounded-full blur-3xl pointer-events-none"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />

      {/* Header */}
      <motion.div
        className="relative z-10 border-b border-border/50 bg-card/30 backdrop-blur-xl px-6 py-4"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold gradient-green-text mb-1">
              My Projects
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage and organize your database projects
            </p>
          </div>
          <motion.button
            onClick={() => setIsModalOpen(true)}
            className="gradient-green-button px-4 py-2 rounded-lg font-semibold text-sm 
              flex items-center gap-2 glow-green"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <PlusCircle className="size-4" />
            New Project
          </motion.button>
        </div>
      </motion.div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto relative z-10 p-6">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              className="flex flex-col items-center justify-center py-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
              />
              <p className="mt-4 text-sm text-muted-foreground">
                Loading projects...
              </p>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              className="text-center py-20"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-500/10 mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
              <p className="text-red-400 font-medium">{error}</p>
            </motion.div>
          ) : projects.length === 0 ? (
            <motion.div
              key="empty"
              className="text-center py-20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className="inline-block mb-4"
                animate={{ y: [0, -8, 0] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <FolderKanban className="size-14 text-muted-foreground/50" />
              </motion.div>
              <p className="text-muted-foreground text-lg">No projects yet</p>
              <p className="text-sm text-muted-foreground/70 mt-2">
                Create one to get started!
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Create New Project Card */}
              <motion.div
                onClick={() => setIsModalOpen(true)}
                className="group relative border-2 border-dashed border-border/50 rounded-2xl p-8 
                    flex flex-col items-center justify-center text-center cursor-pointer
                    bg-gradient-to-br from-card/30 to-card/50 backdrop-blur-sm
                    hover:border-primary/50 hover:bg-gradient-to-br hover:from-primary/5 hover:to-primary/10
                    transition-all duration-300 overflow-hidden min-h-[200px]"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 
                      group-hover:from-primary/10 group-hover:to-transparent transition-all duration-500"
                />

                <motion.div
                  whileHover={{ rotate: 90, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 10 }}
                >
                  <div
                    className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 
                      group-hover:bg-primary/20 transition-colors relative z-10"
                  >
                    <PlusCircle className="size-7 text-primary" />
                  </div>
                </motion.div>

                <h3 className="font-semibold text-lg mb-2 relative z-10">
                  Create New Project
                </h3>
                <p className="text-sm text-muted-foreground relative z-10">
                  Start building with AI-powered insights
                </p>
              </motion.div>

              {/* Project Cards */}
              {projects.map((project, index) => {
                const typeInfo = DB_TYPES[project.dbType] || DB_TYPES.other;
                return (
                  <motion.div
                    key={project.id}
                    onClick={() => router.push(`projects/${project.id}/chat`)}
                    className="group relative border border-border/50 rounded-2xl p-6 cursor-pointer
                        bg-gradient-to-br from-card/40 to-card/60 backdrop-blur-sm
                        hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5
                        transition-all duration-300 overflow-hidden"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Gradient overlay */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0
                          opacity-0 group-hover:opacity-100 
                          group-hover:from-primary/5 group-hover:via-transparent group-hover:to-chart-3/5
                          transition-all duration-500"
                    />

                    {/* Shine effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent 
                          opacity-0 group-hover:opacity-100"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: "100%" }}
                      transition={{ duration: 0.8 }}
                    />

                    <div className="relative z-10 flex flex-col h-full">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <motion.div
                          className="p-2.5 rounded-xl bg-primary/10 border border-primary/20"
                          whileHover={{ rotate: [0, -8, 8, -8, 0] }}
                          transition={{ duration: 0.5 }}
                        >
                          <FolderKanban className="size-5 text-primary" />
                        </motion.div>

                        <Badge
                          variant="secondary"
                          className={`flex items-center gap-1.5 capitalize border ${typeInfo.color}`}
                        >
                          <span>{typeInfo.icon}</span>
                          <span className="text-xs font-medium">
                            {typeInfo.label}
                          </span>
                        </Badge>
                      </div>

                      {/* Content */}
                      <div className="flex-1 mb-4">
                        <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-1">
                          {project.name}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                          {project.description}
                        </p>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border/30">
                        <div className="flex items-center gap-1.5">
                          <Clock className="size-3.5" />
                          <span>{formatUpdatedDate(project.updatedAt)}</span>
                        </div>
                        <motion.div
                          className="flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                          initial={{ x: -10 }}
                          whileHover={{ x: 0 }}
                        >
                          <span className="text-xs font-medium">Open</span>
                          <motion.div
                            animate={{ x: [0, 3, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            →
                          </motion.div>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <CreateProjectModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
      />
    </div>
  );
};

export default MyProjects;
