import Navbar from "@/components/landingpage/navbar"
import Footer from "@/components/landingpage/footer"

export default function HomeLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-dvh flex flex-col">
            <Navbar />
            <main className="flex-1 pt-24">
                {children}
            </main>
            <Footer />
        </div>
    )
}