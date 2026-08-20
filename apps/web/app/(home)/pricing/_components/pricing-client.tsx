"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Lock, Infinity as Infit, Server, Sparkles } from "lucide-react"
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@repo/ui/components/ui/accordion"
import { PricingBento } from "@repo/ui/components/pricing-bento"
import { checkoutUrl } from "@repo/pricing"
import { PageHero } from "@/components/page-hero"
import { pricingFaqs } from "./pricing-faqs"
import { APP_LINKS, APP_URL } from "@/lib/site"

const valueProps = [
	{ icon: Infit, title: "Credits never expire", desc: "Buy once, spend whenever. Your balance is yours forever." },
	{ icon: Lock, title: "Encrypted & secure", desc: "AES-256 encryption on every transaction. INR & USD supported." },
	{ icon: Server, title: "Instant provisioning", desc: "Compute is allocated the moment your payment completes." },
]

export default function PricingClient() {
	const [currency, setCurrency] = useState<"INR" | "USD">("INR")

	return (
		<main className="bg-white dark:bg-neutral-950">
			{/* ── Hero ─────────────────────────────────────────────────────────── */}
			{/* `ledger` variant: someone on this page arrived wanting a number, so the
			    header states the model and then puts four hard facts under a rule. The
			    bespoke #faf7f2 ground and its own shader went with the old header - see
			    components/page-hero.tsx on why the surface is not a prop. */}
			<PageHero
				variant="ledger"
				eyebrow="Pricing"
				title={<>Pay only for what you run.</>}
				sub="No subscription, no idle-time charge. Buy a pack once and spend credits when you actually build, practise or interview - and if an AI operation fails, the credits come straight back."
				facts={[
					{ value: "100", label: "Free credits on signup" },
					{ value: "0", label: "Subscriptions" },
					{ value: "Never", label: "Credits expire" },
					{ value: "6", label: "Languages that run" },
				]}
			/>

			{/* The currency toggle moved out of the header and above the cards it
			    actually controls. In the header it was a control sitting a screen away
			    from the prices it changed. */}
			<div className="mx-auto flex w-fit items-center gap-4 rounded-full border border-neutral-200 bg-neutral-100/80 py-2 pl-4 pr-2 mt-10 dark:border-neutral-800 dark:bg-neutral-900">
				<span className={`font-mono text-sm font-bold transition-colors ${currency === "INR" ? "text-neutral-900 dark:text-white" : "text-neutral-600 dark:text-neutral-400"}`}>
					INR
				</span>
				<button
					onClick={() => setCurrency(currency === "INR" ? "USD" : "INR")}
					className="relative h-6 w-12 rounded-full bg-neutral-900 transition-colors dark:bg-white"
					aria-label="Toggle currency"
				>
					<span
						className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all dark:bg-neutral-900 ${currency === "USD" ? "left-6" : "left-0.5"}`}
					/>
				</button>
				<span className={`font-mono text-sm font-bold transition-colors ${currency === "USD" ? "text-neutral-900 dark:text-white" : "text-neutral-600 dark:text-neutral-400"}`}>
					USD
				</span>
			</div>

			{/* ── Pricing cards ────────────────────────────────────────────────── */}
			<section className="relative border-t border-neutral-100 py-20 dark:border-neutral-800">
				<div className="mx-auto max-w-7xl px-6">
					<PricingBento
						currency={currency}
						hrefFor={(pkg) => checkoutUrl(APP_URL, pkg, currency)}
						showFreeCredits
						freeCreditsHref={`${APP_URL}/purchase`}
					/>
				</div>
			</section>

			{/* ── Value props ──────────────────────────────────────────────────── */}
			<section className="border-t border-neutral-100 py-16 dark:border-neutral-800">
				<div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-6 md:grid-cols-3">
					{valueProps.map((v) => (
						<div
							key={v.title}
							className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
						>
							<div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-50 dark:bg-neutral-200/10">
								<v.icon className="h-5 w-5 text-neutral-900 dark:text-white" />
							</div>
							<h3 className="text-base font-bold text-neutral-900 dark:text-white">{v.title}</h3>
							<p className="mt-2 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">{v.desc}</p>
						</div>
					))}
				</div>
			</section>

			{/* ── FAQ ──────────────────────────────────────────────────────────── */}
			<section className="border-t border-neutral-100 py-20 dark:border-neutral-800">
				<div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 lg:grid-cols-[0.8fr_1.2fr]">
					<div className="lg:sticky lg:top-24 lg:h-fit">
						<span className="font-mono text-[11px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
							FAQ
						</span>
						<h2 className="mt-3 text-3xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-4xl">
							Questions,{" "}
							<span className="text-neutral-500 dark:text-neutral-400">answered.</span>
						</h2>
						<p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
							Everything about how credits, billing, and access work on ShipItHQ.
						</p>
						<Link
							href="/aboutus#contact"
							className="mt-6 inline-flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-900"
						>
							Talk to support <ArrowRight className="h-4 w-4" />
						</Link>
					</div>

					<Accordion type="single" collapsible className="space-y-3">
						{pricingFaqs.map((faq, i) => (
							<AccordionItem
								key={i}
								value={`faq-${i}`}
								className="rounded-xl border border-neutral-200 px-5 dark:border-neutral-800"
							>
								<AccordionTrigger className="py-4 text-left text-[15px] font-semibold text-neutral-900 hover:no-underline dark:text-white">
									{faq.q}
								</AccordionTrigger>
								<AccordionContent className="pb-4 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
									{faq.a}
								</AccordionContent>
							</AccordionItem>
						))}
					</Accordion>
				</div>
			</section>

			{/* ── CTA ──────────────────────────────────────────────────────────── */}
			<section className="border-t border-neutral-100 py-20 dark:border-neutral-800">
				<div className="mx-auto max-w-3xl px-6 text-center">
					<Sparkles className="mx-auto mb-5 h-7 w-7 text-neutral-900 dark:text-white" />
					<h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-4xl">
						Start building for{" "}
						<span className="text-neutral-900 dark:text-white">free.</span>
					</h2>
					<p className="mx-auto mt-4 max-w-lg text-neutral-500 dark:text-neutral-400">
						Create an account, claim your starter credits, and run your first AI
						agent in minutes.
					</p>
					<div className="mt-8 flex flex-wrap justify-center gap-3">
						<a
							href={APP_LINKS.signup}
							className="inline-flex items-center gap-2 rounded-xl bg-neutral-950 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-950"
						>
							Get started free <ArrowRight className="h-4 w-4" />
						</a>
						<Link
							href="/aboutus#contact"
							className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 px-7 py-3.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-white/10 dark:text-white/70 dark:hover:bg-white/5"
						>
							Talk to us
						</Link>
					</div>
				</div>
			</section>
		</main>
	)
}
