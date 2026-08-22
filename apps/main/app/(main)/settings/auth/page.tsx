import { redirect } from 'next/navigation'

/**
 * Retired tab.
 *
 * This rendered a single card reading "More security options coming soon. For now, manage
 * your password and connected accounts from the Account settings" - a whole tab whose only
 * content was a pointer at another tab.
 *
 * It redirects rather than 404s because the path may be bookmarked, and because everything it
 * ever pointed at genuinely does live on the Account page.
 */
export default function AuthSettingsPage() {
    redirect('/settings/account')
}
