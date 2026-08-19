'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@repo/ui/components/ui/button'
import {
	Card, CardContent, CardDescription, CardHeader, CardTitle

} from '@repo/ui/components/ui/card'
import {
	CheckCircle2, Download, Home, Receipt, Sparkles, CreditCard, 
	ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { Spotlight } from '@repo/ui/components/ui/spotlight'

export default function PaymentSuccessPage() {
	const searchParams = useSearchParams()
	const router = useRouter()
	const [paymentData, setPaymentData] = useState<{
		paymentId?: string
		credits?: number
		amount?: number
		currency?: string
	}>({})

	useEffect(() => {
		const paymentId = searchParams.get('paymentId')
		const credits = searchParams.get('credits')
		const amount = searchParams.get('amount')
		const currency = searchParams.get('currency')

		if (paymentId && credits && amount) {
			setPaymentData({
				paymentId,
				credits: parseInt(credits),
				amount: parseFloat(amount),
				currency: currency || 'INR',
			})
		} else {
			// Redirect if missing parameters
			router.push('/purchase')
		}
	}, [searchParams, router])

	const handleDownloadReceipt = () => {
		// Create a simple text receipt
		const receiptText = `
ShipItHQ - Payment Receipt

Payment ID: ${paymentData.paymentId}
Credits Purchased: ${paymentData.credits}
Amount Paid: ${paymentData.currency === 'INR' ? '₹' : '$'}${paymentData.amount}
Date: ${new Date().toLocaleString()}

Thank you for your purchase!
		`.trim()

		const blob = new Blob([receiptText], { type: 'text/plain' })
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = `receipt-${paymentData.paymentId}.txt`
		document.body.appendChild(a)
		a.click()
		document.body.removeChild(a)
		URL.revokeObjectURL(url)
	}

	return (
		<div className="min-h-screen w-full relative overflow-hidden flex items-center justify-center">
			<Spotlight
				className="-top-40 left-0 md:left-60 md:-top-20"
				fill="white"
			/>

			<div className="container mx-auto px-4 py-16 max-w-2xl relative z-10">
				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.5 }}
					className="text-center mb-8"
				>
					<div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-neutral-900 to-neutral-900 mb-6 shadow-lg">
						<CheckCircle2 className="w-12 h-12 text-white" />
					</div>
					<h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-neutral-800 to-neutral-800 dark:from-neutral-100 dark:to-neutral-100">
						Payment Successful! 🎉
					</h1>
					<p className="text-lg text-neutral-600 dark:text-neutral-400">
						Your credits have been added to your account
					</p>
				</motion.div>
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.2 }}
				>
					<Card className="border-neutral-300 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-900/40 backdrop-blur-sm shadow-lg">
						<CardHeader className="text-center pb-6 border-b border-neutral-200 dark:border-neutral-800">
							<div className="flex items-center justify-center gap-3 mb-3">
								<div className="p-2.5 bg-gradient-to-br from-neutral-900 to-neutral-900 rounded-lg shadow-md">
									<Receipt className="h-6 w-6 text-white" />
								</div>
								<CardTitle className="text-2xl font-bold text-neutral-900 dark:text-white">
									Payment Receipt
								</CardTitle>
							</div>
							<CardDescription className="text-neutral-600 dark:text-neutral-400">
								Transaction details
							</CardDescription>
						</CardHeader>
						<CardContent className="pt-6 space-y-6">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="flex justify-around items-center p-4 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
									<div className="flex items-center gap-3">
										<div className="p-2 bg-gradient-to-br from-neutral-900/10 to-neutral-900/10 rounded-lg">
											<CreditCard className="w-5 h-5 text-neutral-800 dark:text-neutral-100" />
										</div>
										<div>
											<p className="text-sm text-neutral-600 dark:text-neutral-400">Payment ID</p>
											<p className="font-mono text-sm font-semibold text-neutral-900 dark:text-white">
												{paymentData.paymentId || 'N/A'}
											</p>
										</div>
									</div>
								</div>
								<div className="flex justify-around items-center p-4 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
									<div className="flex items-center gap-3">
										<div className="p-2 bg-gradient-to-br from-neutral-900/10 to-neutral-900/10 rounded-lg">
											<Sparkles className="w-5 h-5 text-neutral-800 dark:text-neutral-100" />
										</div>
										<div>
											<p className="text-sm text-neutral-600 dark:text-neutral-400">Credits Purchased</p>
											<p className="text-xl font-bold text-neutral-800 dark:text-neutral-100">
												{paymentData.credits || 0} Credits
											</p>
										</div>
									</div>
								</div>
								<div className="flex justify-around items-start p-4 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
									<div className="flex items-start gap-3">
										<div className="p-2 bg-gradient-to-br from-neutral-900/10 to-neutral-900/10 rounded-lg">
											<Receipt className="w-5 h-5 text-neutral-800 dark:text-neutral-100" />
										</div>
										<div>
											<p className="text-sm text-neutral-600 dark:text-neutral-400">Amount Paid</p>
											<p className="text-xl font-bold text-neutral-900 dark:text-white">
												{paymentData.currency === 'INR' ? '₹' : '$'}
												{paymentData.amount?.toFixed(paymentData.currency === 'USD' ? 2 : 0) || '0'}
											</p>
										</div>
									</div>
								</div>
								<div className="flex justify-around items-start p-4 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
									<div className="flex items-center gap-3">
										<div className="p-2 bg-gradient-to-br from-neutral-900/10 to-red-500/10 rounded-lg">
											<CreditCard className="w-5 h-5 text-neutral-800 dark:text-neutral-100" />
										</div>
										<div>
											<p className="text-sm text-neutral-600 dark:text-neutral-400">Date & Time</p>
											<p className="text-sm font-semibold text-neutral-900 dark:text-white">
												{new Date().toLocaleString()}
											</p>
										</div>
									</div>
								</div>
							</div>
							<div className="p-4 bg-gradient-to-r from-neutral-50 to-neutral-50 dark:from-neutral-900/20 dark:to-neutral-900/20 rounded-lg border border-neutral-200 dark:border-neutral-800">
								<div className="flex items-center justify-center gap-3">
									<div>
										<div className="flex items-center justify-center gap-3">
											<CheckCircle2 className="w-5 h-5 text-neutral-800 dark:text-neutral-100 mt-0.5 flex-shrink-0" />
											<p className="font-semibold text-sm text-neutral-900 dark:text-neutral-800 mb-1">
												Credits Added Successfully
											</p>
										</div>
										<p className="text-xs text-neutral-700 dark:text-neutral-100">
											Your {paymentData.credits || 0} credits have been added to your account and are ready to use!
										</p>
									</div>
								</div>
							</div>
							<div className="flex flex-col sm:flex-row gap-3 pt-4">
								<Button
									onClick={handleDownloadReceipt}
									variant="outline"
									className="flex-1 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800"
								>
									<Download className="mr-2 h-4 w-4" />
									Download Receipt
								</Button>
								<Button
									asChild
									className="flex-1 bg-black text-white dark:bg-white dark:text-black"
								>
									<Link href="/dashboard">
										Go to Dashboard
										<ArrowRight className="ml-2 h-4 w-4" />
									</Link>
								</Button>
							</div>
							<div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
								<Button
									asChild
									variant="ghost"
									className="w-full"
								>
									<Link href="/purchase">
										<Home className="mr-2 h-4 w-4" />
										Back to Purchase Page
									</Link>
								</Button>
							</div>
						</CardContent>
					</Card>
				</motion.div>
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.5, delay: 0.4 }}
					className="mt-8 text-center"
				>
					<p className="text-sm text-neutral-600 dark:text-neutral-400">
						Need help? <Link href="mailto:support@shipithq.com" className="text-neutral-800 dark:text-neutral-100 hover:underline">Contact Support</Link>
					</p>
				</motion.div>
			</div>
		</div>
	)
}