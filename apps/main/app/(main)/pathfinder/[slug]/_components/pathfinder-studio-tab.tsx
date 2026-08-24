"use client";

import { useEffect, useState } from "react";
import { StudioContainer } from "@/components/studio/studio-container";
import { getStudioWithSteps } from "@/actions/(main)/studios/studio.actions";
import { createStudioForGoal } from "@/actions/(main)/studios/pathfinder-integration.actions";
import { Loader2, StickyNote } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import type { StudioWithSteps } from "@/types/studios";

interface PathfinderStudioTabProps {
  goalId: string;
  goalTitle: string;
  goalDescription?: string;
  studioId?: string;
}

export function PathfinderStudioTab({
  goalId,
  goalTitle,
  goalDescription,
  studioId: initialStudioId,
}: PathfinderStudioTabProps) {
  const [studio, setStudio] = useState<StudioWithSteps | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [studioId, setStudioId] = useState(initialStudioId);

  useEffect(() => {
    loadStudio();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studioId]);

  const loadStudio = async () => {
    if (!studioId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const result = await getStudioWithSteps(studioId);
    if (result.success && result.studio) {
      setStudio(result.studio);
    }
    setLoading(false);
  };

  const handleCreateStudio = async () => {
    setCreating(true);
    const result = await createStudioForGoal(goalId, goalTitle, goalDescription ?? goalTitle);
    if (result.success && result.studioId) {
      setStudioId(result.studioId);
    }
    setCreating(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-900 dark:text-neutral-100" />
      </div>
    );
  }

  if (!studioId || !studio) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-20 w-20 rounded-full bg-neutral-100 dark:bg-neutral-900/30 flex items-center justify-center mb-4">
          <StickyNote className="h-10 w-10 text-neutral-900 dark:text-neutral-100" />
        </div>
        <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
          No Studio Yet
        </h3>
        <p className="text-neutral-600 dark:text-neutral-400 max-w-md mb-6">
          Create an AI-powered learning workspace for this goal. Add explanations,
          quizzes, code challenges, and more!
        </p>
        <Button
          onClick={handleCreateStudio}
          disabled={creating}
          className="gap-2 bg-gradient-to-r from-neutral-800 to-pink-600 hover:from-neutral-700 hover:to-pink-700"
        >
          {creating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <StickyNote className="h-4 w-4" />
              Create Studio
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100dvh-200px)]">
      <StudioContainer
        studio={studio}
        backUrl={`/pathfinder/${goalId}`}
        backLabel="Back to Goal"
      />
    </div>
  );
}
