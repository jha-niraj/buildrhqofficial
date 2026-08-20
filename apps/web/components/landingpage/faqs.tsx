"use client"

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import {
    MessageCircle, Plus, HelpCircle
} from "lucide-react";
import Link from "next/link";

// Rewritten 2026-08-20. The previous set described a DIFFERENT PRODUCT - courses,
// lessons, videos, "new languages added regularly", certificates for completing a
// course. None of that exists here and none of it ever did on this platform; it is
// inherited from an earlier language-tutorial site. See plan/web/polish/01-content-truth.md.
//
// Every answer below is checked against a route in apps/main. Answers are written
// ANSWER-FIRST - the first sentence answers the question and stands on its own -
// because that is the form AI Overviews and assistants quote.
const faqData = [
    {
        id: "item-1",
        question: "What is ShipItHQ?",
        answer: "ShipItHQ is an interview-preparation and portfolio platform for computer-science students and software engineers. It gives you four things in one place: pattern-based practice across DSA, system design, frontend and backend; guided portfolio projects broken into real tasks; voice mock interviews with scored feedback; and AI tools for your resume and cover letters."
    },
    {
        id: "item-2",
        question: "How is this different from LeetCode?",
        answer: "LeetCode gives you problems; ShipItHQ gives you the whole loop from practice to portfolio to interview. Practice is organised by pattern rather than by problem count, hints nudge rather than reveal, and the same account also builds the projects you talk about in an interview and runs the mock interview where you talk about them."
    },
    {
        id: "item-3",
        question: "Does my code actually run?",
        answer: "Yes - in a real Linux container, not a browser emulator. JavaScript, TypeScript, Python, Java, C and C++ execute server-side with the real toolchain, so your program behaves the way it would on your own machine rather than in a simulated subset."
    },
    {
        id: "item-4",
        question: "What are the mock interviews like?",
        answer: "They are spoken conversations with an AI interviewer, not multiple-choice quizzes. You talk through the round, the interviewer asks follow-up questions, and afterwards you get a transcript plus scored feedback on communication, technical depth and problem-solving with specific moments quoted back to you."
    },
    {
        id: "item-5",
        question: "How do credits work?",
        answer: "ShipItHQ is credit-based and every new account starts with 100 free credits, no card required. Credits are spent on AI operations - generating a project, tailoring a resume, running a mock interview - and each operation shows its cost before you confirm. Credits never expire, and if an AI operation fails, the credits are refunded automatically."
    },
    {
        id: "item-6",
        question: "Can it tailor my resume to a specific job?",
        answer: "Yes. Paste a job description and ShipItHQ writes a tailored copy of your existing resume rather than asking you to re-enter your experience. Your original is never overwritten - the tailored version is saved as a separate resume - and it will not invent employers, dates or skills you have not listed."
    },
    {
        id: "item-7",
        question: "Do I need experience to start?",
        answer: "No, but this is a platform for people who already write some code. If you are learning your first language, start with a language course elsewhere and come back when you can solve a basic problem unaided - practice here assumes you can read and write code, and the projects assume you can run a development environment."
    },
    {
        id: "item-8",
        question: "Do I get a certificate?",
        answer: "No, and that is deliberate. What you get instead is evidence a hiring manager can check: deployed projects with commit history, a public profile, and a record of what you have actually solved. A certificate from a platform nobody has heard of does less for you than one project you can explain in detail."
    },
    {
        id: "item-9",
        question: "Does it work on a phone?",
        answer: "Most of it does. Reading problems, reviewing projects, running mock interviews and editing your resume all work on a phone. Writing and running code is a desktop job - a code editor on a 360px screen is a worse experience than we are willing to ship."
    }
];

export default function FaqsAccrodian() {
    const [openIndex, setOpenIndex] = useState<string | null>(null);

    return (
        <section className="py-24 relative bg-white dark:bg-neutral-950 border-t border-neutral-100 dark:border-neutral-800">
            <div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />

            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24">
                    <motion.div
                        initial={{ opacity: 0, y: -16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="lg:col-span-4"
                    >
                        <div className="sticky top-24">
                            <Badge variant="outline" className="px-4 py-1.5 rounded-full border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 font-medium text-sm mb-6">
                                <HelpCircle className="w-3.5 h-3.5 mr-2" />
                                Knowledge Base
                            </Badge>
                            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mb-6 tracking-tight">
                                Common <br />
                                <span className="text-neutral-500 dark:text-neutral-400">Questions.</span>
                            </h2>
                            <p className="text-lg text-neutral-500 dark:text-neutral-400 mb-8 leading-relaxed">
                                Everything you need to know about the platform, certifications, and technical capabilities.
                            </p>
                            <Link href="mailto:theshipitofficial@gmail.com">
                                <Button className="cursor-pointer h-12 px-6 rounded-full bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 font-medium transition-all">
                                    <MessageCircle className="w-4 h-4 mr-2" />
                                    Talk to Support
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                    <div className="lg:col-span-8">
                        <div className="space-y-4">
                            {
                                faqData.map((faq, _index) => (
                                    <motion.div
                                        key={faq.id}
                                        initial={{ opacity: 0, y: -16 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                                        className="group border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-xl overflow-hidden hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
                                    >
                                        <button
                                            onClick={() => setOpenIndex(openIndex === faq.id ? null : faq.id)}
                                            className="cursor-pointer flex items-start justify-between w-full p-6 text-left"
                                        >
                                            <span className="text-lg font-semibold text-neutral-900 dark:text-white pr-8">
                                                {faq.question}
                                            </span>
                                            <div className={`flex-shrink-0 transition-transform duration-300 ${openIndex === faq.id ? "rotate-45" : "rotate-0"}`}>
                                                {
                                                    openIndex === faq.id ? (
                                                        <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-900 dark:text-white">
                                                            <Plus className="w-5 h-5 rotate-45" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-neutral-500 dark:text-neutral-400 group-hover:bg-neutral-100 dark:group-hover:bg-neutral-800 transition-colors">
                                                            <Plus className="w-5 h-5" />
                                                        </div>
                                                    )
                                                }
                                            </div>
                                        </button>
                                        <AnimatePresence>
                                            {
                                                openIndex === faq.id && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                                    >
                                                        <div className="px-6 pb-6 pt-0">
                                                            <div className="h-px w-full bg-neutral-100 dark:bg-neutral-800 mb-4" />
                                                            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                                                {faq.answer}
                                                            </p>
                                                        </div>
                                                    </motion.div>
                                                )
                                            }
                                        </AnimatePresence>
                                    </motion.div>
                                ))
                            }
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};