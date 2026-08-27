'use client'

import { useState } from 'react'
import { useSession, signOut } from '@repo/auth/client';
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@repo/ui/components/ui/card'
import { Input } from '@repo/ui/components/ui/input'
import { Label } from '@repo/ui/components/ui/label'
import { Button } from '@repo/ui/components/ui/button'
import { Textarea } from "@repo/ui/components/ui/textarea"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@repo/ui/components/ui/select'
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
    DialogTitle
} from '@repo/ui/components/ui/dialog'
import {
    Loader2, CheckCircle2, ArrowRight, ArrowLeft, GraduationCap, LogOut, 
    AlertCircle, BookOpen
} from 'lucide-react'
import toast from '@repo/ui/components/ui/sonner'
import { cn } from '@repo/ui/lib/utils'
import { completeOnboarding } from '@/actions/auth/onboarding.action'

// University type enum values matching Prisma schema
const UNIVERSITY_TYPES = [
    { value: "PUBLIC", label: "Public University" },
    { value: "PRIVATE", label: "Private University" },
    { value: "DEEMED", label: "Deemed University" },
    { value: "AUTONOMOUS", label: "Autonomous College" },
    { value: "AFFILIATED", label: "Affiliated College" },
    { value: "TECHNICAL_INSTITUTE", label: "Technical Institute" },
    { value: "STATE", label: "State University" },
    { value: "CENTRAL", label: "Central University" },
    { value: "COMMUNITY_COLLEGE", label: "Community College" },
    { value: "OTHER", label: "Other" },
] as const;

const STUDENT_COUNTS = [
    "Under 500 students",
    "500-1,000 students",
    "1,000-5,000 students",
    "5,000-10,000 students",
    "10,000+ students"
]

const DEPARTMENTS = [
    { id: 'cs', label: 'Computer Science' },
    { id: 'it', label: 'Information Technology' },
    { id: 'ece', label: 'Electronics & Communication' },
    { id: 'ee', label: 'Electrical Engineering' },
    { id: 'me', label: 'Mechanical Engineering' },
    { id: 'ce', label: 'Civil Engineering' },
    { id: 'mba', label: 'MBA / Business' },
    { id: 'other', label: 'Other Departments' },
]

const ROLE_OPTIONS = [
    { value: 'CHANCELLOR', label: 'Chancellor / Vice Chancellor', isHead: true },
    { value: 'PRINCIPAL', label: 'Principal / Director', isHead: true },
    { value: 'REGISTRAR', label: 'Registrar', isHead: true },
    { value: 'DEAN', label: 'Dean', isHead: true },
    { value: 'HOD', label: 'Head of Department', isHead: false },
    { value: 'PLACEMENT_HEAD', label: 'Placement Head / TPO', isHead: false },
    { value: 'PROFESSOR', label: 'Professor / Faculty', isHead: false },
    { value: 'ADMIN', label: 'Administrative Staff', isHead: false },
]

