'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@repo/ui/components/ui/button'
import { Badge } from '@repo/ui/components/ui/badge'
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle
} from '@repo/ui/components/ui/card'
import {
    ArrowRight, Brain, Users, Sparkles,
    CheckCircle, TrendingUp, Trophy, Target, Zap, Star, MessageSquare,
    Mic, Award, Timer, Shield
} from 'lucide-react'
import { useUserStore } from '@/app/store/useUserStore'
import { getMockInterviewStats } from '@/actions/(main)/mockvoice/stats.action'

const mockInterviewTypes = [
    {
        id: 'voice',
        title: 'AI Voice Mock',
        description: 'Practice with advanced AI interviewer. Real-time feedback and detailed analysis.',
        icon: <Brain className="w-6 h-6" />,
        href: '/mock/voice',
        features: ['Voice-based', 'Real-time feedback', 'Custom scenarios'],
        badge: '15K+ completed',
        isActive: true,
        isLocked: false,
        notifySection: undefined as string | undefined,
    },
]

const features = [
    {
        icon: <Brain className="w-5 h-5" />,
        title: 'AI-Powered Feedback',
        description: 'Get instant, comprehensive feedback on your performance with detailed analysis.'
    },
    {
        icon: <Target className="w-5 h-5" />,
        title: 'Targeted Practice',
        description: 'Focus on specific skills and interview types that matter for your career goals.'
    },
    {
        icon: <Zap className="w-5 h-5" />,
        title: 'Real-Time Analysis',
        description: 'Receive immediate insights during your interview to improve on the spot.'
    },
    {
        icon: <Trophy className="w-5 h-5" />,
        title: 'Progress Tracking',
        description: 'Monitor your improvement over time with detailed performance metrics.'
    },
    {
        icon: <MessageSquare className="w-5 h-5" />,
        title: 'Multiple Formats',
        description: 'Practice with voice, video, and text-based interviews to cover all scenarios.'
    },
    {
        icon: <Sparkles className="w-5 h-5" />,
        title: 'Custom Scenarios',
        description: 'Create personalized mock interviews tailored to your target role and company.'
    },
]

const benefits = [
    {
        icon: Shield,
        title: 'Interview-Ready Confidence',
        description: 'Build confidence that translates to actual interviews'
    },
    {
        icon: Timer,
        title: 'Practice Anytime',
        description: '24/7 availability means you practice on your schedule'
    },
    {
        icon: Award,
        title: 'Industry-Standard',
        description: 'Questions and formats mirror real interview processes'
    },
    {
        icon: TrendingUp,
        title: 'Track Progress',
        description: 'See measurable improvement in your interview skills'
    }
]

