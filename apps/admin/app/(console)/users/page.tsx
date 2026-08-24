import { getAllUsers } from "@/actions/main/user.action"
import { UsersClient, type User } from "./_components/users-client"

/** Server component (ADM-8) - see admins/profile/page.tsx for the pattern note. */
export default async function UsersPage() {
    const res = await getAllUsers({ role: "all", status: "all" }, { page: 1, limit: 10 })

    const initialUsers: User[] = res.success ? res.data.users : []
    const initialTotal = res.success ? res.data.total : 0
    const initialPages = res.success ? res.data.pages : 0

    return (
        <UsersClient
            initialUsers={initialUsers}
            initialTotal={initialTotal}
            initialPages={initialPages}
            loadError={res.success ? null : res.error}
        />
    )
}
