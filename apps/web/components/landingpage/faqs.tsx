"use client"

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import {
    MessageCircle, Plus, HelpCircle
} from "lucide-react";
import Link from "next/link";
import { BRAND } from "@/lib/site";

import { LANDING_FAQS } from "./faq-data";


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
                                What the platform does, what it costs, what runs where, and the things it deliberately does not do.
                            </p>
                            <Link href={`mailto:${BRAND.email}`}>
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
                                LANDING_FAQS.map((faq) => (
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