"use client";

import { motion } from "framer-motion";
import { Rocket, Clock, Star, Briefcase, ArrowRight, Plus, CheckCircle } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { useState } from "react";
import toast from "@repo/ui/components/ui/sonner";
import type { StudioStep, ProjectMetadata } from "@/types/studios";

interface ProjectStepProps {
  step: StudioStep;
}

export function ProjectStep({ step }: ProjectStepProps) {
  const metadata = (step.metadata || {}) as Partial<ProjectMetadata>;
  const [addedToPortfolio, setAddedToPortfolio] = useState<Record<string, boolean>>({});

  const handleAddToPortfolio = (projectId: string) => {
    setAddedToPortfolio(prev => ({ ...prev, [projectId]: true }));
    toast.success("Added to your portfolio!");
  };

  const handleCreateProject = (project: { title: string; description: string }) => {
    // Navigate to project creation with pre-filled data
    const params = new URLSearchParams({
      source: "studio",
      title: project.title,
      description: project.description,
    });
    window.open(`/projects?${params.toString()}`, "_self");
  };

  if (!metadata.suggestions || metadata.suggestions.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="py-8">
        <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
          No project suggestions available
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="py-8"
    >
      <div className="space-y-4">
        {metadata.suggestions.map((project) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-2xl overflow-hidden bg-gradient-to-br from-neutral-50 to-pink-50 dark:from-neutral-900/20 dark:to-pink-950/20 border border-neutral-200 dark:border-neutral-800 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-neutral-900 to-pink-500 flex items-center justify-center shrink-0">
                {project.projectType === "major" ? (
                  <Briefcase className="h-6 w-6 text-white" />
                ) : (
                  <Rocket className="h-6 w-6 text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h3 className="font-semibold text-neutral-900 dark:text-white">
                    {project.title}
                  </h3>
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${project.projectType === "major"
                      ? "bg-gradient-to-r from-neutral-900 to-pink-500 text-white"
                      : "bg-neutral-100 dark:bg-neutral-900/30 text-neutral-700 dark:text-neutral-100"
                    }`}>
                    {project.projectType === "major" ? "🎯 Major" : "🚀 Minor"}
                  </span>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                  {project.description}
                </p>

                {/* Meta info */}
                <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                  {project.estimatedHours && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {project.estimatedHours}h
                    </div>
                  )}
                  {project.difficulty && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4" />
                      <span className="capitalize">{project.difficulty}</span>
                    </div>
                  )}
                </div>

                {/* Tech stack */}
                {project.techStack && project.techStack.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="px-2 py-1 text-xs rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}

                {/* Features */}
                {project.features && project.features.length > 0 && (
                  <div className="mb-4 space-y-1">
                    {project.features.slice(0, 5).map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                        <span className="text-neutral-900 dark:text-neutral-100 mt-0.5">•</span>
                        {feature}
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 flex-wrap">
                  {project.projectType === "minor" ? (
                    <>
                      {addedToPortfolio[project.id] ? (
                        <Button size="sm" variant="outline" disabled className="gap-2">
                          <CheckCircle className="h-4 w-4 text-neutral-900 dark:text-neutral-100" />
                          Added to Portfolio
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2"
                          onClick={() => handleAddToPortfolio(project.id)}
                        >
                          <Plus className="h-4 w-4" />
                          Add to Portfolio
                        </Button>
                      )}
                    </>
                  ) : (
                    <Button
                      size="sm"
                      className="gap-2 bg-gradient-to-r from-neutral-800 to-pink-600 hover:from-neutral-700 hover:to-pink-700"
                      onClick={() => handleCreateProject(project)}
                    >
                      <ArrowRight className="h-4 w-4" />
                      Create Full Project
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
