"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function TermsPage() {
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
                                ShipItHQ Uni
                            </p>
                            <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 mb-6">
                                Legal documents
                            </p>
                            <nav className="space-y-1 mb-10">
                                <span className="block px-3 py-2 text-sm font-semibold text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                                    Terms of Service
                                </span>
                                <Link
                                    href="/privacy"
                                    className="block px-3 py-2 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white dark:text-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-900 dark:bg-white rounded-lg transition-colors"
                                >
                                    Privacy Policy
                                </Link>
                                <a
                                    href="mailto:legal@shipithq.com"
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
                                    href="mailto:legal@shipithq.com"
                                    className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors break-all"
                                >
                                    legal@shipithq.com
                                </a>
                            </div>
                        </div>
                    </aside>

                    {/* Main content */}
                    <main className="flex-1 min-w-0">
                        <div className="mb-12">
                            <p className="text-sm text-neutral-400 mb-6">Last updated: December 30, 2025</p>
                            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-neutral-900 dark:text-white leading-none mb-6">
                                Terms of <em>service.</em>
                            </h1>
                            <p className="text-base text-neutral-500 dark:text-neutral-400 max-w-2xl leading-relaxed">
                                These terms govern your use of ShipItHQ Uni. By using our platform, you agree to be bound by them.
                            </p>
                        </div>

                        <div className="space-y-0">
                            {/* Section 01 */}
                            <div className="py-10 border-t border-neutral-200 dark:border-neutral-800">
                                <h2 className="flex items-center text-lg font-bold text-neutral-900 dark:text-white mb-4">
                                    <span className="font-mono text-xs text-neutral-400 mr-4">01</span>
                                    Acceptance of Terms
                                </h2>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed pl-8">
                                    By accessing or using ShipItHQ Uni, you agree to be bound by these Terms of Service.
                                    If you disagree with any part of the terms, you may not access the service.
                                </p>
                            </div>

                            {/* Section 02 */}
                            <div className="py-10 border-t border-neutral-200 dark:border-neutral-800">
                                <h2 className="flex items-center text-lg font-bold text-neutral-900 dark:text-white mb-4">
                                    <span className="font-mono text-xs text-neutral-400 mr-4">02</span>
                                    Platform Services
                                </h2>
                                <div className="pl-8 space-y-3 text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                    <p>
                                        ShipItHQ Uni provides an educational technology platform that connects universities
                                        with industry-standard learning and assessment tools. Our services include:
                                    </p>
                                    <ul className="list-disc pl-5 space-y-2">
                                        <li>Assignment and assessment management</li>
                                        <li>AI-powered coding assessments</li>
                                        <li>Mock interview practice systems</li>
                                        <li>Student progress tracking and analytics</li>
                                        <li>Placement portal integration</li>
                                        <li>Credit-based resource allocation</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Section 03 */}
                            <div className="py-10 border-t border-neutral-200 dark:border-neutral-800">
                                <h2 className="flex items-center text-lg font-bold text-neutral-900 dark:text-white mb-4">
                                    <span className="font-mono text-xs text-neutral-400 mr-4">03</span>
                                    Account Registration
                                </h2>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed pl-8">
                                    Universities must register and complete verification to use our platform. Faculty members
                                    are invited by university administrators. Students verify through their university email domain.
                                    You are responsible for maintaining the confidentiality of your account credentials.
                                </p>
                            </div>

                            {/* Section 04 */}
                            <div className="py-10 border-t border-neutral-200 dark:border-neutral-800">
                                <h2 className="flex items-center text-lg font-bold text-neutral-900 dark:text-white mb-4">
                                    <span className="font-mono text-xs text-neutral-400 mr-4">04</span>
                                    User Conduct
                                </h2>
                                <div className="pl-8 space-y-3 text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                    <p>You agree not to:</p>
                                    <ul className="list-disc pl-5 space-y-2">
                                        <li>Submit plagiarized or dishonest work</li>
                                        <li>Share account credentials or bypass security measures</li>
                                        <li>Misuse platform resources or credits</li>
                                        <li>Attempt to manipulate grades or assessment results</li>
                                        <li>Harass, abuse, or harm other users</li>
                                        <li>Use the platform for any unlawful purpose</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Section 05 */}
                            <div className="py-10 border-t border-neutral-200 dark:border-neutral-800">
                                <h2 className="flex items-center text-lg font-bold text-neutral-900 dark:text-white mb-4">
                                    <span className="font-mono text-xs text-neutral-400 mr-4">05</span>
                                    Credit System
                                </h2>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed pl-8">
                                    Universities purchase credits to enable student access to premium features like AI assessments
                                    and mock interviews. Credits are allocated by university administrators and may expire
                                    per the subscription terms. Unused credits are non-refundable unless otherwise specified.
                                </p>
                            </div>

                            {/* Section 06 */}
                            <div className="py-10 border-t border-neutral-200 dark:border-neutral-800">
                                <h2 className="flex items-center text-lg font-bold text-neutral-900 dark:text-white mb-4">
                                    <span className="font-mono text-xs text-neutral-400 mr-4">06</span>
                                    Academic Integrity
                                </h2>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed pl-8">
                                    Our platform includes AI-powered plagiarism detection and proctoring features.
                                    Any attempt to cheat or violate academic integrity policies may result in account suspension
                                    and notification to your university administration.
                                </p>
                            </div>

                            {/* Section 07 */}
                            <div className="py-10 border-t border-neutral-200 dark:border-neutral-800">
                                <h2 className="flex items-center text-lg font-bold text-neutral-900 dark:text-white mb-4">
                                    <span className="font-mono text-xs text-neutral-400 mr-4">07</span>
                                    Intellectual Property
                                </h2>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed pl-8">
                                    The platform, including its original content, features, and functionality,
                                    is owned by ShipItHQ and protected by international copyright, trademark,
                                    and other intellectual property laws. Faculty-created content remains their property.
                                </p>
                            </div>

                            {/* Section 08 */}
                            <div className="py-10 border-t border-neutral-200 dark:border-neutral-800">
                                <h2 className="flex items-center text-lg font-bold text-neutral-900 dark:text-white mb-4">
                                    <span className="font-mono text-xs text-neutral-400 mr-4">08</span>
                                    Limitation of Liability
                                </h2>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed pl-8">
                                    ShipItHQ Uni shall not be liable for any indirect, incidental, special,
                                    consequential, or punitive damages resulting from your use of the service.
                                </p>
                            </div>

                            {/* Section 09 */}
                            <div className="py-10 border-t border-neutral-200 dark:border-neutral-800">
                                <h2 className="flex items-center text-lg font-bold text-neutral-900 dark:text-white mb-4">
                                    <span className="font-mono text-xs text-neutral-400 mr-4">09</span>
                                    Termination
                                </h2>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed pl-8">
                                    We may terminate or suspend your account immediately for any breach of these Terms.
                                    University administrators may also suspend individual user accounts.
                                    Academic records may be retained per legal requirements.
                                </p>
                            </div>

                            <div className="py-10 border-t border-neutral-200 dark:border-neutral-800">
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                    Questions about these Terms? Contact us at{" "}
                                    <a href="mailto:legal@shipithq.com" className="text-neutral-900 dark:text-white underline">
                                        legal@shipithq.com
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
