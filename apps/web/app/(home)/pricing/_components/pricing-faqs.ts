// Re-export only. The list itself moved to `@repo/pricing` because apps/main's
// purchase page renders the same questions - see CR-12 in plan/credits/tasks.md.
//
// This file stays so the page's imports do not move, and because the FAQ JSON-LD
// on the server is built from the same array the client renders. Two copies of a
// pricing answer is worse than most drift: a buyer reads one page and pays on
// the other.
export { pricingFaqs, type PricingFaq } from "@repo/pricing/faqs"
