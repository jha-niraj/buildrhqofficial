"use client";
import React, { useRef } from "react";
import { 
	useScroll, useTransform, motion, MotionValue 
} from "framer-motion";

export const ContainerScroll = ({
	titleComponent,
	children,
}: {
	titleComponent: string | React.ReactNode;
	children: React.ReactNode;
}) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const { scrollYProgress } = useScroll({
		target: containerRef,
	});
	const [isMobile, setIsMobile] = React.useState(false);

	React.useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth <= 768);
		};
		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => {
			window.removeEventListener("resize", checkMobile);
		};
	}, []);

	const scaleDimensions = () => {
		return isMobile ? [0.7, 0.9] : [1.05, 1];
	};

	const rotate = useTransform(scrollYProgress, [0, 1], [20, 0]);
	const scale = useTransform(scrollYProgress, [0, 1], scaleDimensions());
	const translate = useTransform(scrollYProgress, [0, 1], [0, -100]);

	return (
		<div
			className="h-[50rem] md:h-[60rem] w-full flex items-center justify-center mx-auto relative sm:pt-32"
			ref={containerRef}
		>
			<div
				className="w-full flex flex-col sm:gap-20 relative"
				style={{
					perspective: "700px",
				}}
			>
				<Header translate={translate} titleComponent={titleComponent} />
				<Card rotate={rotate} translate={translate} scale={scale}>
					{children}
				</Card>
			</div>
		</div>
	);
};

export const Header = ({ translate, titleComponent }: {
	translate: MotionValue<number>;
	titleComponent: React.ReactNode;
}) => {
	return (
		<motion.div
			style={{
				translateY: translate,
			}}
			className="div w-full mx-auto text-center"
		>
			{titleComponent}
		</motion.div>
	);
};

export const Card = ({
	rotate,
	scale,
	children,
}: {
	rotate: MotionValue<number>;
	scale: MotionValue<number>;
	translate: MotionValue<number>;
	children: React.ReactNode;
}) => {
	return (
		<motion.div
			style={{
				rotateX: rotate,
				scale,
			}}
			className="max-w-5xl -mt-12 mx-auto h-[30rem] md:h-[40rem] rounded-[30px]"
		>
			{/* Main card content */}
			<div className="h-full w-full bg-[#222222] rounded-[30px] shadow-lg ring-1 ring-white/5">
				{/* Content container */}
				<div className="h-full w-full overflow-hidden rounded-2xl bg-zinc-900 md:rounded-2xl md:p-4">
					{children}
				</div>
			</div>
		</motion.div>
	);
};
