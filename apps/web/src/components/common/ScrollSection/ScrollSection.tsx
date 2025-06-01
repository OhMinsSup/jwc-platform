"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

interface ScrollSectionProps {
	icon: React.ReactNode;
	title: string;
	description: string;
	imageUrl: string;
	imageAlt: string;
	reversed?: boolean;
}

export default function ScrollSection({
	icon,
	title,
	description,
	imageUrl,
	imageAlt,
	reversed = false,
}: ScrollSectionProps) {
	const ref = useRef<HTMLDivElement>(null);
	const { scrollYProgress } = useScroll({
		target: ref,
		offset: ["start end", "end start"],
	});

	const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
	const x = useTransform(
		scrollYProgress,
		[0, 0.2, 0.8, 1],
		[reversed ? -50 : 50, 0, 0, reversed ? 50 : -50]
	);

	return (
		<div
			ref={ref}
			className={`flex min-h-[60vh] items-center py-20 ${reversed ? "flex-col-reverse md:flex-row-reverse" : "flex-col md:flex-row"}`}
		>
			<motion.div style={{ opacity, x }} className="flex-1 p-6">
				<div className="mb-6">{icon}</div>
				<h2 className="mb-4 font-bold text-3xl">{title}</h2>
				<p className="text-muted-foreground text-xl">{description}</p>
			</motion.div>
			{/* <motion.div style={{ opacity, x: x.get() * -1 }} className="flex-1 p-6">
				<div className="overflow-hidden rounded-xl shadow-2xl">
					<img
						src={imageUrl || "/placeholder.svg"}
						alt={imageAlt}
						className="h-auto w-full"
					/>
				</div>
			</motion.div> */}
		</div>
	);
}
