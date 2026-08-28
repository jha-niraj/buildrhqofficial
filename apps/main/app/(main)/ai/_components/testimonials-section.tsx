import Image from "next/image"
import { Card, CardContent } from "@repo/ui/components/ui/card"
import { motion } from "framer-motion"
import { useState, useCallback } from "react"

interface Testimonial {
    quote: string;
    name: string;
    role: string;
    image: string;
}
const testimonials: Testimonial[] = [
    {
        quote: "This platform has been a game-changer for my studies!",
        name: "Alex Johnson",
        role: "CS Student",
        image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80"
    },
    {
        quote: "The AI tools here are incredibly helpful and easy to use.",
        name: "Sarah Lee",
        role: "Aspiring Developer",
        image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80"
    },
    {
        quote: "I wish I had found this earlier in my academic journey!",
        name: "Mike Brown",
        role: "Recent Graduate",
        image: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80"
    },
    {
        quote: "The AI-powered features have significantly improved my learning experience.",
        name: "Emma Thompson",
        role: "Graduate Student",
        image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80"
    },
    {
        quote: "This platform has revolutionized how I approach my studies.",
        name: "David Chen",
        role: "Undergraduate",
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80"
    },
]

export function TestimonialSection() {
    const [topRowAnimationState, setTopRowAnimationState] = useState("running")
    const [bottomRowAnimationState, setBottomRowAnimationState] = useState("running")

    const handleMouseEnter = useCallback((row: "top" | "bottom") => {
        if (row === "top") {
            setTopRowAnimationState("paused")
        } else {
            setBottomRowAnimationState("paused")
        }
    }, [])

    const handleMouseLeave = useCallback((row: "top" | "bottom") => {
        if (row === "top") {
            setTopRowAnimationState("running")
        } else {
            setBottomRowAnimationState("running")
        }
    }, [])

    return (
        <section className="py-24 bg-gray-50 dark:bg-gray-800 overflow-hidden">
            <div className="w-full px-4">
                <motion.h2
                    className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-800 dark:text-white"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    What Our Users Say
                </motion.h2>
                <motion.p
                    className="text-gray-600 dark:text-gray-300 text-center mb-12 max-w-2xl mx-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    Hear from students and professionals who have transformed their learning experience with our AI-powered tools.
                </motion.p>
                <div className="relative">
                    {/* Top row - left to right */}
                    <div
                        className="flex gap-6 mb-6 overflow-hidden"
                        onMouseEnter={() => handleMouseEnter("top")}
                        onMouseLeave={() => handleMouseLeave("top")}
                        style={{ "--animation-play-state": topRowAnimationState } as React.CSSProperties}
                    >
                        <div className="flex gap-6 animate-scroll-left">
                            {[...testimonials, ...testimonials].map((testimonial, index) => (
                                <TestimonialCard key={index} testimonial={testimonial} />
                            ))}
                        </div>
                    </div>

                    {/* Bottom row - right to left */}
                    <div
                        className="flex gap-6 overflow-hidden"
                        onMouseEnter={() => handleMouseEnter("bottom")}
                        onMouseLeave={() => handleMouseLeave("bottom")}
                        style={{ "--animation-play-state": bottomRowAnimationState } as React.CSSProperties}
                    >
                        <div className="flex gap-6 animate-scroll-right">
                            {[...testimonials.reverse(), ...testimonials].map((testimonial, index) => (
                                <TestimonialCard key={index} testimonial={testimonial} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
    return (
        <Card className="flex-shrink-0 w-80 bg-white dark:bg-gray-700 shadow-lg">
            <CardContent className="p-6">
                <div className="flex flex-col items-start text-left">
                    <div className="flex items-center mb-4 w-full">
                        <Image
                            src={testimonial.image}
                            alt={testimonial.name}
                            width={48}
                            height={48}
                            className="rounded-full mr-4"
                        />
                        <div>
                            <p className="font-medium text-gray-800 dark:text-white">{testimonial.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</p>
                        </div>
                    </div>
                    <blockquote className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                        &quot;{testimonial.quote}&quot;
                    </blockquote>
                </div>
            </CardContent>
        </Card>
    )
}