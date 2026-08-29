import type { Metadata } from 'next'
import { Suspense } from 'react'
import ProjectsHubClient from './_components/ProjectsHubClient'
import Loading from './loading'
import { getMyProjectsOverview } from '@/actions/(main)/projects/overview.action'
import { getModuleActivity } from '@/actions/(common)/stats/module-activity.action'

export const metadata: Metadata = {
  title: 'Projects | ShipItHQ',
  description: 'Your projects, what you have finished, and what to do next.',
}

export default function ProjectsHomePage() {
  return (
    <Suspense fallback={<Loading />}>
      <HubContent />
    </Suspense>
  )
}

/**
 * The overview is fetched on the SERVER, not in a `useEffect` the way the old hub
 * fetched its platform stats. It is the page's primary content rather than a
 * decoration, so it should be there on first paint instead of arriving after a
 * client round trip - and it needs the session, which the client does not have.
 */
async function HubContent() {
  // In parallel: they touch different tables and neither needs the other.
  const [result, activity] = await Promise.all([
    getMyProjectsOverview(),
    getModuleActivity('projects', 30),
  ])
  return (
    <ProjectsHubClient
      overview={result.success ? result.data : null}
      activity={activity}
    />
  )
}
