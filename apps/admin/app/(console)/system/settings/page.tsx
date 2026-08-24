import { getSystemSettings } from "@/actions/system.action"
import { SettingsClient, type SystemSetting } from "./_components/settings-client"

/** Server component (ADM-8) - see admins/profile/page.tsx for the pattern note. */
export default async function SystemSettingsPage() {
    const result = await getSystemSettings()

    return (
        <SettingsClient
            initialSettings={result.success ? (result.data as unknown as SystemSetting[]) : []}
            loadError={result.success ? null : result.error}
        />
    )
}
