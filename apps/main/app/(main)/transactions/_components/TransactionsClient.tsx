"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useSession } from '@repo/auth/client';
import {
	Card, CardContent, CardHeader, CardTitle
} from "@repo/ui/components/ui/card"
import { Badge } from "@repo/ui/components/ui/badge"
import {
	Tabs, TabsContent, TabsList, TabsTrigger
} from "@repo/ui/components/ui/tabs"
import { Button } from "@repo/ui/components/ui/button"
import {
	Receipt, ArrowUpRight, ArrowDownLeft, Calendar, Clock, ExternalLink,
	RefreshCw, CreditCard, Gift
} from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import { getMyReferrals } from "@/actions/(main)/user/referral.action"
import { REFERRAL_XP, type ReferralSummary } from "@/lib/referrals"
import { InlineLoader } from "@repo/ui/components/ui/inline-loader"

interface CreditTransaction {
	id: string
	amount: number
	type: "PURCHASE" | "SPEND" | "BONUS" | "REWARD"
	currency: "INR" | "USD" | "NA"
	description: string
	createdAt: string
}

/**
 * `embedded` drops the page chrome so this can live inside the History panel on /purchase.
 *
 * The panel is ~520px of a page that is already a card, so the full-page dressing - the grid
 * backdrop, `min-h-screen`, the centred `max-w-5xl` container and the 4xl display heading -
 * is all wrong there: it would centre a 5xl container inside a 520px column and stack a
 * second big title under the panel's own header.
 *
 * A prop rather than a second component, because everything BELOW the header is identical and
 * a copy would drift the first time either changed.
 */
