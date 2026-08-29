import { PathfinderDashboard } from './_components/pathfinder-dashboard'
import { getUserPathfinderGoals } from '@/actions/(main)/pathfinder'
import { getModuleActivity } from '@/actions/(common)/stats/module-activity.action'

export const dynamic = 'force-dynamic'

export default async function PathfinderPage() {
    // `pathfinder_daily_session` records a day the user actually sat down and
    // worked a goal. Nothing on this page plotted it - the existing charts are all
    // derived from the GOAL rows - so the one signal that says "did I show up" was
    // being collected and never shown.
    const [{ goals = [], groups = [] }, activity] = await Promise.all([
        getUserPathfinderGoals(),
        getModuleActivity('pathfinder', 30),
    ])
    return <PathfinderDashboard initialGoals={goals} initialGroups={groups} activity={activity} />
}