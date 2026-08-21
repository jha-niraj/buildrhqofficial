"use client"
import Link from "next/link";

import React from 'react'
import Image, { type StaticImageData } from 'next/image'
import { motion } from 'framer-motion'
import {
    ArrowRight, Github, Linkedin, Twitter, Target, Users, Globe, Cpu, Mail
} from 'lucide-react'
import { Button } from "@repo/ui/components/ui/button"
import { Badge } from "@repo/ui/components/ui/badge"
import nirajjha from "./images/nirajjha.jpeg"
import harsh from "./images/harsh.jpeg"
import { APP_LINKS, BRAND, APP_URL } from "@/lib/site"
import ContactClient from "./_components/contact-client"
import { PageHero } from "@/components/page-hero"

// Filtered Team Data
interface Leader {
    name: string
    role: string
    bio: string
    img: StaticImageData
    links: { linkedin: string; github: string; twitter?: string }
}

const leadership: Leader[] = [
    {
        name: "Niraj Jha",
        role: "Lead Developer & Architect",
        bio: "Full-stack engineer passionate about building scalable educational infrastructure.",
        img: nirajjha,
        links: {
            linkedin: "https://www.linkedin.com/in/nirajjha31/",
            github: "https://github.com/jha-niraj",
            twitter: "https://x.com/iamnirajjha"
        }
    },
    {
        name: "Harsh Pandey",
        role: "Head of Operations & PR",
        bio: "Driving growth and strategic partnerships across the tech ecosystem.",
        img: harsh,
        links: {
            linkedin: "https://www.linkedin.com/in/harsh-pandey0504",
            github: "https://github.com/HarshPandey-5804"
        }
    }
]

const stats = [
    { label: "Active Developers", value: "10K+" },
    { label: "Projects Shipped", value: "500+" },
    { label: "Countries Reached", value: "12" },
    { label: "Lines of Code", value: "1M+" },
]

