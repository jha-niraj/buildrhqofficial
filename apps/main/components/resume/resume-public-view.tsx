"use client"

import Image from "next/image"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import {
    Github, Linkedin, Twitter, Globe, Mail
} from "lucide-react"
import { cn } from "@repo/ui/lib/utils"

const SOCIAL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    GITHUB: Github,
    LINKEDIN: Linkedin,
    TWITTER: Twitter,
    X: Twitter,
    PORTFOLIO: Globe,
    GMAIL: Mail,
    WEBSITE: Globe,
}

const SKILL_CATEGORY_LABELS: Record<string, string> = {
    LANGUAGES: "Languages",
    FRAMEWORKS_LIBRARIES: "Frameworks & Libraries",
    TOOLS_DATABASES: "Tools & Databases",
    PLATFORMS: "Platforms",
    AI_TOOLS: "AI Tools",
    FRONTEND: "Frontend",
    BACKEND: "Backend",
    API: "API",
    DATABASE: "Database",
    DEVOPS: "DevOps",
    CLOUD: "Cloud",
}

function formatDate(d: Date | string) {
    return new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" })
}

export interface ResumePublicViewUser {
    name?: string | null
    username?: string | null
    occupation?: string | null
    location?: string | null
    image?: string | null
    experiences?: Array<{
        id: string
        roleTitle: string
        companyName: string
        startDate: Date
        endDate?: Date | null
        isCurrentlyWorking?: boolean
        bulletPoints?: string[]
        description?: string | null
    }>
    portfolioProjects?: Array<{
        id: string
        projectName: string
        technologies?: string[]
        startDate: Date
        endDate?: Date | null
        bulletPoints?: string[]
        description?: string | null
    }>
    skills?: Array<{ id: string; name: string; category?: string }>
    educations?: Array<{
        id: string
        degree?: string | null
        institution: string
        startDate: Date
        endDate?: Date | null
    }>
    certifications?: Array<{
        id: string
        name: string
        issuer: string
        issuedDate: Date
        link: string
    }>
    socialLinks?: Array<{ id: string; platform: string; url: string }>
}

interface ResumePublicViewProps {
    user: ResumePublicViewUser
    /** When true, render as embedded card for profile tab; otherwise full page */
    embedded?: boolean
}

