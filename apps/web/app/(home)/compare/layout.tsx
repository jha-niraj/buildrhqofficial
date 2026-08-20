import Navbar from '@/components/landingpage/homepagenavbar';
import Footer from '@/components/landingpage/footer';
import SmoothScroll from '@/components/smoothscroll';

interface LayoutProps {
    children: React.ReactNode
}

const Layout = ({ children }: LayoutProps) => {
    return (
        <SmoothScroll>
            <div className="flex flex-col bg-white dark:bg-neutral-950">
                <Navbar />
                {children}
                <Footer />
            </div>
        </SmoothScroll>
    );
};

export default Layout;