export default function AboutUs() {
    return (
        <div className="min-h-screen bg-white dark:bg-neutral-950 font-sans selection:bg-neutral-100 dark:selection:bg-neutral-800">
            {/* `statement` variant: About is an argument, not a list, so the header is
                one claim and nothing else. See components/page-hero.tsx for why the
                surface is fixed and only the composition varies. */}
            <PageHero
                variant="statement"
                eyebrow="Since 2024"
                title={<>Nobody gets hired for<br className="hidden sm:block" /> finishing a tutorial.</>}
                sub="ShipItHQ exists for the gap between passing a course and passing an interview - the part where you have to build something real, explain it out loud, and prove you can do it again."
                ctas={[
                    { text: "Start building", href: `${APP_URL}/register`, external: true },
                    { text: "See what it costs", href: "/pricing" },
                ]}
            />

            {/* ── The entity definition ──

                One sentence, in "X is Y" form, in the first 150 words, standing on its own
                without the paragraph around it.

                That shape is not a stylistic preference. This is the page an assistant reads
                when somebody asks "what is ShipItHQ", and the hero above it opens with an
                argument ("Nobody gets hired for finishing a tutorial") rather than a
                definition - which is right for a human arriving from an ad and useless to
                anything trying to extract what the product actually is.

                It says the same thing as the `description` in this route's AboutPage schema,
                deliberately. A definition that exists only in the markup is one no human
                sees; one that exists only in prose is one a parser has to guess at. */}
            <section className="border-b border-neutral-100 py-16 dark:border-neutral-800">
                <div className="mx-auto max-w-3xl px-6">
                    <p className="text-xl leading-relaxed text-neutral-900 dark:text-white sm:text-2xl">
                        <strong className="font-semibold">ShipItHQ is an interview preparation and portfolio
                        platform for computer science students and software engineers.</strong>{" "}
                        <span className="text-neutral-600 dark:text-neutral-400">
                            It combines four things that are usually five separate tabs: pattern-based
                            practice where your code runs in a real Linux container, portfolio projects
                            with a quiz and mock interview generated from what you actually built, voice
                            mock interviews you can take at any hour, and resume tooling that scores what
                            an applicant tracking system extracts from your file.
                        </span>
                    </p>
                    <p className="mt-6 text-[15px] leading-relaxed text-neutral-600 dark:text-neutral-400">
                        It is not a course. There are no video lessons, no curriculum to complete and
                        nothing that issues a certificate - the full list of what each part does, and
                        what each part deliberately does not do, is on the{" "}
                        <Link href="/features" className="font-medium text-neutral-900 underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-900 dark:text-white dark:decoration-neutral-700 dark:hover:decoration-white">
                            features page
                        </Link>.
                    </p>
                </div>
            </section>

            <section className="py-24 border-b border-neutral-100 dark:border-neutral-800">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
                        {
                            [
                                { icon: Target, title: "Our Mission", desc: "To democratize access to high-level engineering tools and AI guidance." },
                                { icon: Users, title: "Growth", desc: "Helping developers build real projects, practice, and get hired." },
                                { icon: Cpu, title: "Technology", desc: "Leveraging AI to simulate real-world technical interviews and tasks." },
                                { icon: Globe, title: "Impact", desc: "Helping students land roles at top product companies globally." }
                            ].map((item, i) => (
                                <div key={i} className="flex flex-col gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-neutral-900 dark:text-white">
                                        <item.icon className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white">{item.title}</h3>
                                    <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed text-sm">
                                        {item.desc}
                                    </p>
                                </div>
                            ))
                        }
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 border-t border-neutral-100 dark:border-neutral-800">
                        {
                            stats.map((stat, i) => (
                                <div key={i}>
                                    <div className="text-3xl font-bold text-neutral-900 dark:text-white mb-1 font-mono">{stat.value}</div>
                                    <div className="text-sm text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{stat.label}</div>
                                </div>
                            ))
                        }
                    </div>
                </div>
            </section>
            <section className="py-24 bg-neutral-50 dark:bg-neutral-900/30">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="mb-16">
                        <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-4">Leadership</h2>
                        <p className="text-neutral-500 dark:text-neutral-400 max-w-xl">
                            Engineers and builders dedicated to the future of education.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
                        {
                            leadership.map((leader, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="group bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl flex items-start gap-6 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all"
                                >
                                    <div className="relative w-20 h-20 flex-shrink-0">
                                        <Image
                                            src={leader.img}
                                            alt={leader.name}
                                            fill
                                            className="object-cover rounded-full grayscale group-hover:grayscale-0 transition-all duration-500"
                                        />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-1">{leader.name}</h3>
                                        <p className="text-xs font-mono text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">
                                            {leader.role}
                                        </p>
                                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4 leading-relaxed">
                                            {leader.bio}
                                        </p>
                                        <div className="flex gap-4">
                                            <a href={leader.links.linkedin} target="_blank" rel="noopener noreferrer" aria-label={`${leader.name} on LinkedIn`} className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">
                                                <Linkedin className="w-4 h-4" />
                                            </a>
                                            <a href={leader.links.github} target="_blank" rel="noopener noreferrer" aria-label={`${leader.name} on GitHub`} className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">
                                                <Github className="w-4 h-4" />
                                            </a>
                                            {leader.links.twitter && (
                                                <a href={leader.links.twitter} target="_blank" rel="noopener noreferrer" aria-label={`${leader.name} on X`} className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">
                                                    <Twitter className="w-4 h-4" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        }
                    </div>
                </div>
            </section>
            <section className="py-24 border-t border-neutral-100 dark:border-neutral-800">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-6">Ready to join the movement?</h2>
                    <div className="flex justify-center gap-4">
                        <a href="#contact">
                            <Button size="lg" className="rounded-full bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900">
                                Contact Us <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        </a>
                        <a href={APP_LINKS.signup}>
                            <Button variant="outline" size="lg" className="rounded-full border-neutral-200 dark:border-neutral-800">
                                Explore Platform
                            </Button>
                        </a>
                    </div>
                </div>
            </section>
            <section id="contact" className="scroll-mt-24 border-t border-neutral-100 py-24 dark:border-neutral-800">
                <div className="mx-auto max-w-7xl px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-80px" }}
                        transition={{ duration: 0.5 }}
                        className="grid gap-14 lg:grid-cols-[1fr_1.2fr]"
                    >
                        <div>
                            <h2 className="mb-5 text-3xl font-bold tracking-tight text-neutral-900 dark:text-white md:text-4xl">
                                Get in touch
                            </h2>
                            <p className="mb-8 text-lg leading-relaxed text-neutral-500 dark:text-neutral-400">
                                Questions about the platform, bulk credits for a university or bootcamp,
                                partnerships, or something that is broken. We read everything.
                            </p>

                            <div className="space-y-6 text-sm">
                                <div>
                                    <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">
                                        Email
                                    </p>
                                    <a
                                        href={`mailto:${BRAND.email}`}
                                        className="inline-flex items-center gap-2 text-neutral-900 underline-offset-4 hover:underline dark:text-white"
                                    >
                                        <Mail className="h-4 w-4" aria-hidden />
                                        {BRAND.email}
                                    </a>
                                </div>
                                <div>
                                    <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">
                                        Response time
                                    </p>
                                    <p className="text-neutral-600 dark:text-neutral-400">Within two working days.</p>
                                </div>
                                <div>
                                    <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">
                                        Account &amp; billing
                                    </p>
                                    <p className="text-neutral-600 dark:text-neutral-400">
                                        Already have an account? Billing and account settings live in the app -
                                        this form is for everything else.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <ContactClient />
                    </motion.div>
                </div>
            </section>
        </div>
    )
}