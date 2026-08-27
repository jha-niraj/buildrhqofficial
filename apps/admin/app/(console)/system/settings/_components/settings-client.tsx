"use client"

import { useEffect, useState } from "react"
import { Settings as SettingsIcon, RefreshCw } from "lucide-react"
import { getSystemSettings, updateSystemSetting, clearCache } from "@/actions/system.action"
import { toast } from "@repo/ui/components/ui/sonner"
import { Button } from "@repo/ui/components/ui/button"
import { Label } from "@repo/ui/components/ui/label"
import { Input } from "@repo/ui/components/ui/input"
import { InlineLoader } from "@repo/ui/components/ui/inline-loader"

export interface SystemSetting {
    key: string
    value: string | number | boolean
    description?: string
}

interface CommonSetting {
    key: string
    label: string
    description: string
    type: "boolean" | "number" | "text"
    defaultValue: string | number | boolean
}

const COMMON_SETTINGS: CommonSetting[] = [
    { key: "MAINTENANCE_MODE", label: "Maintenance Mode", description: "Enable maintenance mode to prevent user access", type: "boolean", defaultValue: false },
    { key: "SIGNUP_ENABLED", label: "User Signup", description: "Allow new user registrations", type: "boolean", defaultValue: true },
    { key: "CREDIT_REWARD_SIGNUP", label: "Signup Credit Reward", description: "Credits awarded on signup", type: "number", defaultValue: 100 },
    { key: "CREDIT_REWARD_FEEDBACK", label: "Feedback Credit Reward", description: "Credits awarded for feedback", type: "number", defaultValue: 50 },
    { key: "MAX_PROJECTS_PER_USER", label: "Max Projects Per User", description: "Maximum projects a user can create", type: "number", defaultValue: 10 },
]

export function SettingsClient({
    initialSettings,
    loadError,
}: {
    initialSettings: SystemSetting[]
    loadError: string | null | undefined
}) {
    const [settings, setSettings] = useState<SystemSetting[]>(initialSettings)
    const [saving, setSaving] = useState<string | null>(null)
    const [clearingCache, setClearingCache] = useState(false)

    useEffect(() => {
        if (loadError) toast.error(loadError || "Failed to fetch settings")
    }, [loadError])

    async function refetch() {
        const result = await getSystemSettings()
        if (result.success) setSettings(result.data as unknown as SystemSetting[])
    }

    async function handleUpdateSetting(key: string, value: string | number | boolean, description?: string) {
        setSaving(key)
        try {
            const result = await updateSystemSetting(key, { value, description })
            if (result.success) {
                toast.success("Setting updated successfully")
                refetch()
            } else {
                toast.error(result.error || "Failed to update setting")
            }
        } catch (error) {
            console.error("Update error:", error)
            toast.error("An error occurred")
        } finally {
            setSaving(null)
        }
    }

    async function handleClearCache() {
        setClearingCache(true)
        try {
            const result = await clearCache()
            if (result.success) {
                toast.success("Cache cleared successfully")
            } else {
                toast.error(result.error || "Failed to clear cache")
            }
        } catch (error) {
            console.error("Clear cache error:", error)
            toast.error("An error occurred")
        } finally {
            setClearingCache(false)
        }
    }

    function getSettingValue(key: string) {
        return settings.find((s) => s.key === key)?.value
    }

    return (
        <div className="w-full p-6 lg:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white flex items-center gap-3">
                        <SettingsIcon className="w-7 h-7" />
                        System Settings
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Configure platform-wide settings</p>
                </div>
                <Button
                    onClick={handleClearCache}
                    disabled={clearingCache}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-neutral-700 to-neutral-900 rounded-lg hover:from-neutral-600 hover:to-neutral-800 disabled:opacity-50 transition-colors"
                >
                    {clearingCache ? <InlineLoader size="sm" /> : <RefreshCw className="w-4 h-4" />}
                    Clear Cache
                </Button>
            </div>

            <div className="space-y-4">
                {COMMON_SETTINGS.map((setting) => {
                    const currentValue = getSettingValue(setting.key)
                    const value = currentValue !== undefined ? currentValue : setting.defaultValue

                    return (
                        <div key={setting.key} className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">{setting.label}</h3>
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400">{setting.description}</p>
                                    <div className="mt-3">
                                        {setting.type === "boolean" ? (
                                            <Label className="relative inline-flex items-center cursor-pointer">
                                                <Input
                                                    type="checkbox"
                                                    checked={Boolean(value)}
                                                    onChange={(e) => handleUpdateSetting(setting.key, e.target.checked, setting.description)}
                                                    disabled={saving === setting.key}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-neutral-300 dark:peer-focus:ring-neutral-600 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-neutral-900" />
                                                <span className="ms-3 text-sm font-medium text-neutral-900 dark:text-neutral-300">{value ? "Enabled" : "Disabled"}</span>
                                            </Label>
                                        ) : setting.type === "number" ? (
                                            <div className="flex items-center gap-3">
                                                <Input
                                                    type="number"
                                                    value={Number(value)}
                                                    onChange={(e) => handleUpdateSetting(setting.key, parseInt(e.target.value), setting.description)}
                                                    disabled={saving === setting.key}
                                                    className="w-32 px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
                                                />
                                                {saving === setting.key && <InlineLoader size="sm" />}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <Input
                                                    type="text"
                                                    value={String(value)}
                                                    onChange={(e) => handleUpdateSetting(setting.key, e.target.value, setting.description)}
                                                    disabled={saving === setting.key}
                                                    className="flex-1 px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
                                                />
                                                {saving === setting.key && <InlineLoader size="sm" />}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
            <div className="mt-8 bg-neutral-50 dark:bg-neutral-800/20 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-700 mb-2">Important Notes</h3>
                <ul className="text-sm text-neutral-800 dark:text-neutral-100 space-y-1">
                    <li>&bull; Changes take effect immediately across the platform</li>
                    <li>&bull; Maintenance mode will show a maintenance page to all users</li>
                    <li>&bull; Credit rewards apply to new actions after the change</li>
                </ul>
            </div>
        </div>
    )
}