export default function OnboardingPage() {
    const { refetch, data: session } = useSession()
    const [currentStep, setCurrentStep] = useState(0)
    const [loading, setLoading] = useState(false)
    const [loggingOut, setLoggingOut] = useState(false)
    const [showExitDialog, setShowExitDialog] = useState(false)

    // University Info
    const [universityName, setUniversityName] = useState('')
    const [universityWebsite, setUniversityWebsite] = useState('')
    const [universityType, setUniversityType] = useState('')
    const [studentCount, setStudentCount] = useState('')
    const [emailDomain, setEmailDomain] = useState('')
    const [description, setDescription] = useState('')

    // User Role
    const [userRole, setUserRole] = useState('')

    // Departments  
    const [selectedDepartments, setSelectedDepartments] = useState<string[]>([])

    // Location
    const [city, setCity] = useState('')
    const [state, setState] = useState('')

    const toggleDepartment = (deptId: string) => {
        setSelectedDepartments(prev =>
            prev.includes(deptId) ? prev.filter(d => d !== deptId) : [...prev, deptId]
        )
    }

    const canProceed = () => {
        if (currentStep === 0) {
            return universityName.length >= 2 && universityType && userRole && emailDomain
        }
        return true
    }

    const handleComplete = async () => {
        if (!canProceed()) return

        setLoading(true)
        try {
            const result = await completeOnboarding({
                universityName,
                website: universityWebsite || undefined,
                description: description || undefined,
                universityType: universityType || undefined,
                emailDomain,
                userRole: userRole as "CHANCELLOR" | "PRINCIPAL" | "REGISTRAR" | "DEAN" | "HOD" | "PROFESSOR" | "ASSOCIATE_PROFESSOR" | "ASSISTANT_PROFESSOR" | "LECTURER" | "PLACEMENT_COORDINATOR" | "PLACEMENT_OFFICER" | "FINANCE_MANAGER" | "ACCOUNTS_OFFICER" | "TEACHING_ASSISTANT" | "LAB_INSTRUCTOR" | "OTHER",
            })

            if (!result.success) {
                throw new Error(result.error || 'Failed to complete onboarding')
            }

            toast.success('University portal initialized successfully! 🎓')
            await refetch()
            window.location.href = '/home'
        } catch (error) {
            console.error('Onboarding error:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to complete setup')
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        setLoggingOut(true)
        try {
            await signOut()
            window.location.href = '/signin'
        } catch (error) {
            console.error('Logout error:', error)
            toast.error('Failed to logout')
            setLoggingOut(false)
        }
    }

    const steps = [
        { title: 'University Info', description: 'Basic details & your role' },
        { title: 'Departments', description: 'Select departments' },
        { title: 'Location', description: 'Campus location' },
    ]

    return (
        <div className="min-h-dvh bg-white dark:bg-neutral-950 flex flex-col mx-auto w-full max-w-7xl">
            <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
                <DialogContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-neutral-900 dark:text-white">
                            <AlertCircle className="w-5 h-5" />
                            Complete Setup First
                        </DialogTitle>
                        <DialogDescription className="text-neutral-500">
                            You need to complete your university setup to access the platform.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setShowExitDialog(false)} className="cursor-pointer border-neutral-200 dark:border-neutral-800">
                            Continue Setup
                        </Button>
                        <Button onClick={handleLogout} disabled={loggingOut} className="cursor-pointer bg-neutral-800 hover:bg-neutral-700 text-white">
                            {
                                loggingOut ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Logging out...
                                    </>
                                ) : (
                                    <>
                                        <LogOut className="w-4 h-4 mr-2" />
                                        Logout
                                    </>
                                )
                            }
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <nav className="w-full border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl relative z-10">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <button
                        onClick={() => setShowExitDialog(true)}
                        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neutral-800 to-neutral-800 flex items-center justify-center">
                            <GraduationCap className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-lg font-bold text-neutral-900 dark:text-white">
                            Coder&apos;z <span className="text-neutral-800 font-mono font-normal text-sm">UNIVERSITY</span>
                        </span>
                    </button>
                    <div className="flex items-center gap-4">
                        {
                            session?.user?.email && (
                                <span className="text-sm text-neutral-500 hidden sm:block font-mono">
                                    {session.user.email}
                                </span>
                            )
                        }
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleLogout}
                            disabled={loggingOut}
                            className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                        >
                            {
                                loggingOut ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <LogOut className="w-4 h-4" />
                                )
                            }
                        </Button>
                    </div>
                </div>
            </nav>
            <div className="flex-1 flex items-center justify-center p-4 w-full overflow-hidden relative z-10">
                <div className="w-full max-w-4xl">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <div className="text-center mb-8">
                            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-800 mb-2 block">
                                University Portal Setup
                            </span>
                            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">
                                Configure Your University Portal
                            </h1>
                        </div>
                        <div className="flex justify-center gap-4 mb-8">
                            {
                                steps.map((step, idx) => (
                                    <div key={idx} className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all border",
                                            idx < currentStep
                                                ? 'bg-neutral-800 text-white border-transparent'
                                                : idx === currentStep
                                                    ? 'bg-white dark:bg-neutral-950 text-neutral-800 border-neutral-800'
                                                    : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-400 border-neutral-200 dark:border-neutral-800'
                                        )}>
                                            {idx < currentStep ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                                        </div>
                                        <div className="hidden md:block">
                                            <p className={cn(
                                                "text-sm font-medium",
                                                idx <= currentStep ? 'text-neutral-900 dark:text-white' : 'text-neutral-400'
                                            )}>
                                                {step.title}
                                            </p>
                                        </div>
                                        {
                                            idx < steps.length - 1 && (
                                                <div className={cn(
                                                    "w-8 h-px",
                                                    idx < currentStep ? 'bg-neutral-800' : 'bg-neutral-200 dark:bg-neutral-800'
                                                )} />
                                            )
                                        }
                                    </div>
                                ))
                            }
                        </div>
                    </motion.div>
                    <Card className="bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 rounded-3xl">
                        <CardContent className="p-8">
                            <AnimatePresence mode="wait">
                                {
                                    currentStep === 0 && (
                                        <motion.div
                                            key="step-0"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-6"
                                        >
                                            <div className="grid md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <Label htmlFor="universityName" className="text-xs font-mono uppercase tracking-wider text-neutral-500">
                                                        University Name *
                                                    </Label>
                                                    <Input
                                                        id="universityName"
                                                        placeholder="Delhi Technical University"
                                                        value={universityName}
                                                        onChange={(e) => setUniversityName(e.target.value)}
                                                        className="h-12 rounded-xl bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="emailDomain" className="text-xs font-mono uppercase tracking-wider text-neutral-500">
                                                        Email Domain *
                                                    </Label>
                                                    <Input
                                                        id="emailDomain"
                                                        placeholder="dtu.ac.in"
                                                        value={emailDomain}
                                                        onChange={(e) => setEmailDomain(e.target.value)}
                                                        className="h-12 rounded-xl bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800"
                                                    />
                                                    <p className="text-[10px] text-neutral-500 font-mono">
                                                        Students will verify with this domain
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="grid md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-mono uppercase tracking-wider text-neutral-500">University Type *</Label>
                                                    <Select value={universityType} onValueChange={setUniversityType}>
                                                        <SelectTrigger className="h-12 rounded-xl bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800">
                                                            <SelectValue placeholder="Select type" />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
                                                            {
                                                                UNIVERSITY_TYPES.map((type) => (
                                                                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                                                ))
                                                            }
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-mono uppercase tracking-wider text-neutral-500">Student Count</Label>
                                                    <Select value={studentCount} onValueChange={setStudentCount}>
                                                        <SelectTrigger className="h-12 rounded-xl bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800">
                                                            <SelectValue placeholder="Select count" />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
                                                            {
                                                                STUDENT_COUNTS.map((count) => (
                                                                    <SelectItem key={count} value={count}>{count}</SelectItem>
                                                                ))
                                                            }
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-mono uppercase tracking-wider text-neutral-500">Your Role *</Label>
                                                <Select value={userRole} onValueChange={setUserRole}>
                                                    <SelectTrigger className="h-12 rounded-xl bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800">
                                                        <SelectValue placeholder="What's your role?" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
                                                        {
                                                            ROLE_OPTIONS.map((role) => (
                                                                <SelectItem key={role.value} value={role.value}>
                                                                    <div className="flex items-center gap-2">
                                                                        <span>{role.label}</span>
                                                                        {
                                                                            role.isHead && (
                                                                                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800/30 text-neutral-800 dark:text-neutral-100">
                                                                                    Admin
                                                                                </span>
                                                                            )
                                                                        }
                                                                    </div>
                                                                </SelectItem>
                                                            ))
                                                        }
                                                    </SelectContent>
                                                </Select>
                                                <p className="text-[10px] text-neutral-500 font-mono mt-1">
                                                    Leadership roles get full admin access to manage the university portal
                                                </p>
                                            </div>
                                            <div className="grid md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <Label htmlFor="website" className="text-xs font-mono uppercase tracking-wider text-neutral-500">
                                                        University Website
                                                    </Label>
                                                    <Input
                                                        id="website"
                                                        placeholder="https://university.edu"
                                                        value={universityWebsite}
                                                        onChange={(e) => setUniversityWebsite(e.target.value)}
                                                        className="h-12 rounded-xl bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="description" className="text-xs font-mono uppercase tracking-wider text-neutral-500">
                                                    University Description
                                                </Label>
                                                <Textarea
                                                    id="description"
                                                    placeholder="Brief description about your university, programs, and achievements..."
                                                    value={description}
                                                    onChange={(e) => setDescription(e.target.value)}
                                                    className="min-h-[100px] rounded-xl bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800"
                                                />
                                            </div>
                                        </motion.div>
                                    )
                                }
                                {
                                    currentStep === 1 && (
                                        <motion.div
                                            key="step-1"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-6"
                                        >
                                            <div className="text-center mb-8">
                                                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                                                    Which departments will use the platform?
                                                </h2>
                                                <p className="text-neutral-500 text-sm mt-2">
                                                    Select all departments you want to onboard initially
                                                </p>
                                            </div>
                                            <div className="grid sm:grid-cols-2 gap-4">
                                                {
                                                    DEPARTMENTS.map((dept) => {
                                                        const isSelected = selectedDepartments.includes(dept.id)
                                                        return (
                                                            <motion.button
                                                                key={dept.id}
                                                                onClick={() => toggleDepartment(dept.id)}
                                                                whileHover={{ scale: 1.02 }}
                                                                whileTap={{ scale: 0.98 }}
                                                                className={cn(
                                                                    "p-4 rounded-xl border-2 transition-all text-left cursor-pointer",
                                                                    isSelected
                                                                        ? 'border-neutral-800 bg-neutral-800 text-white'
                                                                        : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 hover:border-neutral-800 dark:hover:border-neutral-700'
                                                                )}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className={cn(
                                                                        "p-2 rounded-lg",
                                                                        isSelected ? 'bg-white/20' : 'bg-neutral-100 dark:bg-neutral-800/30'
                                                                    )}>
                                                                        <BookOpen className={cn("w-4 h-4", isSelected ? "text-white" : "text-neutral-800")} />
                                                                    </div>
                                                                    <span className="font-medium">{dept.label}</span>
                                                                    {isSelected && <CheckCircle2 className="w-4 h-4 ml-auto" />}
                                                                </div>
                                                            </motion.button>
                                                        )
                                                    })
                                                }
                                            </div>
                                        </motion.div>
                                    )
                                }
                                {
                                    currentStep === 2 && (
                                        <motion.div
                                            key="step-2"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-6"
                                        >
                                            <div className="text-center mb-8">
                                                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                                                    Campus Location
                                                </h2>
                                                <p className="text-neutral-500 text-sm mt-2">
                                                    Where is your main campus located?
                                                </p>
                                            </div>
                                            <div className="grid md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <Label htmlFor="city" className="text-xs font-mono uppercase tracking-wider text-neutral-500">
                                                        City
                                                    </Label>
                                                    <Input
                                                        id="city"
                                                        placeholder="e.g., New Delhi"
                                                        value={city}
                                                        onChange={(e) => setCity(e.target.value)}
                                                        className="h-12 rounded-xl bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="state" className="text-xs font-mono uppercase tracking-wider text-neutral-500">
                                                        State / Region
                                                    </Label>
                                                    <Input
                                                        id="state"
                                                        placeholder="e.g., Delhi NCR"
                                                        value={state}
                                                        onChange={(e) => setState(e.target.value)}
                                                        className="h-12 rounded-xl bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800"
                                                    />
                                                </div>
                                            </div>

                                            {/* Summary */}
                                            <div className="mt-8 p-6 rounded-xl bg-neutral-50 dark:bg-neutral-800/20 border border-neutral-200 dark:border-neutral-800">
                                                <h3 className="font-bold text-neutral-800 dark:text-neutral-100 mb-4 flex items-center gap-2">
                                                    <GraduationCap className="w-5 h-5" />
                                                    Quick Summary
                                                </h3>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-neutral-800/80">University:</span>
                                                        <span className="font-medium text-neutral-800 dark:text-neutral-100">{universityName || '-'}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-neutral-800/80">Email Domain:</span>
                                                        <span className="font-medium text-neutral-800 dark:text-neutral-100">{emailDomain || '-'}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-neutral-800/80">Departments:</span>
                                                        <span className="font-medium text-neutral-800 dark:text-neutral-100">{selectedDepartments.length} selected</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-neutral-800/80">Your Role:</span>
                                                        <span className="font-medium text-neutral-800 dark:text-neutral-100">
                                                            {ROLE_OPTIONS.find(r => r.value === userRole)?.label || '-'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )
                                }
                            </AnimatePresence>
                            <div className="flex justify-between mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-800">
                                <Button
                                    variant="outline"
                                    onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                                    disabled={currentStep === 0}
                                    className="cursor-pointer h-12 px-6 rounded-xl border-neutral-200 dark:border-neutral-800"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Previous
                                </Button>
                                {
                                    currentStep < steps.length - 1 ? (
                                        <Button
                                            onClick={() => setCurrentStep(prev => prev + 1)}
                                            disabled={!canProceed()}
                                            className="cursor-pointer h-12 px-6 rounded-xl bg-gradient-to-r from-neutral-800 to-neutral-800 hover:from-neutral-700 hover:to-neutral-700 text-white"
                                        >
                                            Next
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={handleComplete}
                                            disabled={loading || !canProceed()}
                                            className="cursor-pointer h-12 px-6 rounded-xl bg-gradient-to-r from-neutral-800 to-neutral-800 hover:from-neutral-700 hover:to-neutral-700 text-white"
                                        >
                                            {
                                                loading ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        Initializing...
                                                    </>
                                                ) : (
                                                    <>
                                                        Launch University Portal
                                                        <CheckCircle2 className="w-4 h-4 ml-2" />
                                                    </>
                                                )
                                            }
                                        </Button>
                                    )
                                }
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}