'use client'

import { useState } from 'react'
import {
    CheckCircle2, Copy, Check, Terminal, Settings, Key, Download, PlayCircle
} from 'lucide-react'
import { Button } from '@repo/ui/components/ui/button'
import { Badge } from '@repo/ui/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/ui/card'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@repo/ui/components/ui/table'

// ============================================================================
// Types
// ============================================================================

export interface SetupGuideData {
    prerequisites?: string[]
    environmentVariables?: Array<{
        name: string
        purpose: string
        required: boolean
        exampleValue: string
    }>
    installationSteps?: string[]
    verificationSteps?: string[]
}

interface SetupGuideTabProps {
    setupGuide: SetupGuideData | null
}

// ============================================================================
// Setup Guide Tab Component
// ============================================================================

export function SetupGuideTab({ setupGuide }: SetupGuideTabProps) {
    const [copiedEnv, setCopiedEnv] = useState<string | null>(null)
    const [copiedStep, setCopiedStep] = useState<number | null>(null)

    if (!setupGuide) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <Settings className="w-12 h-12 text-neutral-300 dark:text-neutral-400 mb-4" />
                <h3 className="text-lg font-semibold text-neutral-600 dark:text-neutral-400 mb-2">
                    No Setup Guide Available
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md">
                    This project doesn&apos;t have a setup guide yet. The project creator can add one to help users get started.
                </p>
            </div>
        )
    }

    const handleCopyEnv = (name: string, value: string) => {
        navigator.clipboard.writeText(`${name}=${value}`)
        setCopiedEnv(name)
        setTimeout(() => setCopiedEnv(null), 2000)
    }

    const handleCopyStep = (step: string, index: number) => {
        navigator.clipboard.writeText(step)
        setCopiedStep(index)
        setTimeout(() => setCopiedStep(null), 2000)
    }

    const handleCopyAllEnv = () => {
        if (!setupGuide.environmentVariables) return
        const envContent = setupGuide.environmentVariables
            .map(env => `${env.name}=${env.exampleValue}`)
            .join('\n')
        navigator.clipboard.writeText(envContent)
    }

    return (
        <div className="space-y-8">
            {/* Prerequisites */}
            {setupGuide.prerequisites && setupGuide.prerequisites.length > 0 && (
                <Card className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Download className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
                            Prerequisites
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                            Make sure you have the following installed before starting:
                        </p>
                        <ul className="space-y-3">
                            {setupGuide.prerequisites.map((prereq, idx) => (
                                <li key={idx} className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800/30 flex items-center justify-center flex-shrink-0">
                                        <CheckCircle2 className="w-4 h-4 text-neutral-800 dark:text-neutral-100" />
                                    </div>
                                    <span className="text-sm text-neutral-700 dark:text-neutral-300">
                                        {prereq}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}

            {/* Environment Variables */}
            {setupGuide.environmentVariables && setupGuide.environmentVariables.length > 0 && (
                <Card className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Key className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
                                Environment Variables
                            </CardTitle>
                            <Button variant="outline" size="sm" onClick={handleCopyAllEnv}>
                                <Copy className="w-4 h-4 mr-1" />
                                Copy All
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                            Create a <code className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded">.env</code> or <code className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded">.env.local</code> file with these variables:
                        </p>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Variable</TableHead>
                                        <TableHead>Purpose</TableHead>
                                        <TableHead>Required</TableHead>
                                        <TableHead>Example</TableHead>
                                        <TableHead className="w-12"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {setupGuide.environmentVariables.map((env, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell>
                                                <code className="text-sm font-mono text-neutral-800 dark:text-neutral-100">
                                                    {env.name}
                                                </code>
                                            </TableCell>
                                            <TableCell className="text-sm text-neutral-600 dark:text-neutral-400">
                                                {env.purpose}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={env.required ? 'default' : 'secondary'}>
                                                    {env.required ? 'Required' : 'Optional'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <code className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                                                    {env.exampleValue}
                                                </code>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleCopyEnv(env.name, env.exampleValue)}
                                                >
                                                    {copiedEnv === env.name ? (
                                                        <Check className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
                                                    ) : (
                                                        <Copy className="w-4 h-4" />
                                                    )}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Installation Steps */}
            {setupGuide.installationSteps && setupGuide.installationSteps.length > 0 && (
                <Card className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Terminal className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
                            Installation Steps
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                            Follow these steps to set up the project:
                        </p>
                        <ol className="space-y-4">
                            {setupGuide.installationSteps.map((step, idx) => (
                                <li key={idx} className="flex gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-neutral-900 to-neutral-800 flex items-center justify-center text-white font-bold text-sm">
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 p-3 bg-neutral-900 dark:bg-black rounded-lg group">
                                            <code className="flex-1 text-sm text-neutral-800 dark:text-neutral-200 font-mono break-all">
                                                {step}
                                            </code>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleCopyStep(step, idx)}
                                                className="text-neutral-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                {copiedStep === idx ? (
                                                    <Check className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
                                                ) : (
                                                    <Copy className="w-4 h-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </CardContent>
                </Card>
            )}

            {/* Verification Steps */}
            {setupGuide.verificationSteps && setupGuide.verificationSteps.length > 0 && (
                <Card className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <PlayCircle className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
                            Verification
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                            Verify your setup is complete by checking:
                        </p>
                        <ul className="space-y-3">
                            {setupGuide.verificationSteps.map((step, idx) => (
                                <li key={idx} className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded border-2 border-neutral-300 dark:border-neutral-700 flex-shrink-0 mt-0.5" />
                                    <span className="text-sm text-neutral-700 dark:text-neutral-300">
                                        {step}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
