"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import {
    Card, CardContent, CardHeader, CardTitle
} from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { Badge } from "@repo/ui/components/ui/badge";
import {
    FileText, Download, Briefcase, GraduationCap, Award, Calendar,
    ExternalLink, Building, Eye, Loader2, Pencil
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import toast from "@repo/ui/components/ui/sonner";
import { uploadResume } from "@/actions/(main)/user/resume.action";
import { getResumeSignedUrl } from "@/actions/(main)/user/resume.action";

interface ResumeTabProps {
    user: {
        id: string;
        resume: string | null;
        hasResume: boolean;
        resumeUrl?: string | null;
        university: string | null;
        experiences: Array<{
            id: string;
            companyName: string;
            companyLogo: string | null;
            roleTitle: string;
            description?: string | null;
            bulletPoints?: string[];
            startDate: Date;
            endDate: Date | null;
            isCurrentlyWorking: boolean;
            companyWebsite: string | null;
        }>;
        portfolioProjects?: Array<{
            id: string;
            projectName: string;
            description?: string | null;
            bulletPoints?: string[];
            technologies: string[];
            startDate: Date;
            endDate: Date | null;
        }>;
        educations?: Array<{
            id: string;
            degree: string | null;
            institution: string;
            startDate: Date;
            endDate: Date | null;
        }>;
        certifications: Array<{
            id: string;
            name: string;
            issuer: string;
            issuedDate: Date;
            link: string;
        }>;
        skills?: Array<{ id: string; name: string; category: string }>;
    };
    isOwnProfile: boolean;
    onUploadResume?: () => void | Promise<void>;
}

// Format date range
function formatDateRange(
    startDate: Date,
    endDate: Date | null,
    isCurrentlyWorking: boolean
): string {
    const start = new Date(startDate).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
    });

    if (isCurrentlyWorking) {
        return `${start} - Present`;
    }

    if (endDate) {
        const end = new Date(endDate).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
        });
        return `${start} - ${end}`;
    }

    return start;
}

// Calculate duration
function calculateDuration(
    startDate: Date,
    endDate: Date | null,
    isCurrentlyWorking: boolean
): string {
    const start = new Date(startDate);
    const end = isCurrentlyWorking || !endDate ? new Date() : new Date(endDate);

    const months =
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth());

    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (years === 0) {
        return `${remainingMonths} mo${remainingMonths !== 1 ? "s" : ""}`;
    }

    if (remainingMonths === 0) {
        return `${years} yr${years !== 1 ? "s" : ""}`;
    }

    return `${years} yr${years !== 1 ? "s" : ""} ${remainingMonths} mo${remainingMonths !== 1 ? "s" : ""
        }`;
}