export default function TransactionsPage({ embedded = false }: { embedded?: boolean } = {}) {
	// Entrance animations are for a PAGE arriving. Inside the History panel the panel itself
	// is the animation, and running four staggered fade-ups inside something that is already
	// sliding in is the flicker Niraj saw: the skeleton clears, then every block fades from
	// zero opacity again, one after another, while the container is still moving.
	//
	// `false` disables framer's initial state without removing the motion elements, so the
	// standalone /transactions page keeps its entrance exactly as it was.
	const enter = embedded ? false : { opacity: 0, y: 20 }
	const enterFade = embedded ? false : { opacity: 0 }
	const { data: session, isPending } = useSession()
	const [transactions, setTransactions] = useState<CreditTransaction[]>([])
	const [referrals, setReferrals] = useState<ReferralSummary | null>(null)
	const [copied, setCopied] = useState(false)

	// Read once, on mount. `useSearchParams` would need a Suspense boundary around this
	// component for no benefit - the tab only matters on first render.
	const [initialTab] = useState(() => {
		if (typeof window === "undefined") return "transactions"
		return new URLSearchParams(window.location.search).get("tab") === "referrals"
			? "referrals"
			: "transactions"
	})
	const [isLoading, setIsLoading] = useState(true)
	const [refreshing, setRefreshing] = useState(false)

	const fetchData = async () => {
		try {
			setRefreshing(true)

			// Fetch transactions
			const transactionsRes = await fetch('/api/transactions')
			if (transactionsRes.ok) {
				const transactionsData = await transactionsRes.json()
				setTransactions(transactionsData.transactions || [])
			}

			// Referrals replaced the platform-transfer fetch. A server action rather than a
			// route handler because there is no third party involved - it reads this user's
			// own rows and mints their code if they never got one.
			const referralRes = await getMyReferrals()
			if (referralRes.success) setReferrals(referralRes.data)
		} catch (error) {
			console.error('Error fetching data:', error)
		} finally {
			setIsLoading(false)
			setRefreshing(false)
		}
	}

	useEffect(() => {
		if (session && !isPending) {
			fetchData()
		}
	}, [session, isPending])

	const getTransactionIcon = (type: string) => {
		switch (type) {
			case "PURCHASE":
				return <CreditCard className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
			case "SPEND":
				return <ArrowUpRight className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
			case "BONUS":
				return <ArrowDownLeft className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
			case "REWARD":
				return <ArrowDownLeft className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
			default:
				return <Receipt className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
		}
	}

	const getTransactionColor = (type: string) => {
		switch (type) {
			case "PURCHASE":
				return "bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700"
			case "SPEND":
				return "bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700"
			case "BONUS":
				return "bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700"
			case "REWARD":
				return "bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700"
			default:
				return "bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700"
		}
	}


	const formatDate = (dateString: string) => {
		try {
			return format(new Date(dateString), "MMM dd, yyyy 'at' hh:mm a")
		} catch (error) {
			console.log("Error occurred while formatting date: " + error);
			return "Invalid date"
		}
	}

	// One place decides the chrome, so the three return paths below cannot disagree about it.
	const Shell = ({ children }: { children: React.ReactNode }) =>
		embedded ? (
			<div className="px-5 py-5">{children}</div>
		) : (
			<div className="min-h-screen relative">
				<div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />
				<div className="container mx-auto px-6 py-16 max-w-5xl relative z-10">{children}</div>
			</div>
		)

	if (isPending || isLoading) {
		return (
			<Shell>
				<div>
					<div className="animate-pulse space-y-6">
						<div className="h-6 bg-neutral-100 dark:bg-neutral-800 rounded w-1/4"></div>
						<div className="h-10 bg-neutral-100 dark:bg-neutral-800 rounded w-1/2"></div>
						<div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded w-1/3"></div>
						<div className="h-12 bg-neutral-100 dark:bg-neutral-800 rounded w-full mt-8"></div>
						<div className="space-y-3 mt-4">
							{[1, 2, 3, 4].map((i) => (
								<div key={i} className="h-16 bg-neutral-100 dark:bg-neutral-800 rounded"></div>
							))}
						</div>
					</div>
				</div>
			</Shell>
		)
	}

	if (!session && !isPending) {
		return (
			<Shell>
				<div>
					<div className="flex flex-col items-center justify-center py-32 text-center">
						<div className="w-14 h-14 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl flex items-center justify-center mb-6">
							<Receipt className="h-6 w-6 text-neutral-400" />
						</div>
						<h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3">
							Authentication Required
						</h1>
						<p className="text-neutral-500 dark:text-neutral-400 mb-8 max-w-sm">
							Please sign in to view your transactions and transfers.
						</p>
						<Button asChild variant="outline" className="border-neutral-200 dark:border-neutral-800">
							<Link href="/signin">Sign In</Link>
						</Button>
					</div>
				</div>
			</Shell>
		)
	}

	return (
		<Shell>
			<div>
				{/* Page Header */}
				<div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
					<motion.div
						initial={enter}
						animate={{ opacity: 1, y: 0 }}
					>
						<Badge variant="outline" className="mb-4 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 px-3 py-1 rounded-full text-neutral-600 dark:text-neutral-400 text-xs">
							<Receipt className="w-3 h-3 mr-1.5" />
							Ledger
						</Badge>
						<h1 className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-white mb-2">
							Transaction History
						</h1>
						<p className="text-neutral-500 dark:text-neutral-400 font-light">
							Track your credit purchases, spending, and transfers
						</p>
					</motion.div>
					<motion.div
						initial={enterFade}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.15 }}
					>
						<Button
							onClick={fetchData}
							disabled={refreshing}
							variant="outline"
							className="gap-2 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900"
						>
							{refreshing ? <InlineLoader size="sm" /> : <RefreshCw className="h-4 w-4" />}
							Refresh
						</Button>
					</motion.div>
				</div>

				{/* Tabs */}
				{/* `?tab=referrals` opens straight onto that tab, which is what the sidebar's
					Referrals entry links to. `defaultValue` rather than a controlled `value`:
					the param picks the STARTING tab and then the user is free to switch, which
					is the behaviour you want from a deep link. */}
				<Tabs defaultValue={initialTab} className="space-y-6">
					<TabsList className="w-full sm:w-auto grid grid-cols-2 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-1 rounded-lg gap-1">
						<TabsTrigger
							value="transactions"
							className="flex items-center gap-2 text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 data-[state=active]:text-neutral-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md"
						>
							<CreditCard className="h-3.5 w-3.5" />
							Credit Transactions
						</TabsTrigger>
						<TabsTrigger
							value="referrals"
							className="flex items-center gap-2 text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 data-[state=active]:text-neutral-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md"
						>
							<Gift className="h-3.5 w-3.5" />
							Referrals
						</TabsTrigger>
					</TabsList>

					{/* Credit Transactions Tab */}
					<TabsContent value="transactions">
						<Card className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-sm rounded-xl overflow-hidden">
							<CardHeader className="border-b border-neutral-100 dark:border-neutral-800 px-6 py-4">
								<CardTitle className="flex items-center gap-2 text-base font-semibold text-neutral-900 dark:text-white">
									<CreditCard className="h-4 w-4 text-neutral-400" />
									Credit Transactions
									<Badge variant="secondary" className="ml-auto bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-mono text-xs">
										{transactions.length}
									</Badge>
								</CardTitle>
							</CardHeader>
							<CardContent className="p-0">
								{transactions.length === 0 ? (
									<div className="flex flex-col items-center justify-center py-20 text-center px-6">
										<div className="w-14 h-14 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl flex items-center justify-center mb-5">
											<Receipt className="h-6 w-6 text-neutral-400" />
										</div>
										<p className="text-neutral-900 dark:text-white font-medium mb-1">No transactions yet</p>
										<p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 max-w-xs">
											Start by purchasing some credits to see your transaction history here.
										</p>
										<Button asChild variant="outline" className="border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900">
											<Link href="/purchase">Buy Credits</Link>
										</Button>
									</div>
								) : (
									<div className="divide-y divide-neutral-100 dark:divide-neutral-800">
										{transactions.map((transaction, index) => (
											<motion.div
												key={transaction.id}
												initial={embedded ? false : { opacity: 0, y: 10 }}
												animate={{ opacity: 1, y: 0 }}
												transition={{ delay: index * 0.05 }}
												className="flex items-center justify-between px-6 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors"
											>
												<div className="flex items-center gap-4">
													<div className="w-8 h-8 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg flex items-center justify-center flex-shrink-0">
														{getTransactionIcon(transaction.type)}
													</div>
													<div>
														<p className="text-sm font-medium text-neutral-900 dark:text-white">
															{transaction.description}
														</p>
														<div className="flex items-center gap-1.5 mt-0.5">
															<Calendar className="h-3 w-3 text-neutral-400" />
															<span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
																{formatDate(transaction.createdAt)}
															</span>
														</div>
													</div>
												</div>
												<div className="text-right flex flex-col items-end gap-1.5">
													<span className={`font-bold font-mono text-sm ${
														transaction.type === 'PURCHASE' || transaction.type === 'BONUS' || transaction.type === 'REWARD'
															? 'text-neutral-900 dark:text-white'
															: 'text-neutral-500 dark:text-neutral-400'
													}`}>
														{transaction.type === 'PURCHASE' || transaction.type === 'BONUS' || transaction.type === 'REWARD' ? '+' : '-'}
														{transaction.amount}
													</span>
													<div className="flex items-center gap-2">
														{transaction.currency !== 'NA' && (
															<span className="text-xs text-neutral-400 font-mono">{transaction.currency}</span>
														)}
														<Badge className={`text-xs px-2 py-0 ${getTransactionColor(transaction.type)}`}>
															{transaction.type}
														</Badge>
													</div>
												</div>
											</motion.div>
										))}
									</div>
								)}
							</CardContent>
						</Card>
					</TabsContent>

					{/* ── Referrals ──
						Replaces the Platform Transfers tab. That showed credits sent out to
						TrueFool, which is a dropped concept - the table, the API route and this
						panel all went with it.

						Referrals are the opposite situation: the write side has worked for a
						long time (signup calls `processReferral`, which inserts the row, awards
						the referrer 300 XP and bumps `referralCount`) and there was simply
						nowhere to SEE it. The feature ran silently. */}
					<TabsContent value="referrals">
						<Card className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-sm rounded-xl overflow-hidden">
							<CardHeader className="border-b border-neutral-100 dark:border-neutral-800 px-6 py-4">
								<CardTitle className="flex items-center gap-2 text-base font-semibold text-neutral-900 dark:text-white">
									<Gift className="h-4 w-4 text-neutral-400" />
									Referrals
									<Badge variant="secondary" className="ml-auto bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-mono text-xs">
										{referrals?.count ?? 0}
									</Badge>
								</CardTitle>
							</CardHeader>
							<CardContent className="p-6 space-y-6">
								{/* The link, and one button to copy it. This is the whole point of
									the tab - everything below is evidence that it worked. */}
								<div>
									<p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400 dark:text-neutral-500">
										Your referral link
									</p>
									<div className="mt-2 flex flex-wrap items-center gap-2">
										<code className="min-w-0 flex-1 truncate rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
											{referrals?.link ?? "…"}
										</code>
										<Button
											variant="outline"
											size="sm"
											className="cursor-pointer shrink-0"
											disabled={!referrals?.link}
											onClick={() => {
												if (!referrals?.link) return
												void navigator.clipboard.writeText(referrals.link)
												setCopied(true)
												setTimeout(() => setCopied(false), 1600)
											}}
										>
											{copied ? "Copied" : "Copy link"}
										</Button>
									</div>
									<p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
										Anyone who signs up with this link earns you {REFERRAL_XP} XP.
									</p>
								</div>

								<div className="grid grid-cols-2 gap-3">
									<div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
										<p className="text-xs text-neutral-500 dark:text-neutral-400">People referred</p>
										<p className="mt-1 text-2xl font-bold tabular-nums text-neutral-900 dark:text-white">
											{referrals?.count ?? 0}
										</p>
									</div>
									<div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
										<p className="text-xs text-neutral-500 dark:text-neutral-400">XP earned</p>
										<p className="mt-1 text-2xl font-bold tabular-nums text-neutral-900 dark:text-white">
											{referrals?.xpEarned ?? 0}
										</p>
									</div>
								</div>

								{referrals && referrals.referred.length > 0 ? (
									<div className="divide-y divide-neutral-100 dark:divide-neutral-800">
										{referrals.referred.map((r) => (
											<div key={r.id} className="flex items-center gap-3 py-3">
												<div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-100 text-xs font-bold text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
													{(r.name ?? "?").charAt(0).toUpperCase()}
												</div>
												<div className="min-w-0 flex-1">
													<p className="truncate text-sm font-medium text-neutral-900 dark:text-white">
														{r.name ?? "A developer"}
													</p>
													<p className="text-xs text-neutral-500 dark:text-neutral-400">
														Joined {new Date(r.joinedAt).toLocaleDateString()}
													</p>
												</div>
												<span className="shrink-0 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
													+{REFERRAL_XP} XP
												</span>
											</div>
										))}
									</div>
								) : (
									<div className="py-10 text-center">
										<p className="text-sm font-medium text-neutral-900 dark:text-white">
											No referrals yet
										</p>
										<p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
											Share your link. You earn {REFERRAL_XP} XP each time someone joins with it.
										</p>
									</div>
								)}
							</CardContent>
						</Card>
					</TabsContent>

				</Tabs>
			</div>
		</Shell>
	)
}
