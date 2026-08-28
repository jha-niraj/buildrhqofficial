"use client";

import { motion } from "framer-motion";
import { FileText, ExternalLink, Globe, BookOpen, GraduationCap } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import type { StudioStep, DocumentMetadata } from "@/types/studios";

interface DocumentStepProps {
  step: StudioStep;
}

export function DocumentStep({ step }: DocumentStepProps) {
  const metadata = (step.metadata || {}) as Partial<DocumentMetadata> & { docs?: Array<{ url: string; title?: string; type?: string; description?: string }> };

  // Support both single doc (metadata.url) and multiple docs (metadata.docs from Exa)
  const docs = metadata.docs?.length
    ? metadata.docs
    : metadata.url
      ? [{ url: metadata.url, title: metadata.title, type: metadata.docType, description: metadata.description }]
      : [];

  const getDocTypeIcon = (type?: string) => {
    switch (type || metadata.docType) {
      case "documentation":
        return <BookOpen className="h-6 w-6 text-neutral-800 dark:text-neutral-100" />;
      case "tutorial":
        return <GraduationCap className="h-6 w-6 text-neutral-800 dark:text-neutral-100" />;
      case "article":
      default:
        return <FileText className="h-6 w-6 text-neutral-800 dark:text-neutral-100" />;
    }
  };

  const getDocTypeLabel = (type?: string) => {
    switch (type || metadata.docType) {
      case "documentation":
        return "Official Documentation";
      case "tutorial":
        return "Tutorial";
      case "article":
        return "Article";
      default:
        return "Document";
    }
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace("www.", "");
    } catch {
      return url;
    }
  };

  if (docs.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-8"
      >
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl bg-neutral-100 dark:bg-neutral-800">
          <FileText className="h-12 w-12 text-neutral-600 dark:text-neutral-400 mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400">No documents available</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="py-8 space-y-4"
    >
      {docs.map((doc, i) => (
        <div
          key={i}
          className="rounded-2xl overflow-hidden bg-white dark:bg-neutral-900 shadow-sm border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group"
        >
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-neutral-100 dark:bg-neutral-900/30 flex items-center justify-center shrink-0">
                {getDocTypeIcon(doc.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-neutral-900 dark:text-white mb-1 group-hover:text-neutral-800 dark:group-hover:text-neutral-100 transition-colors">
                  {doc.title || "Document"}
                </h3>
                {doc.description && (
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3 line-clamp-2">
                    {doc.description}
                  </p>
                )}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-neutral-100 dark:bg-neutral-900/30 text-neutral-700 dark:text-neutral-100">
                    {getDocTypeLabel(doc.type)}
                  </span>
                  {doc.url && (
                    <span className="inline-flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                      <Globe className="h-3 w-3" />
                      {getDomain(doc.url)}
                    </span>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 shrink-0"
                onClick={() => doc.url && window.open(doc.url, "_blank")}
              >
                <ExternalLink className="h-4 w-4" />
                Open
              </Button>
            </div>
          </div>
        </div>
      ))}
    </motion.div>
  );
}
