import { useState } from 'react';
import { 
    Tabs, TabsList, TabsTrigger, TabsContent 
} from "@repo/ui/components/ui/tabs";
import { 
    Card, CardContent, CardHeader, CardTitle 
} from "@repo/ui/components/ui/card";
import { Check } from 'lucide-react';
import { 
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@repo/ui/components/ui/select"

const flexiPackPlans = [
    { title: "1 Interview Pack", description: "Ace your next interview.", priceINR: "₹500", priceUSD: "$6" },
    { title: "3 Interview Pack", description: "Prepare for multiple opportunities.", priceINR: "₹1200", priceUSD: "$15" },
    { title: "5 Interview Pack", description: "Boost your interview confidence.", priceINR: "₹2000", priceUSD: "$24" },
    { title: "7 Interview Pack", description: "Maximize your chances of success.", priceINR: "₹2800", priceUSD: "$34" },
    { title: "10 Interview Pack", description: "Become an interview pro.", priceINR: "₹3500", priceUSD: "$42" },
];

const subscriptionPlans = [
    { title: "Monthly Subscription", description: "Continuous interview preparation.", priceINR: "₹1500/month", priceUSD: "$18/month" },
    { title: "Quarterly Subscription", description: "Intensive 3-month preparation.", priceINR: "₹4000/quarter", priceUSD: "$48/quarter" },
    { title: "Yearly Subscription", description: "Year-round interview readiness.", priceINR: "₹12000/year", priceUSD: "$144/year" },
];

const features = [
    "Access to AI-powered mock interviews",
    "Personalized feedback and improvement tips",
    "Industry-specific question banks",
    "Interview performance analytics",
];

interface CurrencySelectorProps {
    currency: string;
    setCurrency: (value: string) => void;
}
function CurrencySelector({ currency, setCurrency } : CurrencySelectorProps) {
    return (
        <div className="flex items-center">
            <span className="mr-2">Show prices in</span>
            <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="INR">INR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
            </Select>
        </div>
    )
}

export default function PricingSection() {
    const [currency, setCurrency] = useState('INR');

    return (
        <section className="w-full bg-[#F0FFF4]">
        <div className="max-w-7xl mx-auto p-6">
            <h1 className="text-4xl font-bold text-center mb-4">Elevate Your Interview Skills with AI</h1>
            <p className="text-center text-gray-600 mb-8">
                Transparent pricing for your interview preparation needs.<br />
                An intelligent platform to keep you ahead in your job search.
            </p>
            <div className="flex justify-end mb-4">
                <CurrencySelector currency={currency} setCurrency={setCurrency} />
            </div>
            <Tabs defaultValue="flexi-pack" className="space-y-8">
                <TabsList className="flex bg-transparent justify-center space-x-4 rounded-full p-2 shadow-md">
                    <TabsTrigger value="flexi-pack" className="px-6 py-3 text-lg font-medium rounded-full data-[state=active]:bg-[#29584a] data-[state=active]:text-white transition-all">Flexi-Pack Plans</TabsTrigger>
                    <TabsTrigger value="subscription" className="px-6 py-3 text-lg font-medium rounded-full data-[state=active]:bg-[#29584a] data-[state=active]:text-white transition-all">Subscription Plans</TabsTrigger>
                </TabsList>
                <TabsContent value="flexi-pack">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {
                            flexiPackPlans.map((plan) => (
                                <Card key={plan.title} className="bg-white rounded-3xl shadow-lg border-0 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                                    <CardHeader className="bg-[#29584a] text-white p-6">
                                        <CardTitle className="text-xl font-bold">{plan.title}</CardTitle>
                                        <p className="text-sm text-center opacity-80">{plan.description}</p>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <p className="text-3xl font-bold mb-6">{currency === 'INR' ? plan.priceINR : plan.priceUSD}</p>
                                        <button className="w-full bg-[#29584a] text-white py-2 rounded-full mb-6 hover:bg-[#1e3d33] transition-colors">Get Started</button>
                                        <ul className="space-y-2">
                                            {
                                                features.map((feature, index) => (
                                                    <li key={index} className="flex items-start">
                                                        <Check className="w-5 h-5 text-neutral-900 dark:text-neutral-100 mr-2 flex-shrink-0 mt-1" />
                                                        <span className="text-sm">{feature}</span>
                                                    </li>
                                                ))
                                            }
                                        </ul>
                                    </CardContent>
                                </Card>
                            ))
                        }
                    </div>
                </TabsContent>
                <TabsContent value="subscription">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {
                            subscriptionPlans.map((plan) => (
                                <Card key={plan.title} className="bg-white rounded-3xl shadow-lg border-0 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                                    <CardHeader className="bg-[#29584a] text-white p-6">
                                        <CardTitle className="text-xl font-bold">{plan.title}</CardTitle>
                                        <p className="text-sm text-center opacity-80">{plan.description}</p>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <p className="text-3xl font-bold mb-6">{currency === 'INR' ? plan.priceINR : plan.priceUSD}</p>
                                        <button className="w-full bg-[#29584a] text-white py-2 rounded-full mb-6 hover:bg-[#1e3d33] transition-colors">Get Started</button>
                                        <ul className="space-y-2">
                                            {
                                                features.map((feature, index) => (
                                                    <li key={index} className="flex items-start">
                                                        <Check className="w-5 h-5 text-neutral-900 dark:text-neutral-100 mr-2 flex-shrink-0 mt-1" />
                                                        <span className="text-sm">{feature}</span>
                                                    </li>
                                                ))
                                            }
                                        </ul>
                                    </CardContent>
                                </Card>
                            ))
                        }
                    </div>
                </TabsContent>
            </Tabs>
        </div>
        </section>
    );
}