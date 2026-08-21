import {
    FolderKanban, Sparkles, User, User2,
    Briefcase, Video, Brain, LayoutDashboard, Heading,
    Home, FileText, Code2,
    Network, Globe, Server, Compass, Telescope
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

// Focused nav: Build (Projects) -> Interview-ready (Practice, Mock, AI) -> Get Hired (Jobs).
// KnowMe is parked (code kept, hidden from nav). Chat/Inbox, University, and the stub mock
// modes were removed.
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
                { name: 'Resume', path: 'ai/resume', icon: FileText },
                { name: 'Cover Letter', path: 'ai/coverletter', icon: FileText },
            ]
        },
        {
            name: "Jobs",
            path: "jobs",
            icon: Briefcase,
            status: "active"
        }
    ],
    secondary: []
}
