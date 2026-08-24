"use client"

import { useState } from "react"
import { Button } from "@repo/ui/components/ui/button"
import { Input } from "@repo/ui/components/ui/input"
import { Mail } from "lucide-react"
import toast from "@repo/ui/components/ui/sonner"
import { subscribeToNewsletter } from "@/actions/newsletter.action"

export function NewsletterSubscription() {
    const [email, setEmail] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email || loading) return

        setLoading(true)
        try {
            const result = await subscribeToNewsletter(email)
            if (result.success) {
                toast.success(result.message)
                setEmail("")
            } else {
                toast.error(result.message)
            }
        } catch {
            toast.error("Something went wrong. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubscribe} className="flex gap-2 max-w-md">
            <label htmlFor="newsletter-email" className="sr-only">
                Email address
            </label>
            <Input
                id="newsletter-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="min-w-0 flex-1"
            />
            <Button type="submit" disabled={loading} className="gap-2">
                <Mail className="w-4 h-4" />
                {loading ? "Joining" : "Subscribe"}
            </Button>
        </form>
    )
}
