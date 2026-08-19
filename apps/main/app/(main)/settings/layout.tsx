import { getSession } from '@repo/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { SettingsLayoutClient } from './_components/settings-layout-client'

export const metadata = {
    title: 'Settings | ShipItHQ',
    description: 'Manage your account, integrations, and preferences',
}

export default async function SettingsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await getSession(headers())

    if (!session?.user) {
        redirect('/signin')
    }

    return (
        <div className="min-h-screen">
            <div className="max-w-6xl mx-auto px-4 md:px-8 py-6">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-foreground">Settings</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your account and preferences
                    </p>
                </div>
                <SettingsLayoutClient>{children}</SettingsLayoutClient>
            </div>
        </div>
    )
}
