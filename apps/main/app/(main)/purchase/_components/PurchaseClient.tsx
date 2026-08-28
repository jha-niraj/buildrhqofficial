'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from '@repo/auth/client';
import { Button } from '@repo/ui/components/ui/button'
import { InlineLoader } from '@repo/ui/components/ui/inline-loader'
import { Input } from '@repo/ui/components/ui/input'
import { Label } from '@repo/ui/components/ui/label'
import {
	Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle
} from '@repo/ui/components/ui/sheet'
import {
	Dialog, DialogContent
} from '@repo/ui/components/ui/dialog'
import { Badge } from '@repo/ui/components/ui/badge'
import { Zap, Gift, AlertTriangle, Activity, Terminal, Server, CheckCircle2, Wallet, X } from 'lucide-react'
import Link from 'next/link'
import toast from '@repo/ui/components/ui/sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
	paymentConfig, calculatePrice, packagePrice, parseCheckoutIntent, checkoutPath,
	getPackageByCredits
} from '@repo/pricing'
import {
	computeUsageForCredits, creditUsageConfig, formatCountRange
} from '@/lib/credit-usage'
import { submitCreditRequest } from '../../../../actions/(main)/user/dashboard.action'
import { PricingBento } from '@repo/ui/components/pricing-bento'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@repo/ui/components/ui/accordion'
import { pricingFaqs } from '@repo/pricing/faqs'
import { ScrollArea } from '@repo/ui/components/ui/scroll-area'
import TransactionsClient from '@/app/(main)/transactions/_components/TransactionsClient'

// Load Razorpay types
interface RazorpayResponse {
	razorpay_payment_id: string
	razorpay_order_id: string
	razorpay_signature: string
}

interface RazorpayOptions {
	key: string | undefined
	amount: number
	currency: string
	name: string
	description: string
	image: string
	order_id: string
	handler: (response: RazorpayResponse) => void
	prefill: { name: string; email: string }
	theme: { color: string }
	modal: { ondismiss: () => void }
}

interface RazorpayInstance {
	open: () => void
	on: (event: string, callback: () => void) => void
}

declare global {
	interface Window {
		Razorpay: new (options: RazorpayOptions) => RazorpayInstance
	}
}

