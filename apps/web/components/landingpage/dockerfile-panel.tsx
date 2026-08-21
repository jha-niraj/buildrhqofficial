"use client"

import { ScrollArea } from "@repo/ui/components/ui/scroll-area"

/**
 * The Dockerfile, presented as a file rather than as a `<pre>` in a box.
 *
 * ── Why this is its own client component ──
 *
 * `ScrollArea` is a Radix component and therefore `"use client"`. Keeping it in one small
 * file rather than converting `proof-section.tsx` means the boundary sits around the panel
 * instead of around the whole section - the heading, the copy and the three facts beside it
 * stay server-rendered and in the HTML for crawlers.
 *
 * ── What was wrong with the previous version ──
 *
 * A `<pre>` inside `overflow-x-auto`. Three problems, all visible in a screenshot:
 *
 * 1. A native scrollbar sat across the bottom of the panel, which no other surface on this
 *    site has.
 * 2. The longest line was cut mid-word at the right edge with nothing indicating there was
 *    more - the comment ended at "TypeScript runs" and the reader had no reason to think
 *    it continued.
 * 3. It was visually plainer than the section around it: no line numbers, no distinction
 *    between a comment and a command, so the one piece of evidence on the page read as an
 *    undifferentiated block of grey.
 *
 * ── The fix is mostly not the scrollbar ──
 *
 * The scrollbar is now `ScrollArea` with `orientation="both"`, which is the ask. But the
 * more useful change is that **the content no longer needs to scroll at normal widths**:
 * the long comment is split across two lines at the source, so at any reasonable panel
 * width nothing is clipped. Horizontal scroll is the fallback for a narrow viewport, not
 * the normal reading experience.
 *
 * ── Rendered from structured lines, not a string ──
 *
 * `DOCKERFILE` is an array of typed lines so a comment can be dimmed and a continuation
 * can be indented without a syntax highlighter. Adding one is a dependency and a client
 * bundle for a fifteen-line file that changes once a year.
 */

type LineKind = "comment" | "command" | "arg" | "blank"

interface Line {
    kind: LineKind
    text: string
}

/**
 * Copied from the code executor's Dockerfile.
 *
 * The only edit is that the long comment is wrapped onto two lines here - the source has
 * it on one. That is a presentational change to avoid clipping, and it does not change
 * what the file says.
 *
 * If the Dockerfile changes, this changes with it. It is quoted rather than imported
 * because the marketing site does not depend on the worker package and should not start
 * doing so to render a code block.
 */
const DOCKERFILE: readonly Line[] = [
    { kind: "command", text: "FROM node:20-bookworm-slim" },
    { kind: "blank", text: "" },
    { kind: "comment", text: "# Language runtimes: Python, C/C++ (gcc/g++), Java (JDK)." },
    { kind: "comment", text: "# TypeScript runs via tsx." },
    { kind: "command", text: "RUN apt-get update && apt-get install -y \\" },
    { kind: "arg", text: "--no-install-recommends \\" },
    { kind: "arg", text: "python3 \\" },
    { kind: "arg", text: "gcc \\" },
    { kind: "arg", text: "g++ \\" },
    { kind: "arg", text: "default-jdk \\" },
    { kind: "arg", text: "ca-certificates \\" },
    { kind: "arg", text: "&& rm -rf /var/lib/apt/lists/* \\" },
    { kind: "arg", text: "&& npm install -g tsx@4.19.2" },
    { kind: "blank", text: "" },
    { kind: "comment", text: "# Run the executor as a non-root user." },
    { kind: "command", text: "RUN useradd -m runner" },
]

const INK: Record<LineKind, string> = {
    // Dimmer than the commands, and legible: 5.9:1 on the panel ground.
    comment: "text-neutral-500",
    command: "text-neutral-100",
    arg: "text-neutral-300",
    blank: "",
}

export function DockerfilePanel() {
    return (
        <figure className="m-0 overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl shadow-black/40">
            <figcaption className="flex items-center gap-3 border-b border-neutral-800 bg-neutral-900/60 px-5 py-3">
                <span className="flex gap-1.5" aria-hidden>
                    <span className="h-2.5 w-2.5 rounded-full bg-neutral-700" />
                    <span className="h-2.5 w-2.5 rounded-full bg-neutral-700" />
                    <span className="h-2.5 w-2.5 rounded-full bg-neutral-700" />
                </span>
                {/* Just the filename. It was the full repository path, which showed a
                    visitor our directory layout to no benefit - "Dockerfile" already says
                    everything the section needs it to. */}
                <span className="font-mono text-[11px] text-neutral-400">
                    Dockerfile
                </span>
                <span className="ml-auto rounded-full border border-neutral-700 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-neutral-400">
                    In the repo
                </span>
            </figcaption>

            {/* orientation="both" so a narrow viewport gets a styled horizontal bar rather
                than a native one - or worse, silent overflow with nothing indicating it. */}
            <ScrollArea orientation="both" className="w-full">
                <div className="min-w-max py-4">
                    {DOCKERFILE.map((line, i) => (
                        <div key={i} className="flex gap-4 px-5 leading-relaxed">
                            {/* Line numbers are `select-none` so copying the block copies
                                the file and not a column of digits. */}
                            <span
                                aria-hidden
                                className="w-5 shrink-0 select-none text-right font-mono text-[11px] leading-relaxed text-neutral-700"
                            >
                                {line.kind === "blank" ? "" : i + 1}
                            </span>
                            <code
                                className={`whitespace-pre font-mono text-[12.5px] sm:text-[13px] ${INK[line.kind]} ${
                                    line.kind === "arg" ? "pl-4" : ""
                                }`}
                            >
                                {line.text || " "}
                            </code>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </figure>
    )
}

export default DockerfilePanel