export function ResumeTab({
    user,
    isOwnProfile,
    onUploadResume,
}: ResumeTabProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [resumeViewUrl, setResumeViewUrl] = useState<string | null>(null);

    const experiences = user.experiences || [];
    const certifications = user.certifications || [];

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(file.type)) {
            toast.error("Please upload a PDF or DOC/DOCX file");
            return;
        }
        setUploading(true);
        try {
            const result = await uploadResume(file, undefined, { draftName: "My resume" });
            if (result.url || result.success) {
                // The parse runs in a worker and lands after this request. Say so,
                // otherwise the editable version showing up minutes later at
                // /ai/resume looks like something the user did not ask for.
                toast.success(
                    result.structureJobId
                        ? "Resume uploaded. We're reading it now - an editable version will appear in your Resume Creator shortly."
                        : "Resume uploaded successfully!"
                );
                await onUploadResume?.();
            } else {
                toast.error(result.message || "Upload failed");
            }
        } catch {
            toast.error("Failed to upload resume");
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    const handleViewResume = async () => {
        if (resumeViewUrl) {
            window.open(resumeViewUrl, "_blank");
            return;
        }
        const res = await getResumeSignedUrl();
        if (res?.url) {
            setResumeViewUrl(res.url);
            window.open(res.url, "_blank");
        } else {
            toast.error("Could not load resume");
        }
    };

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <Card className="overflow-hidden">
                    <div className="bg-gradient-to-r from-neutral-900/10 via-neutral-900/10 to-neutral-900/10 p-6">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-900 flex items-center justify-center">
                                    <FileText className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">Resume</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {
                                            user.hasResume && user.resume
                                                ? "PDF document available"
                                                : "No resume uploaded yet"
                                        }
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                                {
                                    isOwnProfile && (
                                        <Button variant="outline" size="sm" className="gap-2" asChild>
                                            <Link href="/ai/resume">
                                                <Pencil className="w-4 h-4" />
                                                Edit in Resume Creator
                                            </Link>
                                        </Button>
                                    )
                                }
                                {
                                    user.hasResume && user.resume ? (
                                        <>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="gap-2"
                                                onClick={handleViewResume}
                                            >
                                                <Eye className="w-4 h-4" />
                                                View
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="gap-2 bg-gradient-to-r from-neutral-900 to-neutral-900 text-white hover:from-neutral-800 hover:to-neutral-800"
                                                onClick={handleViewResume}
                                            >
                                                <Download className="w-4 h-4" />
                                                Download
                                            </Button>
                                        </>
                                    ) : isOwnProfile ? (
                                        <Button
                                            onClick={handleUploadClick}
                                            disabled={uploading}
                                            className="gap-2 bg-gradient-to-r from-neutral-900 to-neutral-900 text-white hover:from-neutral-800 hover:to-neutral-800"
                                        >
                                            {uploading ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <FileText className="w-4 h-4" />
                                            )}
                                            {uploading ? "Uploading..." : "Upload Resume"}
                                        </Button>
                                    ) : null
                                }
                            </div>
                        </div>
                    </div>
                </Card>
            </motion.div>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-neutral-900" />
                                Work Experience
                            </CardTitle>
                            {
                                isOwnProfile && (
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href="/ai/resume">
                                            Add Experience
                                        </Link>
                                    </Button>
                                )
                            }
                        </div>
                    </CardHeader>
                    <CardContent>
                        {
                            experiences.length > 0 ? (
                                <div className="relative">
                                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

                                    <div className="space-y-6">
                                        {
                                            experiences.map((exp, index) => (
                                                <motion.div
                                                    key={exp.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.1 }}
                                                    className="relative pl-14"
                                                >
                                                    <div className="absolute left-3 w-7 h-7 rounded-full bg-background border-2 border-border flex items-center justify-center overflow-hidden">
                                                        {
                                                            exp.companyLogo ? (
                                                                <Image
                                                                    src={exp.companyLogo}
                                                                    alt={exp.companyName}
                                                                    className="w-full h-full object-cover"
                                                                    height={28}
                                                                    width={28}
                                                                />
                                                            ) : (
                                                                <Building className="w-4 h-4 text-muted-foreground" />
                                                            )
                                                        }
                                                    </div>
                                                    <div className="pb-6 border-b last:border-0 last:pb-0">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div className="flex-1">
                                                                <h4 className="font-semibold">{exp.roleTitle}</h4>
                                                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                                                    <span className="font-medium text-foreground">
                                                                        {exp.companyName}
                                                                    </span>
                                                                    {
                                                                        exp.companyWebsite && (
                                                                            <Link
                                                                                href={exp.companyWebsite}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="hover:text-primary"
                                                                            >
                                                                                <ExternalLink className="w-3 h-3" />
                                                                            </Link>
                                                                        )
                                                                    }
                                                                </div>
                                                                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                                                                    <span className="flex items-center gap-1">
                                                                        <Calendar className="w-3 h-3" />
                                                                        {
                                                                            formatDateRange(
                                                                                exp.startDate,
                                                                                exp.endDate,
                                                                                exp.isCurrentlyWorking
                                                                            )
                                                                        }
                                                                    </span>
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        {
                                                                            calculateDuration(
                                                                                exp.startDate,
                                                                                exp.endDate,
                                                                                exp.isCurrentlyWorking
                                                                            )
                                                                        }
                                                                    </Badge>
                                                                    {
                                                                        exp.isCurrentlyWorking && (
                                                                            <Badge
                                                                                variant="outline"
                                                                                className="text-xs bg-neutral-900/10 text-neutral-800 border-neutral-900/20"
                                                                            >
                                                                                Current
                                                                            </Badge>
                                                                        )
                                                                    }
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {
                                                            ((exp as { bulletPoints?: string[] }).bulletPoints?.length ?? 0) > 0 ? (
                                                                <ul className="text-sm text-muted-foreground mt-3 space-y-1 list-disc list-inside">
                                                                    {(exp as { bulletPoints?: string[] }).bulletPoints?.map((point, i) => (
                                                                        <li key={i}>{point}</li>
                                                                    ))}
                                                                </ul>
                                                            ) : exp.description ? (
                                                                <p className="text-sm text-muted-foreground mt-3 whitespace-pre-line">
                                                                    {exp.description}
                                                                </p>
                                                            ) : null
                                                        }
                                                    </div>
                                                </motion.div>
                                            ))
                                        }
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p className="text-sm">No work experience added yet</p>
                                    {
                                        isOwnProfile && (
                                            <Button variant="outline" size="sm" className="mt-3" asChild>
                                                <Link href="/ai/resume">Add your first experience</Link>
                                            </Button>
                                        )
                                    }
                                </div>
                            )
                        }
                    </CardContent>
                </Card>
            </motion.div>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <GraduationCap className="w-5 h-5 text-neutral-900" />
                                Education
                            </CardTitle>
                            {
                                isOwnProfile && (
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href="/ai/resume">Edit</Link>
                                    </Button>
                                )
                            }
                        </div>
                    </CardHeader>
                    <CardContent>
                        {
                            (user.educations && user.educations.length > 0) ? (
                                <div className="space-y-4">
                                    {user.educations.map((edu) => (
                                        <div key={edu.id} className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-lg bg-neutral-900/10 flex items-center justify-center shrink-0">
                                                <GraduationCap className="w-6 h-6 text-neutral-900" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold">
                                                    {edu.degree ? `${edu.degree}, ` : ""}{edu.institution}
                                                </h4>
                                                <p className="text-sm text-muted-foreground">
                                                    {new Date(edu.startDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                                                    {" - "}
                                                    {edu.endDate ? new Date(edu.endDate).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "Present"}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : user.university ? (
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-neutral-900/10 flex items-center justify-center">
                                        <GraduationCap className="w-6 h-6 text-neutral-900" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold">{user.university}</h4>
                                        <p className="text-sm text-muted-foreground">University</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p className="text-sm">No education information added</p>
                                    {
                                        isOwnProfile && (
                                            <Button variant="outline" size="sm" className="mt-3" asChild>
                                                <Link href="/ai/resume">Add education</Link>
                                            </Button>
                                        )
                                    }
                                </div>
                            )
                        }
                    </CardContent>
                </Card>
            </motion.div>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Award className="w-5 h-5 text-neutral-900" />
                                Certifications
                            </CardTitle>
                            {
                                certifications.length > 0 && (
                                    <Badge variant="secondary">{certifications.length} total</Badge>
                                )
                            }
                        </div>
                    </CardHeader>
                    <CardContent>
                        {
                            certifications.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {
                                        certifications.map((cert, index) => (
                                            <motion.a
                                                key={cert.id}
                                                href={cert.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="flex items-center gap-4 p-4 rounded-lg border hover:shadow-sm transition-shadow group"
                                            >
                                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-neutral-900/20 to-neutral-900/20 flex items-center justify-center flex-shrink-0">
                                                    <Award className="w-6 h-6 text-neutral-900" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-medium line-clamp-1 group-hover:text-primary transition-colors">
                                                        {cert.name}
                                                    </h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        {cert.issuer} •{" "}
                                                        {
                                                            new Date(cert.issuedDate).toLocaleDateString("en-US", {
                                                                month: "short",
                                                                year: "numeric",
                                                            })
                                                        }
                                                    </p>
                                                </div>
                                                <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </motion.a>
                                        ))
                                    }
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Award className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p className="text-sm">No certifications added yet</p>
                                    {
                                        isOwnProfile && (
                                            <Button variant="outline" size="sm" className="mt-3">
                                                Add certification
                                            </Button>
                                        )
                                    }
                                </div>
                            )
                        }
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}