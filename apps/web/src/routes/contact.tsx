import { Button, cn, Input, Textarea } from "@jwc/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowRight,
	CheckCircle,
	Clock,
	HelpCircle,
	Mail,
	MapPin,
	MessageSquare,
	Phone,
	Send,
} from "lucide-react";
import { useState } from "react";
import { Footer, Navbar, PageLayout } from "@/components/common";

export const Route = createFileRoute("/contact")({
	component: ContactPage,
	head: () => ({
		meta: [
			{
				title: "문의하기 - 2026 동계 청년부 수련회",
			},
			{
				name: "description",
				content:
					"수련회 관련 문의사항이 있으시면 언제든 연락해 주세요. 담당자가 친절히 안내해 드립니다.",
			},
			{
				property: "og:title",
				content: "문의하기 - 2026 동계 청년부 수련회",
			},
		],
	}),
});

/** 연락처 정보 */
const CONTACT_INFO = [
	{
		icon: Phone,
		label: "전화 문의",
		value: "010-1234-5678",
		description: "평일 10:00 - 18:00",
		href: "tel:010-1234-5678",
	},
	{
		icon: Mail,
		label: "이메일 문의",
		value: "retreat@jwc.org",
		description: "24시간 접수 가능",
		href: "mailto:retreat@jwc.org",
	},
	{
		icon: MapPin,
		label: "교회 주소",
		value: "서울특별시 OO구 OO로 123",
		description: "JWC 청년부",
		href: "#",
	},
];

/** 자주 묻는 질문 */
const FAQ_ITEMS = [
	{
		question: "신청 후 취소가 가능한가요?",
		answer:
			"네, 수련회 시작 3일 전까지 취소가 가능합니다. 취소 시점에 따라 환불 규정이 다르게 적용되니, 문의 주시기 바랍니다. 수련회 시작 3일 이내 취소 시에는 환불이 어려울 수 있습니다.",
	},
	{
		question: "참가비는 어떻게 납부하나요?",
		answer:
			"신청서 작성 후 안내되는 계좌로 입금해 주시면 됩니다. 입금 시 반드시 참가자 성함을 기재해 주세요. 입금 확인 후 신청이 완료됩니다.",
	},
	{
		question: "차량 이동이 가능한가요?",
		answer:
			"네, 교회에서 단체 버스를 운행합니다. 신청 시 차량 이용 여부를 선택해 주세요. 개인 차량을 이용하시는 경우, 수련원 주차장 이용이 가능합니다.",
	},
	{
		question: "식사 알레르기가 있는데 어떻게 하나요?",
		answer:
			"신청서 작성 시 식이 제한 사항을 기재해 주시면 됩니다. 가능한 범위 내에서 대체 식사를 준비해 드립니다. 심각한 알레르기가 있으신 경우, 사전에 담당자에게 별도로 연락 부탁드립니다.",
	},
	{
		question: "중도 참가/퇴실이 가능한가요?",
		answer:
			"개인 사정으로 인한 중도 참가나 퇴실은 가능합니다. 다만, 전체 일정에 참석하시는 것을 권장드리며, 중도 참가/퇴실 시에도 참가비는 동일하게 적용됩니다.",
	},
	{
		question: "비회원도 참석할 수 있나요?",
		answer:
			"JWC 청년부에 처음 오시는 분들도 참석 가능합니다. 신청 시 '처음'으로 선택해 주시면 됩니다. 수련회를 통해 새로운 분들과 함께하게 되어 기쁩니다!",
	},
];

function FAQItem({
	question,
	answer,
	isOpen,
	onToggle,
}: {
	question: string;
	answer: string;
	isOpen: boolean;
	onToggle: () => void;
}) {
	return (
		<div className="rounded-xl border bg-card transition-shadow hover:shadow-sm">
			<button
				className="flex w-full items-center justify-between px-6 py-4 text-left"
				onClick={onToggle}
				type="button"
			>
				<span className="pr-4 font-medium">{question}</span>
				<HelpCircle
					className={cn(
						"h-5 w-5 shrink-0 text-muted-foreground transition-transform",
						isOpen && "rotate-180 text-primary"
					)}
				/>
			</button>
			<div
				className={cn(
					"grid transition-all duration-300 ease-in-out",
					isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
				)}
			>
				<div className="overflow-hidden">
					<p className="px-6 pb-4 text-muted-foreground">{answer}</p>
				</div>
			</div>
		</div>
	);
}

