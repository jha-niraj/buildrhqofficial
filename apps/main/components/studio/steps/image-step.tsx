"use client";

import { motion } from "framer-motion";
import { Image as ImageIcon, Download, RefreshCw, ZoomIn } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { useState } from "react";
import type { StudioStep, ImageMetadata } from "@/types/studios";
import Image from "next/image";

interface ImageStepProps {
  step: StudioStep;
}

export function ImageStep({ step }: ImageStepProps) {
  const metadata = (step.metadata || {}) as Partial<ImageMetadata>;
  const [isZoomed, setIsZoomed] = useState(false);

  const handleDownload = () => {
    if (!metadata.url) return;
    const link = document.createElement("a");
    link.href = metadata.url;
    link.download = `studio-image-${step.id}.png`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="py-8"
    >
      <div className="rounded-2xl overflow-hidden bg-white dark:bg-neutral-900 shadow-sm">
        {metadata.url ? (
          <div className="relative group">
            <Image
              src={metadata.url}
              alt={metadata.prompt || "Generated image"}
              width={0}
              height={0}
              sizes="100vw"
              className="w-full h-auto cursor-pointer transition-transform"
              onClick={() => setIsZoomed(!isZoomed)}
              unoptimized
            />
            {/* Overlay actions */}
            <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8 bg-white/80 dark:bg-black/60 backdrop-blur-sm"
                onClick={() => setIsZoomed(!isZoomed)}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8 bg-white/80 dark:bg-black/60 backdrop-blur-sm"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ImageIcon className="h-12 w-12 text-neutral-600 dark:text-neutral-400 mb-4" />
            <p className="text-neutral-600 dark:text-neutral-400">
              Image not available
            </p>
          </div>
        )}
        {metadata.prompt && (
          <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {metadata.prompt}
            </p>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs gap-1 shrink-0"
              onClick={() => { }}
            >
              <RefreshCw className="h-3 w-3" />
              Regenerate
            </Button>
          </div>
        )}
      </div>

      {/* Zoom overlay */}
      {isZoomed && metadata.url && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8 cursor-pointer"
          onClick={() => setIsZoomed(false)}
        >
          <Image
            src={metadata.url}
            alt={metadata.prompt || "Generated image"}
            width={0}
            height={0}
            sizes="100vw"
            className="max-w-full max-h-full object-contain rounded-lg"
            unoptimized
          />
        </motion.div>
      )}
    </motion.div>
  );
}
