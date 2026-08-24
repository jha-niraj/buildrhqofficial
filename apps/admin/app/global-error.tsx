"use client"

/**
 * Root-level boundary - renders only when the layout itself failed, so it
 * cannot assume any stylesheet loaded. Inline styles, deliberately.
 */
export default function GlobalError({
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <html>
            <body>
                <div
                    style={{
                        display: "flex", minHeight: "100vh", flexDirection: "column",
                        alignItems: "center", justifyContent: "center", gap: "16px",
                        padding: "32px", textAlign: "center", fontFamily: "system-ui, sans-serif",
                    }}
                >
                    <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Something went wrong</h2>
                    <button
                        onClick={reset}
                        style={{
                            borderRadius: "12px", background: "#171717", color: "white",
                            padding: "8px 24px", fontSize: "14px", border: "none", cursor: "pointer",
                        }}
                    >
                        Try again
                    </button>
                </div>
            </body>
        </html>
    )
}
