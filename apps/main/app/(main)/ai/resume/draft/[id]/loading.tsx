// Hand-matched to the resume editor (_components/resume-editor.tsx).
//
// Geometry copied from the real component rather than approximated. The version
// this replaces split the row 50/50 at `lg` and had no tab strip at all, so the
// form pane jumped from half the width to 560px and grew a row of tabs the
// moment the editor resolved.
//
// What it matches now: a 48px top bar (`h-12`), a form pane that is full width
// below xl and 560/620px above it, a 36px tab strip (`h-9`) with five triggers,
// and a preview pane that only exists at xl and up - below that the real editor
// gives the whole row to the form, because a 595px page does not fit in what is
// left over.
import { Shimmer, ShimmerStyles } from "@repo/ui/components/skeleton-kit";

export default function Loading() {
    return (
        <div className="flex h-dvh w-full flex-col overflow-hidden">
            <ShimmerStyles />

            {/* Top bar: back, name, template select, then the action buttons. */}
            <div className="flex h-12 shrink-0 items-center gap-3 border-b border-neutral-200 bg-white px-4 dark:border-neutral-800 dark:bg-neutral-900">
                <Shimmer className="h-8 w-8 rounded-lg" />
                <Shimmer className="h-7 w-48 rounded-md" delay={0.04} />
                <Shimmer className="h-7 w-40 rounded-md" delay={0.07} />
                <div className="ml-auto flex items-center gap-2">
                    <Shimmer className="h-7 w-28 rounded-md" delay={0.1} />
                    <Shimmer className="h-7 w-24 rounded-md" delay={0.12} />
                    <Shimmer className="h-7 w-20 rounded-md" delay={0.14} />
                    <Shimmer className="h-7 w-16 rounded-md" delay={0.16} />
                    <Shimmer className="h-7 w-20 rounded-md" delay={0.18} />
                </div>
            </div>

            <div className="flex min-h-0 flex-1 overflow-hidden">
                {/* Form pane. Same widths as the editor's. */}
                <div className="w-full shrink-0 overflow-hidden border-r border-neutral-200 bg-white xl:w-[560px] 2xl:w-[620px] dark:border-neutral-800 dark:bg-neutral-900">
                    {/* Tab strip: five triggers, 36px tall, flush to the top. */}
                    <div className="flex h-9 items-center gap-1 border-b border-neutral-200 px-4 dark:border-neutral-800">
                        {/* Widths track the trigger labels: header, experience, projects,
                            education, skills. `Shimmer` takes no style prop, so these are
                            classes. */}
                        {["w-14", "w-20", "w-16", "w-20", "w-12"].map((w, i) => (
                            <Shimmer key={i} className={`h-7 rounded-md ${w}`} delay={i * 0.04} />
                        ))}
                    </div>

                    <div className="space-y-3 p-4">
                        {/* Three grouped cards, matching a section's repeated entries. */}
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div
                                key={i}
                                className="space-y-2 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800"
                            >
                                <div className="flex items-center gap-2">
                                    <Shimmer className="h-7 flex-1 rounded-md" delay={i * 0.06} />
                                    <Shimmer className="h-7 w-7 rounded-md" delay={i * 0.06} />
                                </div>
                                <Shimmer className="h-7 w-full rounded-md" delay={i * 0.06 + 0.03} />
                            </div>
                        ))}
                        <Shimmer className="h-8 w-full rounded-md" delay={0.3} />
                    </div>
                </div>

                {/* Preview pane: grey ground, one page centred. xl and up only. */}
                <div className="hidden min-w-0 flex-1 items-start justify-center bg-neutral-200 p-6 xl:flex dark:bg-neutral-800">
                    <Shimmer className="h-full min-h-[480px] w-full max-w-[595px]" delay={0.12} />
                </div>
            </div>
        </div>
    );
}