export default function MockInterviewLandingPage() {
    const { user, credits } = useUserStore()
    const [stats, setStats] = useState({
        totalVoiceInterviews: 15420,
        activeUsers: 8734,
        averageRating: '4.8',
        successRate: '85'
    })

    useEffect(() => {
        async function loadStats() {
            const result = await getMockInterviewStats()
            if (result.success) {
                setStats(result.stats)
            }
        }
        loadStats()
    }, [])

    return (
        // <SmoothScroll>
            <main>
                <div className="w-full px-4 pt-6 pb-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="flex flex-col gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6 sm:flex-row sm:items-end sm:justify-between"
                    >
                        <div>
                            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white">
                                Mock Interviews
                            </h1>
                            <p className="mt-1 text-neutral-500 dark:text-neutral-400">
                                Practice with AI interviewers, get real-time feedback, and land your dream job.
                                {user && <span className="ml-2">You have <span className="font-semibold text-neutral-900 dark:text-white">{credits || 0} credits</span> available.</span>}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                size="sm"
                                className="h-9 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 font-medium"
                                asChild
                            >
                                <Link href="/mock/voice">
                                    Start Voice Interview
                                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                                </Link>
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-9 rounded-xl border-neutral-200 dark:border-neutral-800"
                                asChild
                            >
                                <Link href="#interview-types">
                                    Explore Types
                                </Link>
                            </Button>
                        </div>
                    </motion.div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
                        {
                            [
                                { value: `${stats.totalVoiceInterviews.toLocaleString()}+`, label: 'Interviews Conducted', icon: Mic, iconColor: "bg-neutral-50 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-100" },
                                { value: `${stats.activeUsers.toLocaleString()}+`, label: 'Active Users', icon: Users, iconColor: "bg-neutral-50 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-100" },
                                { value: `${stats.averageRating}/5`, label: 'Average Rating', icon: Star, iconColor: "bg-neutral-50 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-100" },
                                { value: `${stats.successRate}%`, label: 'Success Rate', icon: Trophy, iconColor: "bg-neutral-50 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-100" },
                            ].map((stat, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.08 }}
                                    className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`rounded-xl p-2.5 ${stat.iconColor}`}>
                                            <stat.icon className="h-5 w-5" />
                                        </div>
                                        <p className="text-sm text-neutral-500 dark:text-neutral-400">{stat.label}</p>
                                    </div>
                                    <p className="mt-3 text-3xl font-semibold text-neutral-900 dark:text-white tracking-tight">
                                        {stat.value}
                                    </p>
                                </motion.div>
                            ))
                        }
                    </div>
                </div>
                <section id="interview-types" className="py-20">
                    <div className="w-full px-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center mb-16"
                        >
                            <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white mb-4">
                                Choose Your Interview Format
                            </h2>
                            <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                                Select the perfect practice method for your needs
                            </p>
                        </motion.div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {
                                mockInterviewTypes.map((type, index) => (
                                    <motion.div
                                        key={type.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        viewport={{ once: true }}
                                    >
                                        <Link href={type.href}>
                                            <Card className="h-full bg-white dark:bg-neutral-900 shadow-lg border border-neutral-200 dark:border-neutral-800 p-4 transition-all duration-300 group hover:shadow-2xl cursor-pointer">
                                                <CardHeader className="space-y-4">
                                                    <div className="flex items-start justify-between">
                                                        <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/30 text-neutral-700 dark:text-neutral-100">
                                                            {type.icon}
                                                        </div>
                                                        <Badge className="bg-neutral-100 dark:bg-neutral-800/30 text-neutral-700 dark:text-neutral-100 border-0">
                                                            <CheckCircle className="w-3 h-3 mr-1" />
                                                            Active
                                                        </Badge>
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-xl mb-2 group-hover:underline underline-offset-4">
                                                            {type.title}
                                                        </CardTitle>
                                                        <CardDescription className="text-sm">
                                                            {type.description}
                                                        </CardDescription>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    <div className="space-y-2">
                                                        {
                                                            type.features.map((feature, idx) => (
                                                                <div key={idx} className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                                                                    <CheckCircle className="w-4 h-4 flex-shrink-0 text-neutral-900 dark:text-neutral-100" />
                                                                    <span>{feature}</span>
                                                                </div>
                                                            ))
                                                        }
                                                    </div>
                                                    <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-800">
                                                        <span className="text-sm text-neutral-600 dark:text-neutral-400">{type.badge}</span>
                                                        <ArrowRight className="w-5 h-5 text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white group-hover:translate-x-1 transition-all" />
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    </motion.div>
                                ))
                            }
                        </div>
                    </div>
                </section>
                <section className="py-20 bg-neutral-50 dark:bg-neutral-900/50 border-y border-neutral-200 dark:border-neutral-800">
                    <div className="w-full px-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center mb-16"
                        >
                            <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white mb-4">
                                Why Choose Our Platform?
                            </h2>
                            <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                                Everything you need to ace your next interview
                            </p>
                        </motion.div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {
                                features.map((feature, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        viewport={{ once: true }}
                                    >
                                        <div className="bg-white dark:bg-neutral-900 shadow-lg rounded-xl p-6 border border-neutral-200 dark:border-neutral-800 h-full">
                                            <div className="flex items-start gap-4">
                                                <div className="p-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-neutral-700 dark:text-neutral-300 flex-shrink-0">
                                                    {feature.icon}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">
                                                        {feature.title}
                                                    </h3>
                                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                                        {feature.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            }
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
                            {
                                benefits.map((benefit, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.1 }}
                                        viewport={{ once: true }}
                                        className="text-center"
                                    >
                                        <div className="inline-flex items-center justify-center w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-lg mb-3">
                                            <benefit.icon className="w-6 h-6 text-neutral-700 dark:text-neutral-300" />
                                        </div>
                                        <h4 className="font-semibold text-neutral-900 dark:text-white mb-1 text-sm">
                                            {benefit.title}
                                        </h4>
                                        <p className="text-xs text-neutral-600 dark:text-neutral-400">
                                            {benefit.description}
                                        </p>
                                    </motion.div>
                                ))
                            }
                        </div>
                    </div>
                </section>
                <section className="py-20">
                    <div className="max-w-4xl mx-auto px-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="bg-white dark:bg-neutral-900 shadow-2xl rounded-2xl p-12 border border-neutral-200 dark:border-neutral-800 text-center"
                        >
                            <Star className="w-16 h-16 mx-auto mb-6 text-neutral-700 dark:text-neutral-300" />
                            <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white mb-6">
                                Ready to Ace Your Interview?
                            </h2>
                            <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-8 max-w-2xl mx-auto">
                                Join thousands of developers who&apos;ve successfully landed their dream jobs with our AI-powered mock interviews.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Button
                                    size="lg"
                                    className="bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200"
                                    asChild
                                >
                                    <Link href="/mock/voice">
                                        Start Practicing Now
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Link>
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="border-neutral-300 dark:border-neutral-700"
                                    asChild
                                >
                                    <Link href="/purchase">
                                        View Pricing
                                    </Link>
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                </section>
            </main>
    )
}