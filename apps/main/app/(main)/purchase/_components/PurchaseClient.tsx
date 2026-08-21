'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from '@repo/auth/client';
import { Button } from '@repo/ui/components/ui/button'
import { InlineLoader } from '@repo/ui/components/ui/inline-loader'
import { Input } from '@repo/ui/components/ui/input'
import { Label } from '@repo/ui/components/ui/label'
import { Slider } from '@repo/ui/components/ui/slider'
import {
	Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle
} from '@repo/ui/components/ui/sheet'
import {
	Dialog, DialogContent
} from '@repo/ui/components/ui/dialog'
import { Badge } from '@repo/ui/components/ui/badge'
import {
	Receipt, Zap, Gift, AlertTriangle, ShieldCheck, Clock, Activity,
	Terminal, Server, CheckCircle2, Wallet
} from 'lucide-react'
import Link from 'next/link'
import toast from '@repo/ui/components/ui/sonner'
import { motion } from 'framer-motion'
import {
	paymentConfig, calculatePrice, packagePrice, parseCheckoutIntent, checkoutPath,
	getPackageByCredits
} from '@repo/pricing'
import {
	computeUsageForCredits, creditUsageConfig, formatCountRange
} from '@/lib/credit-usage'
import { submitCreditRequest } from '../../../../actions/(main)/user/dashboard.action'
import { PricingBento } from '@repo/ui/components/pricing-bento'

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

	return (
		<div className="min-h-screen w-full relative overflow-hidden font-sans selection:bg-neutral-200 dark:selection:bg-neutral-800">
			{/* Grid background */}
			<div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />

			<div className="container mx-auto px-6 py-16 max-w-7xl relative z-10">

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
									className={`px-4 py-1.5 rounded-md text-xs font-bold font-mono transition-all ${
										currency === c
											? 'bg-white dark:bg-neutral-800 shadow-sm text-neutral-900 dark:text-white'
											: 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
									}`}
								>
									{c}
								</button>
							))}
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
							<Button
								asChild
								variant="outline"
								size="sm"
								className="border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900"
							>
								<Link href="/transactions">
									<Receipt className="w-3.5 h-3.5 mr-1.5" />
									History
								</Link>
							</Button>
						</div>
					</motion.div>
				</div>

				{/* ── Custom Amount Card ── */}
				<motion.div
					initial={{ opacity: 0, y: 24 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.55, delay: 0.25 }}
					className="mb-16"
				>
					<div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
						<div className="grid md:grid-cols-12">

							{/* Left: input + slider */}
							<div className="md:col-span-7 bg-white dark:bg-neutral-950 p-8 md:p-12 flex flex-col justify-between gap-10">
								{/* Large number input */}
								<div className="space-y-3">
									<Label className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.18em]">
										How many credits
									</Label>
									<div className="relative">
										<Input
											type="number"
											value={basicCredits}
											onChange={(e) => {
												const val = parseInt(e.target.value) || 0;
												if (val <= 1000) setBasicCredits(val);
											}}
											className="h-auto py-2 text-6xl md:text-7xl font-bold bg-transparent border-0 border-b-2 border-neutral-100 dark:border-neutral-800 rounded-none px-0 focus-visible:ring-0 focus-visible:border-neutral-900 dark:focus-visible:border-white transition-colors tracking-tight placeholder:text-neutral-200 dark:placeholder:text-neutral-800 leading-none"
											placeholder="50"
										/>
										<span className="absolute right-0 bottom-3 text-xs font-medium text-neutral-400 dark:text-neutral-500">
											credits
										</span>
									</div>
								</div>

								{/* Slider */}
								<div className="space-y-3">
									<div className="flex justify-between text-[10px] font-mono text-neutral-400 uppercase tracking-widest">
										<span>{paymentConfig.minCredits} min</span>
										<span>{paymentConfig.maxCredits} max</span>
									</div>
									<Slider
										value={[basicCredits]}
										min={paymentConfig.minCredits}
										max={paymentConfig.maxCredits}
										step={10}
										onValueChange={(vals) => setBasicCredits(vals[0]!)}
										className="cursor-pointer"
									/>
								</div>

								{/* Stat pills */}
								<div className="flex flex-wrap gap-3">
									<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-xs font-medium text-neutral-600 dark:text-neutral-400">
										<Terminal className="w-3.5 h-3.5 text-neutral-400" />
										≈ {Math.floor(basicCredits / 20)} Projects
									</div>
									<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-xs font-medium text-neutral-600 dark:text-neutral-400">
										<Activity className="w-3.5 h-3.5 text-neutral-400" />
										≈ {Math.floor(basicCredits / 30)} Interviews
									</div>
								</div>
							</div>

							{/* Right: Invoice card (dark) */}
							<div className="md:col-span-5 bg-neutral-900 dark:bg-neutral-950 border-l border-neutral-800 p-8 md:p-10 flex flex-col justify-between gap-8">
								{/* Invoice header */}
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center">
											<Zap className="w-4 h-4 text-white" />
										</div>
										<div>
											<p className="text-sm font-bold text-white">Order summary</p>
											<p className="text-[11px] text-neutral-400">One-time, no subscription</p>
										</div>
									</div>

								</div>

								{/* Line items */}
								<div className="space-y-3">
									<div className="flex justify-between items-center text-sm">
										<span className="text-neutral-400">Credits</span>
										<span className="font-medium text-neutral-200 tabular-nums">{basicCredits}</span>
									</div>
									<div className="h-px bg-neutral-800 my-2" />
									<div className="flex justify-between items-end">
										<span className="text-sm font-bold text-white">Total</span>
										<span className="text-3xl font-bold text-white leading-none tabular-nums">
											{currency === 'INR' ? '₹' : '$'}{calculateCustomPrice(basicCredits)}
										</span>
									</div>
								</div>

								{/* CTA */}
								<div className="space-y-3">
									<Button
										onClick={() => openUsageSheet(basicCredits, Number(calculateCustomPrice(basicCredits)))}
										disabled={isProcessing || basicCredits < paymentConfig.minCredits}
										className="w-full h-12 bg-white text-neutral-900 hover:bg-neutral-100 font-bold text-sm tracking-wide"
									>
										{isProcessing
											? <InlineLoader size="sm" />
											: 'Buy credits'
										}
									</Button>
									{basicCredits < paymentConfig.minCredits && (
										<p className="text-[11px] text-red-400 text-center">
											Minimum is {paymentConfig.minCredits} credits
										</p>
									)}
								</div>
							</div>
						</div>
					</div>
				</motion.div>

				{/* ── Tier Divider ── */}
				<div className="flex items-center gap-5 mb-12">
					<div className="h-px bg-neutral-200 dark:bg-neutral-800 flex-1" />
					<span className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.22em] whitespace-nowrap">
						Or pick a pack
					</span>
					<div className="h-px bg-neutral-200 dark:bg-neutral-800 flex-1" />
				</div>

				{/* ── Bento Pricing ── */}
				<div className="mb-20">
					<PricingBento
						currency={currency}
						onSelect={(pkg) => openUsageSheet(pkg.credits, packagePrice(pkg, currency))}
						showFreeCredits={false}
						onRequestFreeCredits={() => setIsRequestSheetOpen(true)}
					/>
				</div>

				{/* ── Trust badges ── */}
				<div className="border-t border-neutral-200 dark:border-neutral-800 pt-10">
					<div className="grid grid-cols-2 md:grid-cols-4 gap-6">
						{[
							{ icon: ShieldCheck, label: 'AES-256 Encryption', sub: 'Bank-grade security' },
							{ icon: Clock,       label: 'Instant Allocation',  sub: '<100ms processing'  },
							{ icon: AlertTriangle, label: 'No Expiration',     sub: 'Credits persist forever' },
							{ icon: Wallet,      label: 'Refund Policy',       sub: '7-day guarantee'    },
						].map((item, i) => (
							<div key={i} className="flex items-start gap-3">
								<div className="w-8 h-8 rounded-lg border border-neutral-200 dark:border-neutral-800 flex items-center justify-center flex-shrink-0">
									<item.icon className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
								</div>
								<div>
									<p className="text-sm font-bold text-neutral-900 dark:text-white leading-snug">{item.label}</p>
									<p className="text-xs text-neutral-500 mt-0.5">{item.sub}</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* ── Bounty Program Sheet ── */}
			<Sheet open={isRequestSheetOpen} onOpenChange={setIsRequestSheetOpen}>
				<SheetContent className="w-full sm:w-[480px] border-l border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-0">
					<div className="p-8 border-b border-neutral-100 dark:border-neutral-800">
						<div className="w-9 h-9 bg-neutral-100 dark:bg-neutral-900 rounded-lg flex items-center justify-center mb-5">
							<Gift className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
						</div>
						<SheetHeader className="p-0 text-left">
							<SheetTitle className="text-xl font-bold">Bounty Program</SheetTitle>
							<SheetDescription className="text-neutral-500 mt-1">
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
										className={`py-2.5 rounded-lg text-sm font-mono font-bold border transition-all ${
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
							<p className="text-xs text-neutral-500 leading-relaxed">
								Post must be public and mention <span className="font-semibold text-neutral-700 dark:text-neutral-300">@shipithq</span> to pass verification.
							</p>
						</div>

						<Button
							onClick={handleRequestSubmit}
							disabled={isSubmitting}
							className="w-full h-11 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold"
						>
							{isSubmitting ? 'Verifying...' : 'Submit Claim'}
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
							<SheetDescription className="text-neutral-500 mt-1">
								Verify allocation before executing transaction.
							</SheetDescription>
						</SheetHeader>
					</div>

					<div className="p-8 space-y-6">
						{/* Summary pill */}
						<div className="flex justify-between items-center px-4 py-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
							<span className="text-sm text-neutral-500">Total Allocation</span>
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
										<p className="text-xs text-neutral-500 mt-0.5">{formatCountRange(item.privateCount)} units</p>
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
							<p className="text-sm text-neutral-500 max-w-[180px] mx-auto leading-relaxed">
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