export function ResumePublicView({ user, embedded = false }: ResumePublicViewProps) {
    const experiences = user.experiences ?? []
    const portfolioProjects = user.portfolioProjects ?? []
    const skills = user.skills ?? []
    const educations = user.educations ?? []
    const certifications = user.certifications ?? []
    const socialLinks = user.socialLinks ?? []

    const skillsByCategory = skills.reduce<Record<string, { id: string; name: string }[]>>(
        (acc, skill) => {
            const cat = skill.category || "OTHER"
            if (!acc[cat]) acc[cat] = []
            acc[cat].push({ id: skill.id, name: skill.name })
            return acc
        },
        {}
    )

    const content = (
        <div className={embedded ? "space-y-6" : "min-h-screen bg-neutral-950 text-neutral-100"}>
            <div className={embedded ? "" : "max-w-3xl mx-auto px-6 py-12"}>
                <div className={embedded ? "flex items-start gap-4 border-b pb-6" : "flex flex-col sm:flex-row items-start gap-6 border-b pb-10 mb-10"}>
                    {
                        user.image && (
                            <div className={cn("relative rounded-full overflow-hidden bg-neutral-800 shrink-0", embedded ? "w-16 h-16" : "w-24 h-24 sm:w-28 sm:h-28")}>
                                <Image
                                    src={user.image}
                                    alt={user.name || "Profile"}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        )
                    }
                    <div className={embedded ? "flex-1 min-w-0" : "flex-1 min-w-0"}>
                        <h1 className={embedded ? "text-xl font-bold" : "text-3xl font-bold uppercase tracking-wider"}>
                            {user.name || "Anonymous"}
                        </h1>
                        <p className="text-neutral-400 mt-1">
                            {user.occupation || "Developer"}
                        </p>
                        {
                            user.location && (
                                <p className="text-sm text-neutral-500 mt-0.5">{user.location}</p>
                            )
                        }
                        {
                            socialLinks.length > 0 && (
                                <div className={embedded ? "flex flex-wrap gap-3 mt-2" : "flex flex-wrap gap-4 mt-4"}>
                                    {
                                        socialLinks.map((link) => {
                                            const Icon = SOCIAL_ICONS[link.platform.toUpperCase().replace(/\s/g, "_")] ?? Globe
                                            return (
                                                <Link
                                                    key={link.id}
                                                    href={link.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 text-neutral-800 dark:text-neutral-200 hover:text-neutral-300 hover:underline text-sm"
                                                    title={link.platform}
                                                >
                                                    <Icon className="w-4 h-4" />
                                                    <span>{link.platform}</span>
                                                </Link>
                                            )
                                        })
                                    }
                                </div>
                            )
                        }
                    </div>
                </div>

                {
                    experiences.length > 0 && (
                        <section className={embedded ? "mt-6" : "mb-10"}>
                            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-4 border-b border-neutral-700 pb-2">
                                Work Experience
                            </h2>
                            <div className="space-y-6">
                                {
                                    experiences.map((exp) => (
                                        <div key={exp.id}>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-semibold">
                                                        {exp.roleTitle}, {exp.companyName}
                                                    </p>
                                                    <p className="text-sm text-neutral-500">
                                                        {formatDate(exp.startDate)} -{" "}
                                                        {
                                                            exp.isCurrentlyWorking
                                                                ? "Present"
                                                                : exp.endDate
                                                                    ? formatDate(exp.endDate)
                                                                    : ""
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                            <ul className="mt-2 space-y-1 text-neutral-300 text-sm list-disc list-inside">
                                                {
                                                    (exp.bulletPoints?.length ? exp.bulletPoints : exp.description ? [exp.description] : []).map((point, i) => (
                                                        <li key={i}><ReactMarkdown>{point}</ReactMarkdown></li>
                                                    ))
                                                }
                                            </ul>
                                        </div>
                                    ))
                                }
                            </div>
                        </section>
                    )
                }

                {
                    portfolioProjects.length > 0 && (
                        <section className={embedded ? "mt-6" : "mb-10"}>
                            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-4 border-b border-neutral-700 pb-2">
                                Projects
                            </h2>
                            <div className="space-y-4">
                                {
                                    portfolioProjects.map((proj) => (
                                        <div key={proj.id}>
                                            <p className="font-semibold">{proj.projectName}</p>
                                            <p className="text-sm text-neutral-500">
                                                {formatDate(proj.startDate)} -{" "}
                                                {proj.endDate ? formatDate(proj.endDate) : "Present"}
                                                {proj.technologies?.length ? ` • ${proj.technologies.slice(0, 5).join(", ")}` : ""}
                                            </p>
                                            <ul className="mt-1 space-y-1 text-neutral-300 text-sm list-disc list-inside">
                                                {
                                                    (proj.bulletPoints?.length ? proj.bulletPoints : proj.description ? [proj.description] : []).map((point, i) => (
                                                        <li key={i}><ReactMarkdown>{point}</ReactMarkdown></li>
                                                    ))
                                                }
                                            </ul>
                                        </div>
                                    ))
                                }
                            </div>
                        </section>
                    )
                }

                {
                    Object.keys(skillsByCategory).length > 0 && (
                        <section className={embedded ? "mt-6" : "mb-10"}>
                            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-4 border-b border-neutral-700 pb-2">
                                Technical Skills
                            </h2>
                            <div className="space-y-3">
                                {
                                    Object.entries(skillsByCategory).map(([cat, skillList]) => (
                                        <div key={cat}>
                                            <p className="text-xs font-semibold text-neutral-500">
                                                {SKILL_CATEGORY_LABELS[cat] || cat}
                                            </p>
                                            <p className="text-sm text-neutral-300">
                                                {skillList.map((s) => s.name).join(", ")}
                                            </p>
                                        </div>
                                    ))
                                }
                            </div>
                        </section>
                    )
                }

                {
                    educations.length > 0 && (
                        <section className={embedded ? "mt-6" : "mb-10"}>
                            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-4 border-b border-neutral-700 pb-2">
                                Education
                            </h2>
                            <div className="space-y-3">
                                {
                                    educations.map((edu) => (
                                        <div key={edu.id}>
                                            <p className="font-semibold">
                                                {edu.degree ? `${edu.degree}, ` : ""}
                                                {edu.institution}
                                            </p>
                                            <p className="text-sm text-neutral-500">
                                                {formatDate(edu.startDate)} -{" "}
                                                {edu.endDate ? formatDate(edu.endDate) : "Present"}
                                            </p>
                                        </div>
                                    ))
                                }
                            </div>
                        </section>
                    )
                }

                {
                    certifications.length > 0 && (
                        <section className={embedded ? "mt-6" : ""}>
                            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-4 border-b border-neutral-700 pb-2">
                                Certifications
                            </h2>
                            <div className="space-y-2">
                                {
                                    certifications.map((cert) => (
                                        <Link
                                            key={cert.id}
                                            href={cert.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block text-sm text-neutral-800 dark:text-neutral-200 hover:text-neutral-300"
                                        >
                                            {cert.name} • {cert.issuer} ({formatDate(cert.issuedDate)})
                                        </Link>
                                    ))
                                }
                            </div>
                        </section>
                    )
                }

                {
                    !embedded && (
                        <div className="mt-16 pt-8 border-t border-neutral-800 text-center">
                            <Link
                                href="/"
                                className="text-sm text-neutral-500 hover:text-neutral-400"
                            >
                                Built with ShipItHQ
                            </Link>
                        </div>
                    )
                }
            </div>
        </div>
    )

    if (embedded) {
        return (
            <div className="rounded-xl border bg-neutral-950 text-neutral-100 overflow-hidden">
                <div className="p-6">{content}</div>
            </div>
        )
    }

    return content
}