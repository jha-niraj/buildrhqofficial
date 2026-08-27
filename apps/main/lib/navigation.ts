import {
    FolderKanban, Sparkles, User, User2,
    Briefcase, Video, Brain, LayoutDashboard, Heading,
    Home, FileText, Code2,
    Network, Globe, Server, Compass, Telescope, IdCard, BarChart3,
    Search, Bookmark, Bell, Building2, Send, Zap, Upload, History
} from "lucide-react"

export type LucideIcon = typeof LayoutDashboard

export interface NavigationItem {
    name: string
    path: string
    icon: LucideIcon
    children?: NavigationItem[]
    requiredPermission?: string
    status?: string | "active" | "coming"
    comingSoon?: boolean
}

export interface NavigationConfig {
    primary: NavigationItem[]
    secondary: NavigationItem[]
}

// Focused nav: Build (Projects) -> Interview-ready (Practice, Mock, AI) -> Get Hired (Jobs)
// -> KnowMe (your public, queryable persona).
//
// KnowMe was parked here and hidden from nav, while the home page went on linking to it from
// `feature-discovery.tsx` - so it was unreachable from the sidebar and advertised on the first
// screen. Unparked on 2026-08-27 at Niraj's request; the two now agree.
//
// EVERY `path` HERE MUST RESOLVE TO A REAL ROUTE. Two did not, for long enough that Niraj
// found them by clicking: 'ai/jobinterviewassistant' (the route has no "job" prefix) and
// 'ai/resume/cover-letter' (the route is 'ai/coverletter'). The second was the nastier one -
// it matched the dynamic `ai/resume/[username]` segment with username="cover-letter", so it
// rendered that page's not-found and read as a broken profile rather than a broken link.
//
// A wrong path here has no symptom until someone clicks it, which is why there is now a test:
// `lib/navigation.test.ts` walks this tree and fails on any path with no page. Route groups
// are resolved, so `jobs` living in `app/(jobs)/jobs` is correctly accepted.
export const mainNavigation: NavigationConfig = {
    primary: [
        {
            name: "Home",
            path: "home",
            icon: Home,
            status: "active"
        },
        {
            name: "Practice",
            path: "practice",
            icon: Code2,
            status: "active",
            children: [
                { name: 'DSA', path: 'practice/dsa', icon: Code2 },
                { name: 'System Design', path: 'practice/system-design', icon: Network },
                { name: 'Web Frontend', path: 'practice/web-frontend', icon: Globe },
                { name: 'Web Backend', path: 'practice/web-backend', icon: Server }
            ]
        },
        {
            name: "Projects",
            path: "projects",
            icon: FolderKanban,
            status: "active",
            children: [
                { name: 'Ideas', path: 'projects/ideas', icon: Heading },
                { name: 'My Projects', path: 'projects/myprojects', icon: User },
                { name: 'All Projects', path: 'projects/allprojects', icon: User2 }
            ]
        },
        {
            name: "Mock Interview",
            path: "mock",
            icon: Video,
            status: "active",
            children: [
                { name: 'Voice Mock', path: 'mock/voice', icon: Brain }
            ]
        },
        {
            name: "Pathfinder",
            path: "pathfinder",
            icon: Compass,
            status: "active",
            children: [
                { name: 'Explore', path: 'pathfinder/explore', icon: Telescope }
            ]
        },
        {
            name: "AI Tools",
            path: "ai",
            icon: Sparkles,
            status: "active",
            children: [
                { name: 'Job Interview', path: 'ai/interviewassistant', icon: Briefcase },
                { name: 'My Generations', path: 'ai/interviewassistant/generations', icon: History },
                { name: 'Public Generations', path: 'ai/interviewassistant/publicgenerations', icon: Globe },
                { name: 'Resume', path: 'ai/resume', icon: FileText },
                { name: 'Import Resume', path: 'ai/resume/import', icon: Upload },
                { name: 'Cover Letter', path: 'ai/coverletter', icon: FileText },
            ]
        },
        {
            // Jobs had SIX real sub-pages and no children at all, so every one of
            // them was reachable only from inside the module's own page chrome.
            // Every path below resolves literally - `pnpm check-nav` enforces it.
            name: "Jobs",
            path: "jobs",
            icon: Briefcase,
            status: "active",
            children: [
                { name: 'Browse', path: 'jobs/browse', icon: Search },
                { name: 'Applications', path: 'jobs/applications', icon: Send },
                { name: 'Saved', path: 'jobs/saved', icon: Bookmark },
                { name: 'Following', path: 'jobs/following', icon: Bell },
                { name: 'Companies', path: 'companies', icon: Building2 },
                { name: 'Spark', path: 'jobs/spark', icon: Zap },
            ]
        },
        {
            // KnowMe is the OUTWARD-facing half of the product: a queryable public
            // persona that other people (and API clients) ask questions of. That is
            // why it sits at the end, after everything the user does for themselves -
            // and why it is not merged into the AI rail, which is the inward-facing
            // assistant that acts on the user's behalf. See the note in
            // plan/knowme/overview.md.
            name: "KnowMe",
            path: "knowme",
            icon: IdCard,
            status: "active",
            children: [
                { name: 'Analytics', path: 'knowme/analytics', icon: BarChart3 },
                { name: 'Settings', path: 'knowme/settings', icon: Server },
            ]
        }
    ],
    secondary: []
}
