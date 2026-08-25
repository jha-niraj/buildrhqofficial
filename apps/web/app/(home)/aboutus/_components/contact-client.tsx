'use client'

import { useState } from 'react'
import { Button } from '@repo/ui/components/ui/button'
import { Input } from '@repo/ui/components/ui/input'
import { Textarea } from '@repo/ui/components/ui/textarea'
import toast from '@repo/ui/components/ui/sonner'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@repo/ui/components/ui/select'
import { Send } from 'lucide-react'
import { submitContactMessage } from '@/actions/contact.action'

const SUBJECTS = [
    'General enquiry',
    'Universities & bootcamps (bulk credits)',
    'Partnership',
    'Billing',
    'Bug report',
] as const

export default function ContactClient() {
    const [form, setForm] = useState({ name: '', email: '', subject: SUBJECTS[0] as string, message: '' })
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)

    const update = (field: keyof typeof form) => (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => setForm((f) => ({ ...f, [field]: e.target.value }))

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (loading) return
        setLoading(true)
        try {
            const result = await submitContactMessage(form)
            if (result.success) {
                toast.success(result.message)
                setSent(true)
                setForm({ name: '', email: '', subject: SUBJECTS[0] as string, message: '' })
            } else {
                toast.error(result.message)
            }
        } catch {
            toast.error('Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    if (sent) {
        return (
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-10 text-center dark:border-neutral-800 dark:bg-neutral-900/60">
                <h2 className="mb-2 text-xl font-bold text-neutral-900 dark:text-white">Message sent</h2>
                <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
                    We read everything and reply within two working days.
                </p>
                <Button variant="outline" onClick={() => setSent(false)} className="rounded-full">
                    Send another
                </Button>
            </div>
        )
    }

    return (
        <form onSubmit={onSubmit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
                <div>
                    <label htmlFor="contact-name" className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Name
                    </label>
                    <Input
                        id="contact-name"
                        name="name"
                        autoComplete="name"
                        required
                        maxLength={120}
                        value={form.name}
                        onChange={update('name')}
                    />
                </div>
                <div>
                    <label htmlFor="contact-email" className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Email
                    </label>
                    <Input
                        id="contact-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        maxLength={254}
                        value={form.email}
                        onChange={update('email')}
                    />
                </div>
            </div>

            <div>
                <label htmlFor="contact-subject" className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Subject
                </label>
                {/* Radix Select is not a form control, so the value is carried by a hidden
                    input for the native submit this form still relies on. */}
                <Select
                    value={form.subject}
                    onValueChange={(v) => setForm((f) => ({ ...f, subject: v }))}
                >
                    <SelectTrigger id="contact-subject" className="h-9 w-full text-sm">
                        <SelectValue placeholder="Choose a subject" />
                    </SelectTrigger>
                    <SelectContent>
                        {SUBJECTS.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <input type="hidden" name="subject" value={form.subject} required />
            </div>

            <div>
                <label htmlFor="contact-message" className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Message
                </label>
                <Textarea
                    id="contact-message"
                    name="message"
                    required
                    rows={6}
                    maxLength={5000}
                    value={form.message}
                    onChange={update('message')}
                    placeholder="Tell us what you need. If this is about bulk credits, include your institution and rough student numbers."
                />
            </div>

            <Button type="submit" disabled={loading} size="lg" className="rounded-full">
                <Send className="mr-2 h-4 w-4" aria-hidden />
                {loading ? 'Sending' : 'Send message'}
            </Button>
        </form>
    )
}
