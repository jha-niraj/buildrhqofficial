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
	RefreshCw, CreditCard, Send
} from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

interface CreditTransaction {
	id: string
	amount: number
	type: "PURCHASE" | "SPEND" | "BONUS" | "REWARD"
	currency: "INR" | "USD" | "NA"
	description: string
	createdAt: string
}

interface CreditTransferOut {
	id: string
	creditsTransferred: number
	destinationPlatform: string
	transferId: string
	status: string
	createdAt: string
	ipAddress?: string
	userAgent?: string
}

export default function TransactionsPage() {
	const { data: session, isPending } = useSession()
	const [transactions, setTransactions] = useState<CreditTransaction[]>([])
	const [transfers, setTransfers] = useState<CreditTransferOut[]>([])
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

			// Fetch transfers
			const transfersRes = await fetch('/api/transfers')
			if (transfersRes.ok) {
				const transfersData = await transfersRes.json()
				setTransfers(transfersData.transfers || [])
			}
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

	const getStatusColor = (status: string) => {
		switch (status) {
			case "COMPLETED":
				return "bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700"
			case "PENDING":
				return "bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700"
			case "FAILED":
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

	if (isPending || isLoading) {
		return (
			<div className="min-h-screen relative">
				<div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />
				<div className="container mx-auto px-4 py-16 max-w-5xl">
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
			</div>
		)
	}

	if (!session && !isPending) {
		return (
			<div className="min-h-screen relative">
				<div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />
				<div className="container mx-auto px-4 py-16 max-w-5xl">
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
			</div>
		)
	}

	return (
		<div className="min-h-screen relative">
			<div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />
			<div className="container mx-auto px-6 py-16 max-w-5xl relative z-10">
				{/* Page Header */}
				<div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
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
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.15 }}
					>
						<Button
							onClick={fetchData}
							disabled={refreshing}
							variant="outline"
							className="gap-2 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900"
						>
							<RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
							Refresh
						</Button>
					</motion.div>
				</div>

				{/* Tabs */}
				<Tabs defaultValue="transactions" className="space-y-6">
					<TabsList className="w-full sm:w-auto grid grid-cols-2 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-1 rounded-lg gap-1">
						<TabsTrigger
							value="transactions"
							className="flex items-center gap-2 text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 data-[state=active]:text-neutral-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md"
						>
							<CreditCard className="h-3.5 w-3.5" />
							Credit Transactions
						</TabsTrigger>
						<TabsTrigger
							value="transfers"
							className="flex items-center gap-2 text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 data-[state=active]:text-neutral-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md"
						>
							<Send className="h-3.5 w-3.5" />
							Platform Transfers
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
												initial={{ opacity: 0, y: 10 }}
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

					{/* Platform Transfers Tab */}
					<TabsContent value="transfers">
						<Card className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-sm rounded-xl overflow-hidden">
							<CardHeader className="border-b border-neutral-100 dark:border-neutral-800 px-6 py-4">
								<CardTitle className="flex items-center gap-2 text-base font-semibold text-neutral-900 dark:text-white">
									<Send className="h-4 w-4 text-neutral-400" />
									Platform Transfers
									<Badge variant="secondary" className="ml-auto bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-mono text-xs">
										{transfers.length}
									</Badge>
								</CardTitle>
							</CardHeader>
							<CardContent className="p-0">
								{transfers.length === 0 ? (
									<div className="flex flex-col items-center justify-center py-20 text-center px-6">
										<div className="w-14 h-14 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl flex items-center justify-center mb-5">
											<Send className="h-6 w-6 text-neutral-400" />
										</div>
										<p className="text-neutral-900 dark:text-white font-medium mb-1">No transfers found</p>
										<p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-xs">
											Credits transferred to other platforms will appear here. Transfers are initiated from external platforms like TrueFool.
										</p>
									</div>
								) : (
									<div className="divide-y divide-neutral-100 dark:divide-neutral-800">
										{transfers.map((transfer, index) => (
											<motion.div
												key={transfer.id}
												initial={{ opacity: 0, y: 10 }}
												animate={{ opacity: 1, y: 0 }}
												transition={{ delay: index * 0.05 }}
												className="flex items-center justify-between px-6 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors"
											>
												<div className="flex items-center gap-4">
													<div className="w-8 h-8 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg flex items-center justify-center flex-shrink-0">
														<ExternalLink className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
													</div>
													<div>
														<p className="text-sm font-medium text-neutral-900 dark:text-white">
															Transfer to {transfer.destinationPlatform}
														</p>
														<div className="flex items-center gap-3 mt-0.5">
															<div className="flex items-center gap-1">
																<Calendar className="h-3 w-3 text-neutral-400" />
																<span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
																	{formatDate(transfer.createdAt)}
																</span>
															</div>
															<div className="flex items-center gap-1">
																<Clock className="h-3 w-3 text-neutral-400" />
																<span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
																	{transfer.transferId.slice(0, 8)}...
																</span>
															</div>
														</div>
													</div>
												</div>
												<div className="text-right flex flex-col items-end gap-1.5">
													<span className="font-bold font-mono text-sm text-neutral-500 dark:text-neutral-400">
														-{transfer.creditsTransferred}
													</span>
													<Badge className={`text-xs px-2 py-0 ${getStatusColor(transfer.status)}`}>
														{transfer.status}
													</Badge>
												</div>
											</motion.div>
										))}
									</div>
								)}
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	)
}
