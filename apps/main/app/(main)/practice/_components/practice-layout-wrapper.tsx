"use client";

import { ScrollArea } from "@repo/ui/components/ui/scroll-area"
import { usePathname, useSearchParams } from "next/navigation";
import { PracticeSidebar } from "./practice-sidebar";
import type { PracticeModule } from "@/types/practice";

const PATH_TO_MODULE: Record<string, PracticeModule> = {
    "/practice/dsa": "DSA",
    "/practice/system-design": "SYSTEM_DESIGN",
    "/practice/web-frontend": "WEB_FRONTEND",
    "/practice/web-backend": "WEB_BACKEND",
};

export function PracticeLayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const pathParts = pathname.split("/").filter(Boolean);
    const isWorkspace = pathParts.length >= 3;

    if (isWorkspace) {
        return <>{children}</>;
    }

    const activeModule = PATH_TO_MODULE[pathname] ?? null;
    const activeCategory = searchParams.get("topic") ?? null;

    return (
        <div className="flex h-full">
            <PracticeSidebar activeModule={activeModule} activeCategory={activeCategory} />
            <ScrollArea className="min-h-0 flex-1" reflow>
                {children}
            </ScrollArea>
        </div>
    );
}