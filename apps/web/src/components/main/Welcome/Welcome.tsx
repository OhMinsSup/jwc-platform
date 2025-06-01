import { Button, Icons, cn } from "@jwc/ui";
import { motion } from "framer-motion";
import React, { useRef } from "react";
import { ScrollSection } from "~/components/common/ScrollSection";
import Spotlight from "~/components/common/Spotlight/Spotight";
import { useStepNavigation } from "~/libs/hooks/useStepNavigation";

export default function Welcome() {
	const { goToNextStep } = useStepNavigation();

	return (
		<div
			id="hooks-hero"
			className={cn(
				"relative h-[calc(100dvh-64px)] w-full",
				"flex grow flex-col items-center justify-center gap-8",
				"border-b "
			)}
		>
			<hgroup
				className={cn(
					"text-center",
					"z-10",
					"flex flex-col items-center justify-center gap-4",
					"px-4 lg:px-0"
				)}
			>
				<h2 className="scroll-m-20 font-semibold text-3xl tracking-tight first:mt-0">
					청년부 여름 수련회
				</h2>
			</hgroup>
			<div
				className={cn(
					"z-10 flex w-3/4 flex-col justify-center gap-4 lg:flex-row lg:items-center",
					"px-4 lg:px-0"
				)}
			>
				<Button type="button" onClick={goToNextStep}>
					시작하기
					<Icons.ChevronRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
				</Button>
			</div>
		</div>
	);
}

Welcome.Anmation = function WelcomeAnimation() {
	const containerRef = useRef<HTMLDivElement>(null);
	const { goToNextStep } = useStepNavigation();

	return (
		<>
			<div className="relative flex w-full flex-col rounded-md antialiased md:items-center md:justify-center">
				<section className="flex h-svh flex-col items-center justify-center">
					<div
						className={cn(
							"pointer-events-none absolute inset-0 select-none [background-size:40px_40px]"
						)}
					/>

					<Spotlight
						className="-top-40 md:-top-20 left-0 md:left-60"
						fill="white"
					/>
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8 }}
						className="relative z-10 mx-auto w-full max-w-7xl p-4 pt-20 md:pt-0"
					>
						<h1 className="bg-gradient-to-b bg-opacity-50 from-neutral-50 to-neutral-400 bg-clip-text text-center font-bold text-4xl text-transparent md:text-7xl">
							돌돌갓 <br />
							죽전우리교회 여름 수련회
						</h1>
						<div className="mx-auto mt-4 flex max-w-lg items-center justify-center">
							<Button type="button" onClick={goToNextStep}>
								바로 시작하기
								<Icons.ChevronRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
							</Button>
						</div>
					</motion.div>
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 1, duration: 1 }}
					>
						<Icons.ChevronDown className="animate-bounce" size={32} />
					</motion.div>
				</section>
				<section className="py-20" ref={containerRef}>
					<div className="container mx-auto px-4">
						<ScrollSection
							icon={<Icons.Shell className="h-12 w-12" />}
							title="돌돌갓"
							description="돌고 돌아 하나님"
							imageUrl="/placeholder.svg?height=600&width=800"
							imageAlt="Mobile banking app interface"
						/>

						<ScrollSection
							icon={<Icons.PersonStanding className="h-12 w-12" />}
							title="OTL"
							description="Overcome Through the Lord"
							imageUrl="/placeholder.svg?height=600&width=800"
							imageAlt="Fast money transfer illustration"
							reversed
						/>

						<ScrollSection
							icon={<Icons.Calendar className="h-12 w-12" />}
							title="일시"
							description="6월 19일(목) ~ 6월 22일(주일)"
							imageUrl="/placeholder.svg?height=600&width=800"
							imageAlt="Security features illustration"
							reversed
						/>

						<ScrollSection
							icon={<Icons.MapPinHouse className="h-12 w-12" />}
							title="장소"
							description="광림수도원"
							imageUrl="/placeholder.svg?height=600&width=800"
							imageAlt="Financial tools dashboard"
						/>
						<ScrollSection
							icon={<Icons.Book className="h-12 w-12" />}
							title="말씀"
							description="사사기"
							imageUrl="/placeholder.svg?height=600&width=800"
							imageAlt="Financial tools dashboard"
							reversed
						/>
					</div>
				</section>
				{/* Call to Action */}
				<section className=" py-20">
					<div className="container mx-auto px-4 text-center">
						<motion.div
							initial={{ opacity: 0, y: 50 }}
							whileInView={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.8 }}
							viewport={{ once: true }}
							className="mx-auto max-w-2xl"
						>
							<h2 className="mb-6 font-bold text-3xl md:text-5xl">
								수련회에 참여하세요!
							</h2>
							<p className="mb-10 text-muted-foreground text-xl">
								돌돌갓 여름 수련회에 참여하여 하나님과의 깊은 교제를 경험하고,
								믿음의 공동체와 함께 성장하는 시간을 가져보세요.
							</p>
							<Button type="button" onClick={goToNextStep}>
								시작하기
								<Icons.ChevronRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
							</Button>
						</motion.div>
					</div>
				</section>
			</div>
		</>
	);
};
