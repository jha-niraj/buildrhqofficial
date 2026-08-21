import type { Metadata } from 'next'
import { cn } from "@repo/ui/lib/utils";

import Navbar from "@/components/landingpage/homepagenavbar";
import HeroSection from "@/components/landingpage/herosection";
import ProblemSection from "@/components/landingpage/problem-section";
import CapabilitiesSection from "@/components/landingpage/capabilities-section";
import ProofSection from "@/components/landingpage/proof-section";
import ProjectsSection from "@/components/landingpage/projects-section";
import CompareSection from "@/components/landingpage/compare-section";
import PricingSection from "@/components/landingpage/pricing-section";
import FaqsAccrodian from "@/components/landingpage/faqs";
import Footer from "@/components/landingpage/footer";
import SmoothScroll from "@/components/smoothscroll";
import { LANDING_FAQS } from "@/components/landingpage/faq-data";
import { SITE, BRAND } from "@/lib/site";
import { faqSchema, webPageSchema, jsonLd } from "@/lib/schema";

export const metadata: Metadata = {
    title: 'ShipItHQ - Practice, Build and Get Hired as a Developer',
    description:
        'Practice DSA and system design with code that runs in a real Linux container, build projects you can be interviewed about, rehearse voice mock interviews and fix the resume an ATS is actually reading. 100 free credits, no subscription.',
    openGraph: {
        title: 'ShipItHQ - Practice, Build and Get Hired as a Developer',
        description:
            'Real container execution, projects with interviews written from your own build, voice mocks and ATS resume tooling. 100 free credits, no subscription.',
        type: 'website',
    },
}

/**
 * The landing page, as an ARGUMENT rather than a catalogue.
 *
 * ── What changed, and why the order is the change ──
 *
 * It used to run: hero, Studio, Features, AI Tools, Projects, Assessments, Credits,
 * Testimonials, Pricing, FAQs. Studio sold a module that had been deleted from the app, and
 * four of the remaining sections made the same argument - "here are things the product
 * does" - one after another. Two of them made literally the same claim: "Real Linux
 * Sandbox" in one and "deploying real code in cloud-based sandboxes" in another.
 *
 * A reader got four consecutive feature lists and no narrative, and nothing in the sequence
 * answered the question they actually arrived with, which is not "what does it do" but "why
 * is what I am already doing not working".
 *
 * Every section below now answers the question the previous one raises:
 *
 *   Hero          the promise
 *   Problem       what is broken about how people prepare today
 *   Capabilities  what the product does about it - ONE section, not four
 *   Proof         the container, which is the thing competitors cannot show
 *   Projects      the concrete output you walk away with
 *   Compare       why this and not the free alternative
 *   Pricing       the ask
 *   FAQs          the objections
 *
 * ── The test for this page ──
 *
 * Give a stranger the page and ask what the product does and who it is for. If they cannot
 * answer both, the composition has not worked - and adding a section is not the fix.
 *
 * ── Adding a section here ──
 *
 * A new section has to answer a question one of these raises and that none of them answer.
 * If it answers a question already answered, it belongs inside an existing section. That
 * rule is what stops this returning to a catalogue.
 */
// FAQPage rich-result data, built from the SAME array the accordion renders.
//
// The landing page had none, while /pricing did - so nine well-written answers on the
// highest-authority page on the site were invisible to the one result type that quotes
// answers directly. Google requires the marked-up text to match what a visitor sees, which
// is why this reads LANDING_FAQS rather than restating them.
const landingFaqSchema = faqSchema(LANDING_FAQS)

// The landing page's own WebPage node, wired into the site graph by @id.
//
// It does NOT redeclare WebSite. An earlier version of this file did, with the same @id
// the root layout uses - two competing definitions of one entity. See lib/schema.ts.
const landingPageSchema = webPageSchema({
    url: SITE,
    name: `${BRAND.name} - ${BRAND.tagline}`,
    description:
        "Practice DSA and system design with code that runs in a real Linux container, build projects you can be interviewed about, rehearse voice mock interviews and fix the resume an ATS is actually reading.",
})

export default function LandingPage() {
    return (
        <SmoothScroll>
            <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(landingFaqSchema)} />
            <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(landingPageSchema)} />
            <Navbar />
            <main className={cn("relative bg-white dark:bg-neutral-950")}>
                <section id="hero">
                    <HeroSection />
                </section>

                <ProblemSection />

                <section id="features">
                    <CapabilitiesSection />
                </section>

                <section id="proof">
                    <ProofSection />
                </section>

                <ProjectsSection />

                <section id="compare">
                    <CompareSection />
                </section>

                {/* Testimonials are HIDDEN, not deleted, pending WEB-2: nothing in the repo
                    records whether the people quoted are real or consented, and an unsourced
                    testimonial carries legal weight the other claims do not. Restore this
                    once each quote has a name and a recorded consent - see
                    plan/web/polish/tasks.md. */}

                <section id="pricing">
                    <PricingSection />
                </section>

                <section id="faq">
                    <FaqsAccrodian />
                </section>

                <Footer />
            </main>
        </SmoothScroll>
    )
}
