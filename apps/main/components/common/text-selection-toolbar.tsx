"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";

interface TextSelectionToolbarProps {
    containerRef: React.RefObject<HTMLElement | null>;
    onAskAI: (selectedText: string, prompt: string) => void;
    onCopy?: (text: string) => void;
}

export function TextSelectionToolbar({ containerRef, onAskAI, onCopy }: TextSelectionToolbarProps) {
    const [visible, setVisible] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [selectedText, setSelectedText] = useState("");
    const toolbarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleMouseUp = () => {
            const selection = window.getSelection();
            const text = selection?.toString().trim() ?? "";

            if (!text) {
                setVisible(false);
                return;
            }

            const range = selection?.getRangeAt(0);
            const rect = range?.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();

            if (rect && containerRect) {
                setPosition({
                    top: rect.top - containerRect.top - 40,
                    left: rect.left - containerRect.left + rect.width / 2,
                });
                setSelectedText(text);
                setVisible(true);
            }
        };

        const handleMouseDown = (e: MouseEvent) => {
            if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
                setVisible(false);
            }
        };

        container.addEventListener("mouseup", handleMouseUp);
        document.addEventListener("mousedown", handleMouseDown);
        return () => {
            container.removeEventListener("mouseup", handleMouseUp);
            document.removeEventListener("mousedown", handleMouseDown);
        };
    }, [containerRef]);

    if (!visible) return null;

    return (
        <div
            ref={toolbarRef}
            className="absolute z-50 -translate-x-1/2 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl p-1 flex items-center gap-1"
            style={{ top: position.top, left: position.left }}
        >
            <button
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white hover:bg-neutral-800 rounded-md transition-colors"
                onClick={() => {
                    onAskAI(selectedText, `Explain this: "${selectedText}"`);
                    setVisible(false);
                }}
            >
                <Sparkles className="w-3.5 h-3.5 text-neutral-800 dark:text-neutral-200" />
                Ask AI
            </button>
            {onCopy && (
                <button
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white hover:bg-neutral-800 rounded-md transition-colors"
                    onClick={() => {
                        onCopy(selectedText);
                        setVisible(false);
                    }}
                >
                    Copy
                </button>
            )}
        </div>
    );
}
