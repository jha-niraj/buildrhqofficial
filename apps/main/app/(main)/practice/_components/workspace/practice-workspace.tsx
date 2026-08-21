"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft, Clock, Send, Loader2, CheckCircle2, AlertCircle, Play,
    Mic, MicOff, Volume2, Square,
} from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Badge } from "@repo/ui/components/ui/badge";
import { ScrollArea } from "@repo/ui/components/ui/scroll-area";
import { Textarea } from "@repo/ui/components/ui/textarea";
import { cn } from "@repo/ui/lib/utils";
import dynamic from "next/dynamic";
import { useTheme } from "@repo/ui/components/themeprovider";
import {
    usePracticeStore, type PracticeWorkspaceState,
} from "@/app/store/practiceStore";
import {
    saveSessionProgress, updateSessionAfterAssess,
} from "@/actions/(main)/practice";
import {
    assessPracticeWork, getMentorResponse,
} from "@/actions/(main)/practice";
import { getScribeToken, generateTTSAudio } from "@/actions/(main)/practice";
import {
    executeCode, type ExecuteCodeResult, type TestCase,
} from "@/actions/(main)/practice/execute-code.action";
import CodeEditor from "@/components/main/code-editor";
import type {
    PracticeProblemDetail, PracticeSessionData, PracticeMode,
    PracticeChatMessage,
} from "@/types/practice";
import { getPathFromModule } from "@/types/practice";
import { MarkdownRenderer } from "@/components/common/markdown-renderer";
import { useScribe } from "@elevenlabs/react";
import { TextSelectionToolbar } from "@/components/common/text-selection-toolbar";
import toast from "@repo/ui/components/ui/sonner";
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from "react-resizable-panels";
import { SDComponentLibrary } from "./sd-component-library";
import { APITester } from "./api-tester";

const ExcalidrawCanvas = dynamic(
    () => import("./excalidraw-canvas"),
    {
        ssr: false,
        loading: () => (
            <div className="h-full flex items-center justify-center bg-neutral-900 text-neutral-500 dark:text-neutral-400 text-sm">
                Loading canvas...
            </div>
        ),
    }
);

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

const DIFFICULTY_COLORS: Record<string, string> = {
    EASY: "text-neutral-900",
    MEDIUM: "text-neutral-900",
    HARD: "text-red-500",
};

const DSA_LANGUAGES = ["javascript", "typescript", "python", "java", "cpp"];

interface PracticeWorkspaceProps {
    problem: PracticeProblemDetail;
    session: PracticeSessionData | null;
    mode: PracticeMode;
}

