import type { Metadata } from 'next'
import AIHubClient from './_components/AIHubClient'
import { getAiHubStats } from '@/actions/(main)/ai/hub-stats.action'

export const metadata: Metadata = {
  title: 'AI Tools | ShipItHQ',
  description: 'Supercharge your job search with AI-powered resume builder, cover letter generator, and mock interview tools.',
}

export default async function AiToolsPage() {
  // Read on the server. These are four counts for the signed-in user, not platform
  // marketing numbers - see the note in hub-stats.action.ts for why the previous ones
  // were removed.
  const stats = await getAiHubStats()
  return <AIHubClient stats={stats} />
}
