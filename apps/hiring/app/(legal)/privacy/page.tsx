"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function PrivacyPage() {
    return (
        <div className="min-h-dvh bg-white dark:bg-neutral-950 font-sans selection:bg-neutral-100 dark:selection:bg-neutral-800">
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="max-w-7xl mx-auto px-6 py-16 md:py-24"
            >
                <div className="flex gap-16 items-start">
                    {/* Sidebar */}
                    <aside className="hidden lg:block w-[260px] shrink-0">
                        <div className="sticky top-24">
                            <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 mb-2">
                                ShipItHQ Hiring
                            </p>
                            <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 mb-6">
                                Legal documents
                            </p>
                            <nav className="space-y-1 mb-10">
                                <Link
                                    href="/terms"
                                    className="block px-3 py-2 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white dark:text-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-900 dark:bg-white rounded-lg transition-colors"
                                >
                                    Terms of Service
                                </Link>
                                <span className="block px-3 py-2 text-sm font-semibold text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                                    Privacy Policy
                                </span>
                                <a
                                    href="mailto:privacy@shipithq.com"
                                    className="block px-3 py-2 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white dark:text-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-900 dark:bg-white rounded-lg transition-colors"
                                >
                                    Contact
                                </a>
                            </nav>
                            <div className="border-t border-neutral-200 dark:border-neutral-800 pt-8">
                                <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 mb-3">
                                    Questions?
                                </p>
                                <a
                                    href="mailto:privacy@shipithq.com"
                                    className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors break-all"
                                >
                                    privacy@shipithq.com
                                </a>
                            </div>
                        </div>
                    </aside>

                    {/* Main content */}
                    <main className="flex-1 min-w-0">
                        <div className="mb-12">
                            <p className="text-sm text-neutral-400 mb-6">Last updated: December 29, 2025</p>
                            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-neutral-900 dark:text-white leading-none mb-6">
                                Privacy <em>policy.</em>
                            </h1>
                            <p className="text-base text-neutral-500 dark:text-neutral-400 max-w-2xl leading-relaxed">
                                ShipItHQ Hiring is committed to protecting your privacy. This policy explains how we collect,
                                use, disclose, and safeguard your information when you use our hiring platform services.
                            </p>
                        </div>

                        <div className="space-y-0">
                            {/* Section 01 */}
                            <div className="py-10 border-t border-neutral-200 dark:border-neutral-800">
                                <h2 className="flex items-center text-lg font-bold text-neutral-900 dark:text-white mb-4">
                                    <span className="font-mono text-xs text-neutral-400 mr-4">01</span>
                                    Information We Collect
                                </h2>
                                <div className="pl-8 space-y-4 text-sm text-neutral-500 dark:text-neutral-400">
                                    <p className="font-medium text-neutral-700 dark:text-neutral-300">Account Information</p>
                                    <ul className="list-disc pl-5 space-y-2 leading-relaxed">
                                        <li>Company name, website, and description</li>
                                        <li>Contact information (email, phone)</li>
                                        <li>User account credentials</li>
                                        <li>Team member information</li>
                                    </ul>
                                    <p className="font-medium text-neutral-700 dark:text-neutral-300 pt-2">Usage Data</p>
                                    <ul className="list-disc pl-5 space-y-2 leading-relaxed">
                                        <li>Job posting and application data</li>
                                        <li>Platform interaction logs</li>
                                        <li>Analytics and performance metrics</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Section 02 */}
                            <div className="py-10 border-t border-neutral-200 dark:border-neutral-800">
                                <h2 className="flex items-center text-lg font-bold text-neutral-900 dark:text-white mb-4">
                                    <span className="font-mono text-xs text-neutral-400 mr-4">02</span>
                                    How We Use Information
                                </h2>
                                <div className="pl-8 text-sm text-neutral-500 dark:text-neutral-400">
                                    <ul className="list-disc pl-5 space-y-2 leading-relaxed">
                                        <li>Provide and maintain our hiring platform services</li>
                                        <li>Match candidates with job opportunities</li>
                                        <li>Facilitate communication between employers and candidates</li>
                                        <li>Improve and optimize our platform</li>
                                        <li>Send service-related communications</li>
                                        <li>Ensure platform security and prevent fraud</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Section 03 */}
                            <div className="py-10 border-t border-neutral-200 dark:border-neutral-800">
                                <h2 className="flex items-center text-lg font-bold text-neutral-900 dark:text-white mb-4">
                                    <span className="font-mono text-xs text-neutral-400 mr-4">03</span>
                                    Data Sharing
                                </h2>
                                <div className="pl-8 space-y-3 text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                    <p>We do not sell your personal information. We may share data with:</p>
                                    <ul className="list-disc pl-5 space-y-2">
                                        <li>Service providers who assist in platform operations</li>
                                        <li>Law enforcement when required by law</li>
                                        <li>Business partners with your explicit consent</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Section 04 */}
                            <div className="py-10 border-t border-neutral-200 dark:border-neutral-800">
                                <h2 className="flex items-center text-lg font-bold text-neutral-900 dark:text-white mb-4">
                                    <span className="font-mono text-xs text-neutral-400 mr-4">04</span>
                                    Data Security
                                </h2>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed pl-8">
                                    We implement industry-standard security measures including encryption,
                                    access controls, and regular security audits to protect your data.
                                </p>
                            </div>

                            {/* Section 05 */}
                            <div className="py-10 border-t border-neutral-200 dark:border-neutral-800">
                                <h2 className="flex items-center text-lg font-bold text-neutral-900 dark:text-white mb-4">
                                    <span className="font-mono text-xs text-neutral-400 mr-4">05</span>
                                    Your Rights
                                </h2>
                                <div className="pl-8 text-sm text-neutral-500 dark:text-neutral-400">
                                    <ul className="list-disc pl-5 space-y-2 leading-relaxed">
                                        <li>Access and export your data</li>
                                        <li>Request correction of inaccurate information</li>
                                        <li>Delete your account and associated data</li>
                                        <li>Opt-out of marketing communications</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="py-10 border-t border-neutral-200 dark:border-neutral-800">
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                    For privacy-related inquiries, contact us at{" "}
                                    <a href="mailto:privacy@shipithq.com" className="text-neutral-900 dark:text-white underline">
                                        privacy@shipithq.com
                                    </a>
                                </p>
                            </div>
                        </div>
                    </main>
                </div>
            </motion.div>
        </div>
    );
}
