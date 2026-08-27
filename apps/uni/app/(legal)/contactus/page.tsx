"use client"

import { motion } from "framer-motion"
import {
    Mail, Phone, MapPin, Clock, ArrowRight, Calendar,
    MessageCircle, GraduationCap
} from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Textarea } from "@repo/ui/components/ui/textarea"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@repo/ui/components/ui/select"
import Link from "next/link"
import { useState } from "react"

export default function ContactPage() {
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        // Simulate API call
        setTimeout(() => {
            setLoading(false)
            setSubmitted(true)
        }, 1500)
    }

    return (
        <div className="min-h-dvh bg-white dark:bg-neutral-950">
            <section className="pt-32 pb-16 px-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:60px_60px] opacity-50" />
                <div className="max-w-7xl mx-auto relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-16"
                    >
                        <Link href="/" className="inline-flex items-center gap-2 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center">
                                <GraduationCap className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white">
                                CODER&apos;Z <span className="text-neutral-900 font-mono font-normal">UNI</span>
                            </span>
                        </Link>
                        <span className="inline-block text-[10px] font-mono uppercase tracking-widest text-neutral-500 bg-neutral-100 dark:bg-neutral-900 px-4 py-2 rounded-full mb-6">
                            Contact Protocol
                        </span>
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-neutral-900 dark:text-white mb-6">
                            Let&apos;s Transform <br />
                            <span className="text-neutral-900">Education Together.</span>
                        </h1>
                        <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                            Whether you have questions about our platform, need a demo for your university, or want to discuss enterprise solutions - we&apos;re here to help.
                        </p>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20"
                    >
                        <Link href="https://cal.com/coderzai" target="_blank">
                            <div className="group bg-gradient-to-br from-neutral-800 to-neutral-800 rounded-2xl p-8 text-white hover:scale-105 transition-transform cursor-pointer">
                                <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <Calendar className="w-7 h-7" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Schedule a Demo</h3>
                                <p className="text-neutral-200 text-sm mb-4">
                                    See Coder&apos;z Uni in action with a personalized walkthrough for your university.
                                </p>
                                <div className="flex items-center gap-2 font-medium text-sm">
                                    Book Meeting <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </Link>
                        <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-8 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
                            <div className="w-14 h-14 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center mb-6">
                                <GraduationCap className="w-7 h-7 text-neutral-800 dark:text-neutral-100" />
                            </div>
                            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">University Sales</h3>
                            <p className="text-neutral-500 text-sm mb-4">
                                Custom solutions for universities and educational institutions.
                            </p>
                            <a href="mailto:sales@shipithq.com" className="flex items-center gap-2 font-medium text-sm text-neutral-800 dark:text-neutral-100 hover:underline">
                                sales@shipithq.com <ArrowRight className="w-4 h-4" />
                            </a>
                        </div>
                        <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-8 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
                            <div className="w-14 h-14 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center mb-6">
                                <MessageCircle className="w-7 h-7 text-neutral-800 dark:text-neutral-100" />
                            </div>
                            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">Technical Support</h3>
                            <p className="text-neutral-500 text-sm mb-4">
                                Get help with platform issues and technical questions.
                            </p>
                            <a href="mailto:support@shipithq.com" className="flex items-center gap-2 font-medium text-sm text-neutral-800 dark:text-neutral-100 hover:underline">
                                support@shipithq.com <ArrowRight className="w-4 h-4" />
                            </a>
                        </div>
                    </motion.div>
                </div>
            </section>
            <section className="py-20 px-6 bg-neutral-50 dark:bg-neutral-900/50">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-6">
                                Send us a message
                            </h2>
                            <p className="text-neutral-500 mb-8">
                                Fill out the form below and we&apos;ll get back to you within 24 hours.
                            </p>

                            {
                                submitted ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="bg-neutral-50 dark:bg-neutral-800/20 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-8 text-center"
                                    >
                                        <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800/40 flex items-center justify-center mx-auto mb-4">
                                            <Mail className="w-8 h-8 text-neutral-800 dark:text-neutral-100" />
                                        </div>
                                        <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                                            Message Sent!
                                        </h3>
                                        <p className="text-neutral-500">
                                            Thanks for reaching out. We&apos;ll respond shortly.
                                        </p>
                                    </motion.div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
                                                <Input
                                                    id="firstName"
                                                    placeholder="John"
                                                    className="mt-2 rounded-xl bg-white dark:bg-neutral-950"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                                                <Input
                                                    id="lastName"
                                                    placeholder="Doe"
                                                    className="mt-2 rounded-xl bg-white dark:bg-neutral-950"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <Label htmlFor="email" className="text-sm font-medium">University Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="john@university.edu"
                                                className="mt-2 rounded-xl bg-white dark:bg-neutral-950"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="university" className="text-sm font-medium">University Name</Label>
                                            <Input
                                                id="university"
                                                placeholder="XYZ University"
                                                className="mt-2 rounded-xl bg-white dark:bg-neutral-950"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="subject" className="text-sm font-medium">Subject</Label>
                                            <Select>
                                                <SelectTrigger className="mt-2 rounded-xl bg-white dark:bg-neutral-950">
                                                    <SelectValue placeholder="How can we help?" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="demo">Request a Demo</SelectItem>
                                                    <SelectItem value="pricing">Pricing Inquiry</SelectItem>
                                                    <SelectItem value="support">Technical Support</SelectItem>
                                                    <SelectItem value="integration">Platform Integration</SelectItem>
                                                    <SelectItem value="placement">Placement Partnership</SelectItem>
                                                    <SelectItem value="other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label htmlFor="message" className="text-sm font-medium">Message</Label>
                                            <Textarea
                                                id="message"
                                                placeholder="Tell us about your university's needs..."
                                                className="mt-2 rounded-xl bg-white dark:bg-neutral-950 min-h-[150px]"
                                                required
                                            />
                                        </div>
                                        <Button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full rounded-xl h-12 bg-neutral-800 hover:bg-neutral-700 text-white font-bold cursor-pointer"
                                        >
                                            {loading ? "Sending..." : "Send Message"}
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </form>
                                )
                            }
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="lg:pl-12"
                        >
                            <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-6">
                                Get in touch
                            </h2>
                            <p className="text-neutral-500 mb-12">
                                Prefer to reach out directly? Here&apos;s how you can contact us.
                            </p>
                            <div className="space-y-8">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800/30 flex items-center justify-center shrink-0">
                                        <Mail className="w-5 h-5 text-neutral-800 dark:text-neutral-100" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-neutral-900 dark:text-white mb-1">Email</p>
                                        <a href="mailto:university@shipithq.com" className="text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-100 transition-colors">
                                            university@shipithq.com
                                        </a>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800/30 flex items-center justify-center shrink-0">
                                        <Phone className="w-5 h-5 text-neutral-800 dark:text-neutral-100" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-neutral-900 dark:text-white mb-1">Phone</p>
                                        <p className="text-neutral-500">+91 98765 43210</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800/30 flex items-center justify-center shrink-0">
                                        <MapPin className="w-5 h-5 text-neutral-800 dark:text-neutral-100" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-neutral-900 dark:text-white mb-1">Office</p>
                                        <p className="text-neutral-500">
                                            123 Tech Park, Electronic City<br />
                                            Bengaluru, Karnataka 560100<br />
                                            India
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800/30 flex items-center justify-center shrink-0">
                                        <Clock className="w-5 h-5 text-neutral-800 dark:text-neutral-100" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-neutral-900 dark:text-white mb-1">Business Hours</p>
                                        <p className="text-neutral-500">
                                            Monday - Friday: 9:00 AM - 6:00 PM IST<br />
                                            Saturday - Sunday: Closed
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-12 h-64 rounded-2xl bg-neutral-50 dark:bg-neutral-800/20 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center">
                                <p className="text-neutral-900 dark:text-neutral-100 text-sm">Map Integration</p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>
        </div>
    )
}