function ContactForm() {
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsSubmitting(true);

		// 실제 구현 시 API 호출
		await new Promise((resolve) => setTimeout(resolve, 1000));

		setIsSubmitting(false);
		setIsSubmitted(true);
	};

	if (isSubmitted) {
		return (
			<div className="rounded-2xl border bg-card p-8 text-center md:p-12">
				<div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
					<CheckCircle className="h-8 w-8" />
				</div>
				<h3 className="mb-2 font-bold text-xl">문의가 접수되었습니다</h3>
				<p className="mb-6 text-muted-foreground">
					빠른 시일 내에 답변 드리겠습니다.
					<br />
					감사합니다!
				</p>
				<Button onClick={() => setIsSubmitted(false)} variant="outline">
					새 문의하기
				</Button>
			</div>
		);
	}

	return (
		<form
			className="space-y-6 rounded-2xl border bg-card p-6 md:p-8"
			onSubmit={handleSubmit}
		>
			<div className="grid gap-6 sm:grid-cols-2">
				<div className="space-y-2">
					<label className="font-medium text-sm" htmlFor="name">
						이름 <span className="text-destructive">*</span>
					</label>
					<Input id="name" placeholder="홍길동" required type="text" />
				</div>
				<div className="space-y-2">
					<label className="font-medium text-sm" htmlFor="phone">
						연락처 <span className="text-destructive">*</span>
					</label>
					<Input id="phone" placeholder="010-1234-5678" required type="tel" />
				</div>
			</div>
			<div className="space-y-2">
				<label className="font-medium text-sm" htmlFor="email">
					이메일
				</label>
				<Input id="email" placeholder="example@email.com" type="email" />
			</div>
			<div className="space-y-2">
				<label className="font-medium text-sm" htmlFor="subject">
					문의 유형 <span className="text-destructive">*</span>
				</label>
				<select
					className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
					id="subject"
					required
				>
					<option value="">선택해 주세요</option>
					<option value="registration">신청 관련</option>
					<option value="payment">결제/환불 관련</option>
					<option value="schedule">일정 관련</option>
					<option value="transportation">차량/교통 관련</option>
					<option value="other">기타 문의</option>
				</select>
			</div>
			<div className="space-y-2">
				<label className="font-medium text-sm" htmlFor="message">
					문의 내용 <span className="text-destructive">*</span>
				</label>
				<Textarea
					className="min-h-[150px] resize-none"
					id="message"
					placeholder="문의하실 내용을 자세히 작성해 주세요."
					required
				/>
			</div>
			<Button
				className="w-full rounded-full"
				disabled={isSubmitting}
				size="lg"
				type="submit"
			>
				{isSubmitting ? (
					<>
						<div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
						전송 중...
					</>
				) : (
					<>
						<Send className="mr-2 h-4 w-4" />
						문의 보내기
					</>
				)}
			</Button>
		</form>
	);
}

