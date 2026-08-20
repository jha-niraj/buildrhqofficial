import type { Metadata } from 'next'
import { cn } from "@repo/ui/lib/utils";

import Navbar from "@/components/landingpage/homepagenavbar";
import FeaturesSection from "@/components/landingpage/featuressection";
import AIToolsSection from "@/components/landingpage/aitoolssection";
import ProjectsSection from "@/components/landingpage/projects-section";
import AssessmentsSection from "@/components/landingpage/assessments-section";
import CreditsSection from "@/components/landingpage/credits-section";
import Testimonials from "@/components/landingpage/testimonials-section";
import Footer from "@/components/landingpage/footer";
import PricingSection from "@/components/landingpage/pricing-section";
import FaqsAccrodian from "@/components/landingpage/faqs";
import SmoothScroll from "@/components/smoothscroll";
import HeroSection from "@/components/landingpage/herosection";

export const metadata: Metadata = {
  title: 'ShipItHQ - Learn, Build & Get Hired as a Developer',
  description: 'The all-in-one platform for developers to build projects, practice DSA & system design, ace mock interviews, and land their dream tech job.',
  openGraph: {
    title: 'ShipItHQ - Learn, Build & Get Hired as a Developer',
    description: 'Practice interviews, build projects, and track your career progress with AI-powered tools.',
    type: 'website',
  },
}

export default function LandingPage() {
    return (
        <SmoothScroll>
            <Navbar />
            <main className={cn("relative bg-white dark:bg-neutral-900")}>
                <section id="hero">
                    <HeroSection />
                </section>
                <section id="mainfeatures">
                    <FeaturesSection />
                </section>
                <section id="aitools">
                    <AIToolsSection />
                </section>
                <ProjectsSection />
                <section id="assessments">
                    <AssessmentsSection />
                </section>
                <section id="credits">
                    <CreditsSection />
                </section>
                <Testimonials />
                <section id="pricing">
                    <PricingSection />
                </section>
                <section>
                    <FaqsAccrodian />
                </section>
                <Footer />
            </main>
        </SmoothScroll>
    )
}