export default function PurchasePage() {
	const { data: session, isPending: sessionPending } = useSession()
	const router = useRouter()
	const searchParams = useSearchParams()
	const [currency, setCurrency] = useState<'INR' | 'USD'>('INR')
	// The bounds the old slider carried inline as `20 MIN` / `1000 MAX` labels.
	// Named so the input, the clamp and the FAQ answer cannot disagree.
	const MIN_CUSTOM_CREDITS = 20
	const MAX_CUSTOM_CREDITS = 1000
	const [basicCredits, setBasicCredits] = useState(50)

	// UI States
	const [isRequestSheetOpen, setIsRequestSheetOpen] = useState(false)
	const [isProcessing, setIsProcessing] = useState(false)
	const [isProcessingDialogOpen, setIsProcessingDialogOpen] = useState(false)
	const [processingStatus, setProcessingStatus] = useState<'initializing' | 'processing' | 'verifying' | 'redirecting'>('initializing')
	const [isUsageSheetOpen, setIsUsageSheetOpen] = useState(false)

	// Transaction States
	const [pendingCredits, setPendingCredits] = useState<number | null>(null)
	const [pendingPrice, setPendingPrice] = useState<number | null>(null)
	const [usageSummary, setUsageSummary] = useState(() => computeUsageForCredits(50))

	// Form States
	const [requestCredits, setRequestCredits] = useState(25)
	const [linkedinPostUrl, setLinkedinPostUrl] = useState('')
	const [twitterPostUrl, setTwitterPostUrl] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)

	// Calculate Price Helper
	const calculateCustomPrice = (credits: number) => {
		const price = calculatePrice(credits, currency)
		return currency === 'INR' ? Math.round(price) : price.toFixed(2)
	}

	// Payment Logic
	const initiatePayment = async (credits: number, price: number) => {
		if (!session?.user) {
			toast.error('Please sign in to purchase credits')
			return
		}
		if (isProcessing) return

		try {
			setIsProcessing(true)
			setIsProcessingDialogOpen(true)
			setProcessingStatus('initializing')

			setProcessingStatus('processing')
			const response = await fetch('/api/payments/create-order', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ credits, currency }),
			})

			const data = await response.json()
			if (!response.ok || !data.success) throw new Error(data.message || 'Failed to create order')

			const amountInSmallestUnit = currency === 'INR' ? Math.round(price * 100) : Math.round(price * 100);

			const options: RazorpayOptions = {
				key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
				amount: amountInSmallestUnit,
				currency: currency,
				name: 'ShipItHQ',
				description: `${credits} credits`,
				image: '/titlelogo.jpeg',
				order_id: data.orderId,
				handler: async function (response: RazorpayResponse) {
					try {
						document.body.classList.remove('rzp-open')
						setIsProcessingDialogOpen(true)
						setProcessingStatus('verifying')
						const verifyResponse = await fetch('/api/payments/verify', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								razorpay_payment_id: response.razorpay_payment_id,
								razorpay_order_id: response.razorpay_order_id,
								razorpay_signature: response.razorpay_signature,
							}),
						})
						const verifyData = await verifyResponse.json()
						if (verifyResponse.ok && verifyData.success) {
							setProcessingStatus('redirecting')
							setTimeout(() => {
								window.location.href = `/purchase/success?paymentId=${verifyData.paymentId}&credits=${credits}&amount=${price}&currency=${currency}`
							}, 1000)
						} else {
							throw new Error(verifyData.message || 'Payment verification failed')
						}
					} catch (err: unknown) {
						const error = err instanceof Error ? err : new Error('Verification failed')
						toast.error(error.message)
						setIsProcessingDialogOpen(false)
						setIsProcessing(false)
					}
				},
				prefill: { name: session.user.name || '', email: session.user.email || '' },
				theme: { color: '#000000' },
				modal: {
					ondismiss: function () {
						document.body.classList.remove('rzp-open')
						setIsProcessingDialogOpen(false)
						setIsProcessing(false)
					},
				},
			}

			const rzp = new window.Razorpay(options)
			rzp.on('payment.failed', function () {
				toast.error('Payment failed')
				setIsProcessingDialogOpen(false)
				setIsProcessing(false)
			})
			setIsProcessingDialogOpen(false)
			await new Promise(requestAnimationFrame)
			document.body.classList.add('rzp-open')
			rzp.open()
		} catch (err: unknown) {
			const error = err instanceof Error ? err : new Error('Payment failed')
			toast.error(error.message)
			setIsProcessingDialogOpen(false)
			setIsProcessing(false)
		}
	}

	// Signed-out visitors reach this page from the public pricing site, so a dead
	// "Authentication required" toast would strand them. Send them to sign up with
	// the pack they picked encoded in the callback, and they land back here on it.
	const sendToSignUp = (credits: number) => {
		const pkg = getPackageByCredits(credits)
		const back = pkg ? checkoutPath(pkg, currency) : '/purchase'
		router.push(`/register?callbackUrl=${encodeURIComponent(back)}`)
	}

	const openUsageSheet = (credits: number, price: number) => {
		if (!session?.user) {
			sendToSignUp(credits)
			return
		}
		setPendingCredits(credits)
		setPendingPrice(price)
		setUsageSummary(computeUsageForCredits(credits, creditUsageConfig))
		setIsUsageSheetOpen(true)
	}

	// ── Checkout handoff from the marketing site ──────────────────────────────
	// apps/web links here as /purchase?plan=<slug>&credits=<n>&currency=<INR|USD>.
	// Only the pack identity travels in the URL - never a price - so the amount is
	// always the one looked up from @repo/pricing here and re-verified server-side
	// when the order is created.
	const handledIntent = useRef(false)
	useEffect(() => {
		if (handledIntent.current) return
		const intent = parseCheckoutIntent(searchParams)
		if (!intent) return
		// Wait for the session to resolve, otherwise a signed-in user gets bounced
		// to /register on the first render.
		if (sessionPending) return

		handledIntent.current = true
		setCurrency(intent.currency)
		setBasicCredits(intent.pkg.credits)

		if (!session?.user) {
			router.push(
				`/register?callbackUrl=${encodeURIComponent(checkoutPath(intent.pkg, intent.currency))}`
			)
			return
		}

		const price = packagePrice(intent.pkg, intent.currency)
		setPendingCredits(intent.pkg.credits)
		setPendingPrice(price)
		setUsageSummary(computeUsageForCredits(intent.pkg.credits, creditUsageConfig))
		setIsUsageSheetOpen(true)
	}, [searchParams, session, sessionPending, router])

	const handleRequestSubmit = async () => {
		if (!linkedinPostUrl.trim() && !twitterPostUrl.trim()) {
			toast.error('Please provide a post URL')
			return
		}
		try {
			setIsSubmitting(true)
			const result = await submitCreditRequest({
				requestedCredits: requestCredits,
				linkedinPostUrl: linkedinPostUrl.trim(),
				twitterPostUrl: twitterPostUrl.trim() || undefined
			})
			if (result.success) {
				toast.success("Request submitted via secure channel.")
				setIsRequestSheetOpen(false)
				setLinkedinPostUrl('')
				setTwitterPostUrl('')
			} else {
				toast.error(result.error)
			}
		} catch {
			toast.error('Transmission error')
		} finally {
			setIsSubmitting(false)
		}
	}

	// NO `overflow-hidden` on the root below. It was there, and it silently
	// disabled the sticky FAQ rail: an ancestor with `overflow: hidden` becomes
	// the containing block that `position: sticky` measures against, and since
	// that element does not scroll, the rail had nowhere to travel. The class
	// looked harmless and sat three hundred lines away from the thing it broke.
	// The grid background is `absolute inset-0`, so it is bounded by the root
	// anyway and never needed clipping.
	return (
		<div className="relative min-h-screen w-full font-sans selection:bg-neutral-200 dark:selection:bg-neutral-800">
			{/* Grid background */}
			<div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />

			{/* Two elements, and which one carries the padding is the whole point.
				The reservation for the History panel is on the OUTER div; the centred,
				width-capped container is inside it.

				It was on the container itself, and that was wrong in a way the layout overlay
				showed plainly: `mx-auto max-w-7xl` centres the BOX on the full viewport, and
				padding shrinks its content from within. So the box stayed centred behind the
				panel while its content was squeezed into the left half - dead space on the
				left, dead space between the content and the panel, and a column far narrower
				than the room actually available.

				With the padding outside, the container's available width is
				`viewport - panel`, and `mx-auto` centres it in what is left. The content then
				takes the full remaining width up to its cap instead of a fraction of it.

				`pt-6`, not `py-16`: the page card already gives this page a top gutter, and
				another 64px pushed the heading a third of the way down the screen. */}
			{/* One container now. The outer div existed only to reserve room for
				the History panel, which moved to /credits (CR-11) - with no panel
				there is nothing to reserve and nothing to animate. */}
			<div className="relative z-10">
			{/* Capped. At full width on a wide monitor the pack cards stretched to
				a shape no price card wants to be, and the FAQ line length ran past
				comfortable reading. */}
			<div className="mx-auto w-full max-w-7xl px-6 pt-6 pb-16">

				{/* ── Hero Row ── */}
				<div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5 }}
						className="max-w-xl"
					>
						<Badge
							variant="outline"
							className="mb-5 inline-flex items-center gap-1.5 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 px-3 py-1 rounded-full text-xs font-medium text-neutral-500 dark:text-neutral-400"
						>
							<Wallet className="w-3 h-3" />
							Credits
						</Badge>
						{/* This page used to open "Compute Provisioning / Scale your potential" over
						    an "Allocation Amount" field and an "Invoice Preview", which is the
						    vocabulary of a cloud console. Nothing else in the product talks that
						    way, and a person buying 50 credits to score a resume is not
						    provisioning anything. Every number and every behaviour below is
						    unchanged - only the words and the weight are. */}
						<h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.08] text-neutral-900 dark:text-white mb-4">
							Buy credits.
						</h1>
						<p className="text-base text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-md">
							Credits pay for the things that call a model - practice sets, mock interviews,
							resume scoring. One-time, no subscription, and they do not expire.
						</p>
					</motion.div>

					{/* Top-right controls */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.15 }}
						className="flex flex-col items-start md:items-end gap-3"
					>
						{/* Currency pill toggle */}
						<div className="flex items-center p-1 bg-neutral-100 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
							{(['INR', 'USD'] as const).map((c) => (
								<button
									key={c}
									onClick={() => setCurrency(c)}
									className={`cursor-pointer px-4 py-1.5 rounded-md text-xs font-bold font-mono transition-all ${
										currency === c
											? 'bg-white dark:bg-neutral-800 shadow-sm text-neutral-900 dark:text-white'
											: 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
									}`}
								>
									{c}
								</button>
							))}
						</div>
						{/* Custom amount, COMPACT and up here rather than a hero panel
							below. Someone who wants an exact number is the minority case;
							they get a small field, not the loudest element on the page. */}
						<div className="flex items-end gap-2">
							<div className="space-y-1.5">
								<Label htmlFor="custom-credits" className="text-[10px] font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
									Custom amount
								</Label>
								<div className="flex items-center gap-2">
									<Input
										id="custom-credits"
										type="number"
										min={MIN_CUSTOM_CREDITS}
										max={MAX_CUSTOM_CREDITS}
										value={basicCredits}
										onChange={(e) => {
											// Clamped on the way in. An empty field parses to NaN,
											// and NaN reaches the price helper and renders "NaN".
											const n = Number.parseInt(e.target.value, 10)
											setBasicCredits(Number.isNaN(n) ? MIN_CUSTOM_CREDITS : Math.max(MIN_CUSTOM_CREDITS, Math.min(MAX_CUSTOM_CREDITS, n)))
										}}
										className="h-9 w-24"
									/>
									<span className="text-xs text-neutral-500 dark:text-neutral-400">
										= {currency === 'INR' ? '₹' : '$'}{calculateCustomPrice(basicCredits)}
									</span>
									<Button
										size="sm"
										className="h-9 cursor-pointer"
										onClick={() => openUsageSheet(basicCredits, calculatePrice(basicCredits, currency))}
									>
										Buy
									</Button>
								</div>
							</div>
						</div>

						{/* Action buttons */}
						<div className="flex gap-2">
							<Button
								onClick={() => setIsRequestSheetOpen(true)}
								variant="outline"
								size="sm"
								className="border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900"
							>
								<Gift className="w-3.5 h-3.5 mr-1.5" />
								Bounty Program
							</Button>
							{/* History moved to /credits (CR-11). It used to open a
								drag-resizable panel here, on the argument that buying and
								reviewing are the same task. They are not: this page is for
								people who have not paid yet, and a wallet with purchases,
								receipts and a full ledger needs a page, not a drawer. */}
						</div>
					</motion.div>
				</div>

				{/* ── Packs, FIRST ────────────────────────────────────────────────
					Reordered on 2026-08-28 (CR-13). The custom-amount control used to
					sit here: a full-width panel with the number set in ~72px type,
					above the packs it should be secondary to. Most people want a
					pack, and the page was arguing with them.

					The four trust badges that sat above it are gone. They answered
					"is it secure, do credits expire, can I refund" ahead of any
					price - and all three of those are now questions in the FAQ at
					the bottom, answered in sentences rather than as slogans. */}
				{/* ── Bento Pricing ── */}
				<div className="mb-20">
					<PricingBento
						currency={currency}
						onSelect={(pkg) => openUsageSheet(pkg.credits, packagePrice(pkg, currency))}
						showFreeCredits={false}
						onRequestFreeCredits={() => setIsRequestSheetOpen(true)}
					/>
				</div>

				{/* ── Frequently asked ──────────────────────────────────────────────
					Two columns, and the left one is STICKY.

					It was a full-width stack of fifteen rounded pills, which read as
					fifteen buttons rather than as one list, and gave the reader
					nothing to hold on to while they scrolled past it. The left
					column now stays put and says what the section is; the right
					column scrolls through the questions against it.

					Rows are separated by a rule, not by a card each. A question is a
					line of text, and boxing every line makes the list look heavier
					than the answers it contains.

					Questions come from `@repo/pricing`, the same list the marketing
					pricing page renders (CR-12). */}
				<section className="mb-20 grid gap-10 lg:grid-cols-12 lg:gap-16">
					<div className="lg:col-span-4">
						{/* `top-6` clears the page card's own gutter. `self-start` is
							load-bearing: a grid item stretches to the row height by
							default, and a stretched item cannot be sticky - it has
							nowhere to travel. */}
						<div className="lg:sticky lg:top-6 lg:self-start">
							<p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500">
								FAQ
							</p>
							<h2 className="text-3xl font-semibold leading-tight tracking-tight text-neutral-900 dark:text-white">
								Your questions,
								<br />
								<span className="text-neutral-400 dark:text-neutral-500">answered</span>
							</h2>
							<p className="mt-4 max-w-xs text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
								How credits work, what they cost, and what happens when they run out.
								Still stuck? We will help.
							</p>
							<div className="mt-6 flex flex-wrap gap-2">
								<Button
									size="sm"
									className="cursor-pointer"
									onClick={() => setIsRequestSheetOpen(true)}
								>
									<Gift className="mr-1.5 h-4 w-4" />
									Free credits
								</Button>
								<Button asChild size="sm" variant="outline" className="cursor-pointer">
									<Link href="/settings">Contact us</Link>
								</Button>
							</div>
						</div>
					</div>

					<div className="lg:col-span-8">
						{/* The shared AccordionItem defaults to
							`rounded-2xl bg-neutral-100 dark:bg-neutral-900`, which is why
							these rendered as fifteen dark pills running edge to edge. Each
							row is overridden below to a plain line with a rule under it - a
							question is a line of text, and boxing every line makes the list
							look heavier than the answers inside it. */}
						<Accordion type="single" collapsible className="w-full">
							{pricingFaqs.map((faq, i) => (
								<AccordionItem
									key={i}
									value={`faq-${i}`}
									className="rounded-none border-b border-neutral-200 bg-transparent last:border-b-0 dark:border-neutral-800 dark:bg-transparent"
								>
									<AccordionTrigger className="cursor-pointer px-4 py-5 text-left text-[15px] font-medium text-neutral-900 hover:no-underline dark:text-white">
										{faq.q}
									</AccordionTrigger>
									<AccordionContent className="px-4 pb-5 pr-10 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
										{faq.a}
									</AccordionContent>
								</AccordionItem>
							))}
						</Accordion>
					</div>
				</section>

			</div>
			</div>

			{/* ── Bounty Program Sheet ── */}
			<Sheet open={isRequestSheetOpen} onOpenChange={setIsRequestSheetOpen}>
				{/* 640px, not 480. The reward grid, two URL fields, a note and a submit button
					in a 480px column left everything cramped against both edges - and the sheet
					has the whole window to work with. `max-w-[92vw]` so it still fits a phone. */}
				<SheetContent className="w-full max-w-[92vw] sm:w-[640px] sm:max-w-[640px] border-l border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-0">
					<div className="p-8 border-b border-neutral-100 dark:border-neutral-800">
						<div className="w-9 h-9 bg-neutral-100 dark:bg-neutral-900 rounded-lg flex items-center justify-center mb-5">
							<Gift className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
						</div>
						<SheetHeader className="p-0 text-left">
							<SheetTitle className="text-xl font-bold">Bounty Program</SheetTitle>
							<SheetDescription className="text-neutral-500 dark:text-neutral-400 mt-1">
								Complete social tasks to earn credits.
							</SheetDescription>
						</SheetHeader>
					</div>

					<div className="p-8 space-y-7">
						{/* Reward size grid */}
						<div>
							<Label className="text-[10px] uppercase tracking-[0.18em] text-neutral-400 font-bold mb-3 block">
								Reward Size
							</Label>
							<div className="grid grid-cols-4 gap-2">
								{[10, 25, 50, 100].map((amount) => (
									<button
										key={amount}
										onClick={() => setRequestCredits(amount)}
										className={`cursor-pointer py-2.5 rounded-lg text-sm font-mono font-bold border transition-all ${
											requestCredits === amount
												? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-neutral-900 dark:border-white'
												: 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900'
										}`}
									>
										{amount}
									</button>
								))}
							</div>
						</div>

						{/* Proof of execution */}
						<div className="space-y-3">
							<Label className="text-[10px] uppercase tracking-[0.18em] text-neutral-400 font-bold block">
								Proof of Execution
							</Label>
							<Input
								placeholder="LinkedIn Post URL"
								value={linkedinPostUrl}
								onChange={(e) => setLinkedinPostUrl(e.target.value)}
								className="bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-sm"
							/>
							<div className="flex items-center gap-3">
								<div className="h-px bg-neutral-200 dark:bg-neutral-800 flex-1" />
								<span className="text-[10px] text-neutral-400 font-medium">OR</span>
								<div className="h-px bg-neutral-200 dark:bg-neutral-800 flex-1" />
							</div>
							<Input
								placeholder="Twitter / X Post URL"
								value={twitterPostUrl}
								onChange={(e) => setTwitterPostUrl(e.target.value)}
								className="bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-sm"
							/>
						</div>

						{/* Warning note */}
						<div className="flex gap-2.5 p-3.5 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
							<AlertTriangle className="w-4 h-4 text-neutral-400 flex-shrink-0 mt-px" />
							<p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
								Post must be public and mention <span className="font-semibold text-neutral-700 dark:text-neutral-300">@shipithq</span> to pass verification.
							</p>
						</div>

						<Button
							onClick={handleRequestSubmit}
							disabled={isSubmitting}
							className="w-full h-11 cursor-pointer bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold disabled:cursor-not-allowed"
						>
							{isSubmitting ? <InlineLoader size="sm" className="mr-2" /> : null}
							{isSubmitting ? 'Verifying' : 'Submit Claim'}
						</Button>
					</div>
				</SheetContent>
			</Sheet>

			{/* ── Usage Confirmation Sheet ── */}
			<Sheet open={isUsageSheetOpen} onOpenChange={setIsUsageSheetOpen}>
				<SheetContent className="w-full sm:max-w-md border-l border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-0">
					<div className="p-8 border-b border-neutral-100 dark:border-neutral-800">
						<SheetHeader className="p-0 text-left">
							<SheetTitle className="text-xl font-bold">Confirm purchase</SheetTitle>
							<SheetDescription className="text-neutral-500 dark:text-neutral-400 mt-1">
								Verify allocation before executing transaction.
							</SheetDescription>
						</SheetHeader>
					</div>

					<div className="p-8 space-y-6">
						{/* Summary pill */}
						<div className="flex justify-between items-center px-4 py-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
							<span className="text-sm text-neutral-500 dark:text-neutral-400">Total Allocation</span>
							<span className="text-lg font-bold font-mono text-neutral-900 dark:text-white tracking-tight">
								{pendingCredits} credits
							</span>
						</div>

						{/* Capacity estimates */}
						<div className="space-y-2.5">
							<Label className="text-[10px] uppercase tracking-[0.18em] text-neutral-400 font-bold block">
								Capacity Estimates
							</Label>
							{usageSummary.map((item) => (
								<div
									key={item.key}
									className="flex items-center gap-3 p-3.5 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-950"
								>
									<span className="text-xl leading-none">{item.icon}</span>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-bold text-neutral-900 dark:text-white">{item.title}</p>
										<p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{formatCountRange(item.privateCount)} units</p>
									</div>
								</div>
							))}
						</div>

						{/* Pay CTA */}
						<div className="pt-2">
							<Button
								onClick={() => pendingCredits && pendingPrice && initiatePayment(pendingCredits, pendingPrice)}
								disabled={isProcessing}
								className="w-full h-12 text-sm font-bold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
							>
								{isProcessing
									? <InlineLoader size="sm" />
									: `Pay ${currency === 'INR' ? '₹' : '$'}${pendingPrice?.toFixed(2)}`
								}
							</Button>
						</div>
					</div>
				</SheetContent>
			</Sheet>

			{/* ── Processing Dialog ── */}
			<Dialog open={isProcessingDialogOpen} onOpenChange={() => {}}>
				<DialogContent className="sm:max-w-xs border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
					<div className="flex flex-col items-center justify-center py-10 text-center gap-5">
						{processingStatus === 'redirecting' ? (
							<div className="w-14 h-14 bg-neutral-900 dark:bg-white rounded-full flex items-center justify-center animate-in zoom-in">
								<CheckCircle2 className="w-7 h-7 text-white dark:text-neutral-900" />
							</div>
						) : (
							<div className="flex h-14 w-14 items-center justify-center">
								<InlineLoader size="lg" />
							</div>
						)}
						<div>
							<h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">
								{processingStatus === 'initializing' && 'Getting ready'}
								{processingStatus === 'processing'   && 'Waiting for payment'}
								{processingStatus === 'verifying'    && 'Confirming payment'}
								{processingStatus === 'redirecting'  && 'Credits added'}
							</h3>
							<p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-[180px] mx-auto leading-relaxed">
								{processingStatus === 'processing'
									? 'Complete the secure payment in the popup.'
									: 'This only takes a moment.'}
							</p>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	)
}