function ContactPage() {
	const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

	return (
		<PageLayout
			footer={<Footer />}
			header={
				<Navbar
					navSlot={
						<>
							<Link className="transition-colors hover:text-foreground" to="/">
								홈
							</Link>
							<Link
								className="transition-colors hover:text-foreground"
								to="/about"
							>
								수련회 안내
							</Link>
							<Link
								className="font-semibold text-foreground transition-colors"
								to="/contact"
							>
								문의하기
							</Link>
						</>
					}
					rightSlot={
						<Button
							asChild
							className="rounded-full px-6 font-semibold"
							size="sm"
						>
							<Link params={{ step: "welcome" }} to="/onboarding/$step">
								신청하기
							</Link>
						</Button>
					}
				/>
			}
		>
			{/* Hero Section */}
			<section className="border-b bg-gradient-to-b from-primary/5 to-background py-16 md:py-20">
				<div className="container mx-auto px-4">
					<div className="mx-auto max-w-2xl text-center">
						<div className="mb-4 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 font-medium text-primary text-sm">
							<MessageSquare className="mr-2 h-4 w-4" />
							문의하기
						</div>
						<h1 className="mb-4 font-bold text-4xl tracking-tight md:text-5xl">
							무엇이든 물어보세요
						</h1>
						<p className="text-muted-foreground md:text-lg">
							수련회 관련 궁금한 점이 있으시면 언제든 문의해 주세요.
							<br className="hidden sm:block" />
							담당자가 친절하게 안내해 드립니다.
						</p>
					</div>
				</div>
			</section>

			{/* 연락처 정보 */}
			<section className="py-12 md:py-16">
				<div className="container mx-auto px-4">
					<div className="mx-auto max-w-4xl">
						<div className="grid gap-4 sm:grid-cols-3">
							{CONTACT_INFO.map((info, index) => (
								<a
									className="group flex items-start gap-4 rounded-2xl border bg-card p-5 transition-all hover:shadow-lg"
									href={info.href}
									key={`contact:${index.toString()}`}
								>
									<div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
										<info.icon className="h-5 w-5" />
									</div>
									<div className="min-w-0">
										<p className="mb-0.5 font-medium text-muted-foreground text-sm">
											{info.label}
										</p>
										<p className="truncate font-semibold">{info.value}</p>
										<p className="text-muted-foreground text-xs">
											{info.description}
										</p>
									</div>
								</a>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* 문의 폼 & FAQ */}
			<section className="border-t bg-muted/40 py-16 md:py-24">
				<div className="container mx-auto px-4">
					<div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:gap-16">
						{/* 문의 폼 */}
						<div>
							<div className="mb-8">
								<h2 className="mb-2 font-bold text-2xl tracking-tight">
									문의하기
								</h2>
								<p className="text-muted-foreground">
									아래 양식을 작성해 주시면 빠르게 답변 드리겠습니다.
								</p>
							</div>
							<ContactForm />
							<div className="mt-4 flex items-center gap-2 text-muted-foreground text-sm">
								<Clock className="h-4 w-4" />
								<span>평균 응답 시간: 24시간 이내</span>
							</div>
						</div>

						{/* FAQ */}
						<div>
							<div className="mb-8">
								<h2 className="mb-2 font-bold text-2xl tracking-tight">
									자주 묻는 질문
								</h2>
								<p className="text-muted-foreground">
									많이 문의하시는 내용들을 모았습니다.
								</p>
							</div>
							<div className="space-y-3">
								{FAQ_ITEMS.map((item, index) => (
									<FAQItem
										answer={item.answer}
										isOpen={openFaqIndex === index}
										key={`faq:${index.toString()}`}
										onToggle={() =>
											setOpenFaqIndex(openFaqIndex === index ? null : index)
										}
										question={item.question}
									/>
								))}
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* CTA */}
			<section className="py-16 md:py-24">
				<div className="container mx-auto px-4">
					<div className="mx-auto max-w-2xl rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-primary/5 p-8 text-center md:p-12">
						<h2 className="mb-4 font-bold text-2xl md:text-3xl">
							아직 신청하지 않으셨나요?
						</h2>
						<p className="mb-8 text-muted-foreground">
							수련회 신청은 간단한 온라인 양식으로 진행됩니다.
							<br />
							지금 바로 신청하시고 함께해요!
						</p>
						<div className="flex flex-col justify-center gap-3 sm:flex-row">
							<Button asChild className="rounded-full px-8" size="lg">
								<Link params={{ step: "welcome" }} to="/onboarding/$step">
									신청하기
									<ArrowRight className="ml-2 h-4 w-4" />
								</Link>
							</Button>
							<Button
								asChild
								className="rounded-full px-8"
								size="lg"
								variant="outline"
							>
								<Link to="/about">수련회 안내 보기</Link>
							</Button>
						</div>
					</div>
				</div>
			</section>
		</PageLayout>
	);
}