export function PracticeWorkspace({ problem, session, mode }: PracticeWorkspaceProps) {
    const router = useRouter();
    const { theme } = useTheme();
    const store = usePracticeStore();
    const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const problemPanelRef = useRef<HTMLDivElement>(null);
    const sendToChatRef = useRef<((message: string) => void) | null>(null);

    // Code execution state
    const [execResult, setExecResult] = useState<ExecuteCodeResult | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [showOutput, setShowOutput] = useState(false);

    // Initialize store on mount
    useEffect(() => {
        if (session) {
            store.initialize(problem, session);
        }
        return () => {
            store.reset();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [problem.id, session?.id]);

    // Timer
    useEffect(() => {
        if (store.isTimerRunning && session) {
            timerRef.current = setInterval(() => {
                store.incrementTimer();
            }, 1000);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [store.isTimerRunning]);

    // Auto-save every 30s
    useEffect(() => {
        if (!session) return;
        autoSaveRef.current = setInterval(async () => {
            if (store.isDirty) {
                store.setSaving(true);
                await saveSessionProgress(session.id, {
                    code: store.code,
                    cssCode: store.cssCode,
                    canvasData: store.canvasData as object,
                    language: store.language,
                    chatHistory: store.chatHistory,
                    totalTimeSeconds: store.elapsedSeconds,
                });
                store.markClean();
                store.setSaving(false);
            }
        }, 30000);
        return () => {
            if (autoSaveRef.current) clearInterval(autoSaveRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session?.id]);

    const handleBack = () => {
        const path = getPathFromModule(problem.module);
        router.push(`/practice/${path}`);
    };

    const formatTime = (seconds: number): string => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    if (!session) {
        return (
            <div className="h-screen flex items-center justify-center bg-neutral-950 text-white">
                <div className="text-center">
                    <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
                    <p className="text-sm">Please sign in to start practicing.</p>
                    <Button variant="outline" onClick={handleBack} className="mt-4">
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    const isWebModule = problem.module === "WEB_FRONTEND" || problem.module === "WEB_BACKEND";
    const isSystemDesign = problem.module === "SYSTEM_DESIGN";

    return (
        <div className="h-screen flex flex-col bg-neutral-950 text-white">
            <header className="h-12 border-b border-neutral-800 flex items-center justify-between px-4 flex-shrink-0 bg-neutral-950/90 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <button onClick={handleBack} className="cursor-pointer text-neutral-400 hover:text-white transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div className="h-4 w-px bg-neutral-700" />
                    <h1 className="text-sm font-medium truncate max-w-[300px]">{problem.title}</h1>
                    <Badge variant="outline" className={cn("text-[10px] border-neutral-700", DIFFICULTY_COLORS[problem.difficulty])}>
                        {problem.difficulty}
                    </Badge>
                    <Badge variant="outline" className={cn(
                        "text-[10px] border-neutral-700",
                        mode === "EXAM" ? "text-red-400 border-red-800" : "text-neutral-800 dark:text-neutral-200 border-neutral-800"
                    )}>
                        {mode === "EXAM" ? "🔒 Exam" : "💡 Assist"}
                    </Badge>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-neutral-400 text-xs">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="font-mono">{formatTime(store.elapsedSeconds)}</span>
                    </div>
                    {
                        store.isSaving && (
                            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 animate-pulse">Saving...</span>
                        )
                    }
                    {
                        !isSystemDesign && (
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={isRunning}
                                className="text-xs h-8 border-neutral-700 hover:bg-neutral-800 disabled:opacity-50"
                                onClick={async () => {
                                    if (!store.code.trim()) {
                                        toast.error("Write some code first!");
                                        return;
                                    }
                                    setIsRunning(true);
                                    setShowOutput(true);
                                    setExecResult(null);
                                    try {
                                        // DSA/coding problems use code-execution test cases (input/output pairs),
                                        // not API test cases - pass empty array and let AI evaluate output
                                        const testCases: TestCase[] = [];
                                        const result = await executeCode(
                                            store.code,
                                            store.language as Parameters<typeof executeCode>[1],
                                            testCases
                                        );
                                        setExecResult(result);
                                        // Send output to AI chat for Socratic evaluation
                                        if (mode === "ASSIST") {
                                            const outputSummary = result.stderr
                                                ? `stdout: ${result.stdout || "(none)"}\nstderr: ${result.stderr}`
                                                : result.stdout || "(no output)";
                                            const passInfo = result.testResults
                                                ? ` ${result.testResults.filter(t => t.passed).length}/${result.testResults.length} test cases passed.`
                                                : "";
                                            const chatMsg = `🔄 I ran my code (${store.language}).\nOutput: \`\`\`\n${outputSummary}\n\`\`\`${passInfo}\nPlease evaluate this output and guide me.`;
                                            sendToChatRef.current?.(chatMsg);
                                        }
                                    } catch (err) {
                                        setExecResult({ success: false, error: String(err) });
                                    } finally {
                                        setIsRunning(false);
                                    }
                                }}
                            >
                                {isRunning ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Play className="h-3.5 w-3.5 mr-1" />}
                                {isRunning ? "Running..." : "Run"}
                            </Button>
                        )
                    }
                    <SubmitButton problem={problem} session={session} store={store} mode={mode} />
                </div>
            </header>
            <PanelGroup orientation="horizontal" className="h-[calc(100vh-48px)]">
                <Panel defaultSize="25%" minSize="15%" maxSize="40%">
                    <div className="h-full overflow-hidden relative" ref={problemPanelRef}>
                        <ProblemPanel problem={problem} requirementsMet={store.requirementsMet} />
                        {
                            mode === "ASSIST" && (
                                <TextSelectionToolbar
                                    containerRef={problemPanelRef}
                                    onAskAI={(text, prompt) => {
                                        const message = prompt || `Explain this: "${text}"`;
                                        sendToChatRef.current?.(message);
                                    }}
                                    onCopy={(text) => {
                                        navigator.clipboard.writeText(text);
                                        toast.success("Copied to clipboard!");
                                    }}
                                />
                            )
                        }
                    </div>
                </Panel>
                <PanelResizeHandle className="w-1 bg-neutral-800 hover:bg-neutral-900 transition-colors cursor-col-resize" />
                <Panel defaultSize={mode === "ASSIST" ? "40%" : "75%"} minSize="30%">
                    <div className="h-full overflow-hidden flex flex-col">
                        {
                            isSystemDesign ? (
                                <div className="flex-1 flex">
                                    <SDComponentLibrary
                                        onAddComponent={(comp) => {
                                            sendToChatRef.current?.(`I'm adding a ${comp.label} component to my design. What should I consider when using a ${comp.label}?`);
                                        }}
                                    />
                                    <div className="flex-1">
                                        <ExcalidrawCanvas
                                            initialData={store.canvasData}
                                            onChange={(data: { elements: unknown[]; appState: unknown }) => store.setCanvasData(data)}
                                            darkMode={theme === "dark"}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className={cn(
                                        "overflow-hidden",
                                        isWebModule ? "h-[55%]" :
                                        showOutput && execResult ? "h-[60%]" : "h-full"
                                    )}>
                                        <CodeEditor
                                            code={store.code}
                                            language={store.language}
                                            height="100%"
                                            onChange={(val) => store.setCode(val)}
                                            onLanguageChange={(lang) => store.setLanguage(lang)}
                                            showLanguageSelector={problem.module === "DSA"}
                                            showCopyButton={true}
                                            showRunButton={true}
                                            enableExecution={true}
                                            showExpandButton={false}
                                            allowedLanguages={problem.module === "DSA" ? DSA_LANGUAGES : ["javascript", "typescript"]}
                                            className="h-full rounded-none border-0"
                                        />
                                    </div>
                                    {showOutput && !isWebModule && (
                                        <OutputPanel
                                            result={execResult}
                                            isRunning={isRunning}
                                            onClose={() => setShowOutput(false)}
                                        />
                                    )}
                                    {
                                        isWebModule && (
                                            <div className="h-[45%] border-t border-neutral-800">
                                                <WebPreview code={store.code} css={store.cssCode} />
                                            </div>
                                        )
                                    }
                                    {
                                        problem.module === "WEB_BACKEND" && problem.testCases && (
                                            <div className="h-[40%] border-t border-neutral-800">
                                                <APITester
                                                    testCases={problem.testCases}
                                                    code={store.code}
                                                    onRunTest={async (tc, code) => {
                                                        const msg = `Analyze my code against this API test:\nMethod: ${tc.method} ${tc.path}\nExpected status: ${tc.expectedStatus}\nDescription: ${tc.description}${tc.body ? `\nRequest body: ${JSON.stringify(tc.body)}` : ""}\n\nMy code:\n\`\`\`\n${code}\n\`\`\`\n\nDoes my implementation handle this test case correctly? Answer with PASS or FAIL and explain why.`;
                                                        const result = await getMentorResponse(
                                                            problem.slug,
                                                            [],
                                                            msg,
                                                            code,
                                                            problem.module,
                                                            1
                                                        );
                                                        return result.success ? result.message : "Failed to analyze";
                                                    }}
                                                />
                                            </div>
                                        )
                                    }
                                </>
                            )
                        }
                    </div>
                </Panel>
                {
                    mode === "ASSIST" && (
                        <>
                            <PanelResizeHandle className="w-1 bg-neutral-800 hover:bg-neutral-900 transition-colors cursor-col-resize" />
                            <Panel defaultSize="35%" minSize="20%" maxSize="50%">
                                <div className="h-full overflow-hidden">
                                    <ChatPanel problem={problem} store={store} session={session} sendToChatRef={sendToChatRef} />
                                </div>
                            </Panel>
                        </>
                    )
                }
            </PanelGroup>
        </div>
    );
}

function ProblemPanel({
    problem,
    requirementsMet,
}: {
    problem: PracticeProblemDetail;
    requirementsMet: Record<string, boolean>;
}) {
    return (
        <ScrollArea className="w-full h-full">
            <div className="p-6 space-y-5">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold">{problem.title}</h2>
                    <Badge variant="outline" className={cn("text-[10px]", DIFFICULTY_COLORS[problem.difficulty])}>
                        {problem.difficulty}
                    </Badge>
                </div>
                <div className="prose prose-invert prose-sm max-w-none">
                    <MarkdownRenderer
                        content={problem.description}
                        className="[&>*:first-child]:mt-0 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-4 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-3 [&_p]:text-neutral-400 [&_p]:text-sm [&_p]:leading-relaxed [&_code]:text-xs [&_li]:text-sm [&_li]:text-neutral-400"
                    />
                </div>
                <div>
                    <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                        Requirements
                    </h3>
                    <div className="space-y-1.5">
                        {
                            problem.requirements.map((req, i) => {
                                const met = requirementsMet[`req-${i}`] ?? false;
                                return (
                                    <div key={i} className="flex items-start gap-2">
                                        {
                                            met ? (
                                                <CheckCircle2 className="h-4 w-4 text-neutral-900 dark:text-neutral-100 flex-shrink-0 mt-0.5" />
                                            ) : (
                                                <div className="h-4 w-4 rounded-full border border-neutral-600 flex-shrink-0 mt-0.5" />
                                            )
                                        }
                                        <span className={cn("text-sm", met ? "text-neutral-300" : "text-neutral-500 dark:text-neutral-400")}>
                                            {req}
                                        </span>
                                    </div>
                                );
                            })
                        }
                    </div>
                </div>

                {problem.hints.length > 0 && <HintsSection hints={problem.hints} />}

                {
                    problem.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-2">
                            {
                                problem.tags.map((tag) => (
                                    <Badge key={tag} variant="outline" className="text-[10px] border-neutral-700 text-neutral-400">
                                        {tag}
                                    </Badge>
                                ))
                            }
                        </div>
                    )
                }
            </div>
        </ScrollArea>
    );
}

function HintsSection({ hints }: { hints: string[] }) {
    const [revealed, setRevealed] = useState(0);
    return (
        <div>
            <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Hints</h3>
            <div className="space-y-2">
                {
                    hints.slice(0, revealed).map((hint, i) => (
                        <p key={i} className="text-sm text-neutral-400 bg-neutral-900 rounded-lg p-3 border border-neutral-800">
                            💡 {hint}
                        </p>
                    ))
                }
                {
                    revealed < hints.length && (
                        <button
                            onClick={() => setRevealed((r) => r + 1)}
                            className="cursor-pointer text-xs text-neutral-800 dark:text-neutral-200 hover:text-neutral-300 transition-colors"
                        >
                            Reveal hint {revealed + 1} of {hints.length}
                        </button>
                    )
                }
            </div>
        </div>
    );
}

function WebPreview({ code, css }: { code: string; css: string }) {
    const srcDoc = `<!DOCTYPE html>
<html>
<head><style>${css}</style></head>
<body>${code}</body>
</html>`;

    return (
        <div className="h-full flex flex-col">
            <div className="h-8 bg-neutral-900 border-b border-neutral-800 flex items-center px-3">
                <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium">Live Preview</span>
            </div>
            <iframe srcDoc={srcDoc} className="flex-1 bg-white" sandbox="allow-scripts" title="Live Preview" />
        </div>
    );
}

function OutputPanel({
    result,
    isRunning,
    onClose,
}: {
    result: ExecuteCodeResult | null;
    isRunning: boolean;
    onClose: () => void;
}) {
    return (
        <div className="h-[40%] border-t border-neutral-800 flex flex-col bg-neutral-950">
            <div className="h-8 flex items-center justify-between px-3 border-b border-neutral-800 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider">Output</span>
                    {result && !isRunning && (
                        <span className={cn(
                            "text-[10px] font-medium px-1.5 py-0.5 rounded",
                            result.exitCode === 0
                                ? "bg-neutral-900/50 text-neutral-800 dark:text-neutral-200"
                                : "bg-red-900/50 text-red-400"
                        )}>
                            {result.exitCode === 0 ? "✓ Exited 0" : `✗ Exit ${result.exitCode ?? "err"}`}
                        </span>
                    )}
                    {result?.executionTimeMs != null && (
                        <span className="text-[10px] text-neutral-600">{result.executionTimeMs}ms</span>
                    )}
                </div>
                <button onClick={onClose} className="cursor-pointer text-neutral-600 hover:text-neutral-400 text-xs">✕</button>
            </div>
            <div className="flex-1 overflow-auto p-3 font-mono text-xs">
                {isRunning ? (
                    <div className="flex items-center gap-2 text-neutral-400">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Running code...</span>
                    </div>
                ) : result ? (
                    <div className="space-y-3">
                        {result.error && !result.stdout && !result.stderr && (
                            <div className="text-red-400">{result.error}</div>
                        )}
                        {result.stdout && (
                            <div>
                                <div className="text-[10px] text-neutral-500 dark:text-neutral-400 mb-1">STDOUT</div>
                                <pre className="text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap break-all">{result.stdout}</pre>
                            </div>
                        )}
                        {result.stderr && (
                            <div>
                                <div className="text-[10px] text-neutral-500 dark:text-neutral-400 mb-1">STDERR</div>
                                <pre className="text-red-400 whitespace-pre-wrap break-all">{result.stderr}</pre>
                            </div>
                        )}
                        {result.testResults && result.testResults.length > 0 && (
                            <div>
                                <div className="text-[10px] text-neutral-500 dark:text-neutral-400 mb-2">
                                    TEST CASES - {result.testResults.filter(t => t.passed).length}/{result.testResults.length} passed
                                </div>
                                <div className="space-y-1.5">
                                    {result.testResults.map((tc, i) => (
                                        <div key={i} className={cn(
                                            "rounded px-2.5 py-1.5 border",
                                            tc.passed
                                                ? "border-neutral-800 bg-neutral-950/30"
                                                : "border-red-800 bg-red-950/30"
                                        )}>
                                            <div className="flex items-center gap-1.5">
                                                <span className={tc.passed ? "text-neutral-800 dark:text-neutral-200" : "text-red-400"}>
                                                    {tc.passed ? "✓" : "✗"}
                                                </span>
                                                <span className="text-neutral-300 text-[10px]">
                                                    {tc.description ?? `Test ${i + 1}`}
                                                </span>
                                            </div>
                                            {!tc.passed && (
                                                <div className="mt-1 grid grid-cols-3 gap-2 text-[10px]">
                                                    <div>
                                                        <span className="text-neutral-500 dark:text-neutral-400">Input: </span>
                                                        <span className="text-neutral-300">{tc.input || "(none)"}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-neutral-500 dark:text-neutral-400">Expected: </span>
                                                        <span className="text-neutral-800 dark:text-neutral-200">{tc.expectedOutput}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-neutral-500 dark:text-neutral-400">Got: </span>
                                                        <span className="text-red-400">{tc.actualOutput || "(none)"}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <span className="text-neutral-600">Run your code to see output here.</span>
                )}
            </div>
        </div>
    );
}

function ChatPanel({
    problem,
    store,
    session,
    sendToChatRef,
}: {
    problem: PracticeProblemDetail;
    store: PracticeWorkspaceState;
    session: PracticeSessionData;
    sendToChatRef: React.MutableRefObject<((message: string) => void) | null>;
}) {
    const [input, setInput] = useState("");
    const [isSpeaking, setIsSpeaking] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // ── ElevenLabs Scribe (official real-time STT) ──
    const scribe = useScribe({
        onPartialTranscript: (data) => {
            // Live partial transcript → show in input box in real time
            store.setVoiceTranscript(data.text);
            setInput(data.text);
        },
        onCommittedTranscript: (data) => {
            // Final committed transcript → set in input
            const committed = data.text.trim();
            if (committed) {
                setInput(committed);
                store.setVoiceTranscript(committed);
            }
        },
    });

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [store.chatHistory.length, store.isChatLoading]);

    // ── Start/Stop voice recording ──
    const toggleVoice = async () => {
        if (scribe.isConnected) {
            // Stop recording
            scribe.disconnect();
            store.setVoiceActive(false);

            // Auto-send the transcript if we have content
            const transcript = input.trim();
            if (transcript) {
                handleSend(transcript);
            }
        } else {
            // Start recording - fetch single-use token from server
            const tokenResult = await getScribeToken();
            if (!tokenResult.success) {
                console.error("Failed to get scribe token:", tokenResult.error);
                return;
            }

            store.setVoiceActive(true);
            setInput(""); // Clear input for fresh transcript

            await scribe.connect({
                token: tokenResult.token,
                microphone: {
                    echoCancellation: true,
                    noiseSuppression: true,
                },
            });
        }
    };

    // ── Send message (streaming) ──
    const handleSend = useCallback(async (messageText?: string) => {
        const trimmed = (messageText ?? input).trim();
        if (!trimmed || store.isChatLoading) return;

        const userMsg: PracticeChatMessage = {
            id: crypto.randomUUID(),
            role: "user",
            content: trimmed,
            timestamp: new Date().toISOString(),
        };

        store.addChatMessage(userMsg);
        setInput("");
        store.setVoiceTranscript("");
        store.setChatLoading(true);

        const history = store.chatHistory.map((m: PracticeChatMessage) => ({
            role: m.role,
            content: m.content,
        }));

        const assistantMsgId = crypto.randomUUID();
        const assistantMsg: PracticeChatMessage = {
            id: assistantMsgId,
            role: "assistant",
            content: "",
            timestamp: new Date().toISOString(),
        };
        store.addChatMessage(assistantMsg);

        try {
            const res = await fetch("/api/practice/mentor", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    problemSlug: problem.slug,
                    chatHistory: history,
                    userMessage: trimmed,
                    userCode: store.code,
                    attemptNumber: session.attempts + 1,
                }),
            });

            if (!res.ok || !res.body) {
                const fallback = await getMentorResponse(
                    problem.slug, history, trimmed, store.code, problem.module, session.attempts + 1
                );
                if (fallback.success) {
                    store.setChatHistory(
                        store.chatHistory.map((m) =>
                            m.id === assistantMsgId ? { ...m, content: fallback.message } : m
                        )
                    );
                }
                store.setChatLoading(false);
                return;
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let accumulated = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const text = decoder.decode(value, { stream: true });
                const lines = text.split("\n");

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        const data = line.slice(6);
                        if (data === "[DONE]") break;
                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.content) {
                                accumulated += parsed.content;
                                store.setChatHistory(
                                    store.chatHistory.map((m) =>
                                        m.id === assistantMsgId ? { ...m, content: accumulated } : m
                                    )
                                );
                            }
                        } catch {
                            // skip malformed chunks
                        }
                    }
                }
            }
        } catch {
            const fallback = await getMentorResponse(
                problem.slug, history, trimmed, store.code, problem.module, session.attempts + 1
            );
            if (fallback.success) {
                store.setChatHistory(
                    store.chatHistory.map((m) =>
                        m.id === assistantMsgId ? { ...m, content: fallback.message } : m
                    )
                );
            }
        }

        store.setChatLoading(false);
    }, [input, store, problem.slug, problem.module, session.attempts]);

    // Expose handleSend to parent via ref
    useEffect(() => {
        sendToChatRef.current = (message: string) => handleSend(message);
        return () => { sendToChatRef.current = null; };
    }, [handleSend, sendToChatRef]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // ── TTS: Play assistant message aloud ──
    const playTTS = async (text: string) => {
        if (isSpeaking) {
            // Stop current playback
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            setIsSpeaking(false);
            return;
        }

        setIsSpeaking(true);
        try {
            const result = await generateTTSAudio(text);
            if (result.success) {
                const audio = new Audio(`data:audio/mp3;base64,${result.audioBase64}`);
                audioRef.current = audio;
                audio.onended = () => {
                    setIsSpeaking(false);
                    audioRef.current = null;
                };
                audio.onerror = () => {
                    setIsSpeaking(false);
                    audioRef.current = null;
                };
                await audio.play();
            } else {
                setIsSpeaking(false);
            }
        } catch {
            setIsSpeaking(false);
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="h-10 border-b border-neutral-800 flex items-center justify-between px-4">
                <span className="text-xs font-semibold text-neutral-400">AI Mentor</span>
                {
                    scribe.isConnected && (
                        <span className="text-[10px] text-red-400 animate-pulse flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                            Listening...
                        </span>
                    )
                }
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {
                    store.chatHistory.length === 0 && (
                        <div className="text-center py-8">
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                Ask questions about the problem. I&apos;ll guide you with hints without giving away the answer.
                            </p>
                        </div>
                    )
                }
                {
                    store.chatHistory.map((msg: PracticeChatMessage) => (
                        <ChatBubble
                            key={msg.id}
                            message={msg}
                            onPlayTTS={msg.role === "assistant" ? () => playTTS(msg.content) : undefined}
                            isSpeaking={isSpeaking}
                        />
                    ))
                }
                {
                    store.isChatLoading && (
                        <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span className="text-xs">Thinking...</span>
                        </div>
                    )
                }
            </div>

            {
                scribe.isConnected && store.voiceTranscript && (
                    <div className="px-4 pb-1">
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 italic truncate">
                            🎙️ {store.voiceTranscript}
                        </p>
                    </div>
                )
            }

            <div className="border-t border-neutral-800 p-3">
                <div className="flex items-end gap-2">
                    <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={scribe.isConnected ? "Listening... speak now" : "Ask for a hint..."}
                        rows={2}
                        className="bg-neutral-900 dark:bg-white border-neutral-700 text-sm resize-none text-white dark:text-neutral-900 placeholder:text-neutral-500 focus-visible:ring-neutral-600"
                    />
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={toggleVoice}
                        className={cn(
                            "h-9 w-9 flex-shrink-0 transition-colors",
                            scribe.isConnected
                                ? "text-red-400 hover:text-red-300 bg-red-900/20"
                                : "text-neutral-400 hover:text-white"
                        )}
                    >
                        {scribe.isConnected ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleSend()}
                        disabled={!input.trim() || store.isChatLoading}
                        className="h-9 w-9 text-neutral-400 hover:text-white flex-shrink-0"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

function ChatBubble({
    message,
    onPlayTTS,
    isSpeaking,
}: {
    message: PracticeChatMessage;
    onPlayTTS?: () => void;
    isSpeaking?: boolean;
}) {
    const isUser = message.role === "user";
    return (
        <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
            <div
                className={cn(
                    "max-w-[90%] rounded-lg px-3 py-2 text-sm",
                    isUser
                        ? "bg-neutral-700 text-white"
                        : "bg-neutral-900 text-neutral-300 border border-neutral-800"
                )}
            >
                {
                    isUser ? (
                        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    ) : (
                        <MarkdownRenderer
                            content={message.content}
                            className="prose-invert prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:mb-2 [&_code]:text-xs [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_ol]:space-y-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ul]:space-y-1 [&_li]:pl-1 [&_li]:leading-relaxed"
                        />
                    )
                }
                {
                    !isUser && onPlayTTS && (
                        <button
                            onClick={onPlayTTS}
                            disabled={false}
                            className="mt-1.5 flex items-center gap-1 text-[10px] text-neutral-500 dark:text-neutral-400 hover:text-neutral-300 transition-colors"
                        >
                            {
                                isSpeaking ? (
                                    <>
                                        <Square className="h-3 w-3" />
                                        Stop
                                    </>
                                ) : (
                                    <>
                                        <Volume2 className="h-3 w-3" />
                                        Listen
                                    </>
                                )
                            }
                        </button>
                    )
                }
            </div>
        </div>
    );
}

function SubmitButton({
    problem,
    session,
    store,
    mode,
}: {
    problem: PracticeProblemDetail;
    session: PracticeSessionData;
    store: PracticeWorkspaceState;
    mode: PracticeMode;
}) {
    const handleSubmit = async () => {
        if (store.isAssessing) return;
        store.setAssessing(true);

        // Save first
        await saveSessionProgress(session.id, {
            code: store.code,
            cssCode: store.cssCode,
            canvasData: store.canvasData as object,
            language: store.language,
            chatHistory: store.chatHistory,
            totalTimeSeconds: store.elapsedSeconds,
        });

        const result = await assessPracticeWork({
            module: problem.module,
            problemSlug: problem.slug,
            mode,
            attemptNumber: session.attempts + 1,
            userWork: problem.module === "SYSTEM_DESIGN"
                ? JSON.stringify(store.canvasData)
                : store.code,
            userCss: store.cssCode || undefined,
            language: store.language,
            conversationHistory: store.chatHistory,
            previousFeedback: store.lastFeedback ?? undefined,
        });

        if (result.success) {
            store.setAssessmentResult(
                result.result.score,
                result.result.feedback,
                result.result.requirementsMet
            );

            await updateSessionAfterAssess(session.id, {
                score: result.result.score,
                feedback: result.result.feedback,
                requirementsMet: result.result.requirementsMet,
                xpAwarded: result.result.xpAwarded,
            });
        } else {
            store.setAssessing(false);
        }
    };

    return (
        <Button
            size="sm"
            onClick={handleSubmit}
            disabled={store.isAssessing}
            className="bg-neutral-800 hover:bg-neutral-700 text-white text-xs h-8"
        >
            {
                store.isAssessing ? (
                    <>
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        Assessing...
                    </>
                ) : (
                    <>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                        Submit
                    </>
                )
            }
        </Button>
    );
}