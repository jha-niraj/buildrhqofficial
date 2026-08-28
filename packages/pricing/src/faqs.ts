/**
 * Pricing FAQs, shared.
 *
 * Lives here rather than in either app because BOTH render it: the marketing
 * pricing page in apps/web, and the in-app purchase page in apps/main. A copy in
 * each is how this repo ended up with three mock-interview implementations and
 * three copies of the pathfinder category union - and a pricing answer that
 * disagrees with itself across two pages is worse than most drift, because a
 * buyer reads one and pays on the other.
 *
 * Plain data, no React and nothing Node-only: apps/web feeds this into
 * `faqSchema()` on the SERVER to emit FAQ rich-result JSON-LD, and apps/main
 * renders it in a client accordion.
 *
 * The `{ q, a }` shape is load-bearing for that JSON-LD. Renaming the fields
 * silently stops the structured data emitting rather than failing a build.
 */
export interface PricingFaq {
	q: string
	a: string
}

export const pricingFaqs: PricingFaq[] = [
	{
		q: "How does ShipItHQ pricing work?",
		a: "ShipItHQ is credit-based, not subscription-based. You buy a pack of credits once and spend them only when you run our AI agents, generate projects, or take assessments. There's no monthly fee and no charge for idle time.",
	},
	{
		q: "Do credits expire?",
		a: "No. Your credits never expire - your balance is yours to use whenever you want, at whatever pace suits you.",
	},
	{
		q: "What can I spend credits on?",
		a: "Credits power everything AI-driven on the platform: project scaffolding and execution plans, AI mock technical interviews, resume and cover-letter generation, the Pathfinder career agent, and skill assessments.",
	},
	{
		q: "Is there a free way to get started?",
		a: "Yes. New accounts start with free credits so you can try the core tools, and you can earn more free credits by sharing ShipItHQ on LinkedIn or X.",
	},
	{
		q: "Which currencies and payment methods are supported?",
		a: "You can pay in INR or USD. Payments are processed securely with AES-256 encryption, and compute is provisioned instantly once your payment completes.",
	},
	{
		q: "Can I get a refund on unused credits?",
		a: "Because credits never expire and are provisioned instantly, purchases are generally non-refundable - but if something went wrong, reach out to support and we'll make it right.",
	},
	{
		q: "Do you offer plans for teams, universities, or high volume?",
		a: "Yes. For classrooms, cohorts, or high-volume compute, we offer custom volume pricing - contact our team and we'll tailor a plan for you.",
	},
	{
		q: "Will my credits work across the whole platform?",
		a: "Yes. A single credit balance works across every AI tool in your ShipItHQ account - build, practice, and interview prep all draw from the same balance.",
	},

	// ── Added 2026-08-28 (CR-12). The eight above answer what credits ARE; a
	// buyer standing on the checkout page also wants to know what happens after
	// they pay, and what happens when the balance runs out.
	{
		q: "What happens when I run out of credits?",
		a: "Nothing breaks and nothing is deleted. Anything you have already generated stays available, and features that cost credits tell you the price and the shortfall before you start, with a link to top up. Free features keep working.",
	},
	{
		q: "What happens if an AI generation fails?",
		a: "It costs you nothing. Credits are held when a job starts and only settled when it finishes; if it fails, or never dispatched, the hold is released and a refund row appears in your credit history explaining why.",
	},
	{
		q: "Where can I see what I have spent?",
		a: "The Credits page shows your balance, every purchase with its status and receipt, and the full history of every credit added or spent, with a description of what each one was for.",
	},
	{
		q: "Can I get an invoice or receipt for my purchase?",
		a: "Yes. Every completed purchase has a receipt on the Credits page with its payment reference, amount, currency and date, which you can use for reimbursement or expenses.",
	},
	{
		q: "Is there a minimum or maximum I can buy?",
		a: "Custom top-ups start at 20 credits and go up to 1,000 in one purchase. The packs cover the common amounts, and there is no limit on how many times you can top up.",
	},
	{
		q: "How much does each feature cost?",
		a: "Every priced action shows its cost before you confirm it, and prices come from one central table rather than being set per feature. Broadly: a cover letter or a tailored resume is a few credits, a full project generation or mock interview is more, and parsing a resume you upload is free.",
	},
	{
		q: "Do credits work if I am signed out?",
		a: "You can see pricing without an account, but credits are tied to your account, so you need to sign in to buy or spend them. Signing in from the pricing page brings you straight back to it.",
	},
]
