"use client"

import { motion } from "framer-motion";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { MessageCircle, HelpCircle } from "lucide-react";
import Link from "next/link";
import { BRAND } from "@/lib/site";

import { LANDING_FAQS } from "./faq-data";
import { FaqAccordion } from "@/components/faq-accordion";


export default function FaqsAccrodian() {
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
                        {/* The shared accordion. This markup used to live here and the
                            hubs and comparison pages had a different one, so the same kind
                            of question looked like two different components depending on
                            which page you were on. */}
                        <FaqAccordion faqs={LANDING_FAQS} idPrefix="landing-faq" />
                    </div>
                </div>
            </div>
        </section>
    );
};