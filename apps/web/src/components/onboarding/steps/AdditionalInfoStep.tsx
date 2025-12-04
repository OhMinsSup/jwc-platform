import { zodResolver } from "@hookform/resolvers/zod";
import {
	Button,
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	RadioGroup,
	RadioGroupItem,
} from "@jwc/ui";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Shirt } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
	type TshirtSize,
	useOnboardingFormStore,
} from "@/lib/onboarding-form-store";

const additionalSchema = z.object({
	tshirtSize: z.enum(["s", "m", "l", "xl", "2xl", "3xl"], {
		message: "티셔츠 사이즈를 선택해주세요",
	}),
});

type AdditionalFormData = z.infer<typeof additionalSchema>;

const TSHIRT_SIZE_OPTIONS: {
	value: TshirtSize;
	label: string;
	description: string;
}[] = [
	{ value: "s", label: "S", description: "가슴둘레 90cm" },
	{ value: "m", label: "M", description: "가슴둘레 95cm" },
	{ value: "l", label: "L", description: "가슴둘레 100cm" },
	{ value: "xl", label: "XL", description: "가슴둘레 105cm" },
	{ value: "2xl", label: "2XL", description: "가슴둘레 110cm" },
	{ value: "3xl", label: "3XL", description: "가슴둘레 115cm" },
];

export function AdditionalInfoStep() {
	const navigate = useNavigate();
	const { formData, updateFormData, nextStep } = useOnboardingFormStore();

	const form = useForm<AdditionalFormData>({
		resolver: zodResolver(additionalSchema),
		defaultValues: {
			tshirtSize: formData.tshirtSize ?? undefined,
		},
	});

	const onSubmit = (data: AdditionalFormData) => {
		updateFormData(data);
		nextStep();
		navigate({ to: "/onboarding" });
	};

	return (
		<motion.div
			animate={{ opacity: 1, x: 0 }}
			exit={{ opacity: 0, x: -20 }}
			initial={{ opacity: 0, x: 20 }}
			transition={{ duration: 0.3 }}
		>
			<div className="mb-8">
				<h2 className="mb-2 font-bold text-2xl">추가 정보</h2>
				<p className="text-muted-foreground">
					단체 티셔츠 사이즈를 선택해주세요.
				</p>
			</div>

			<Form {...form}>
				<form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
					{/* 티셔츠 사이즈 */}
					<FormField
						control={form.control}
						name="tshirtSize"
						render={({ field }) => (
							<FormItem>
								<div className="mb-4 flex items-center gap-2">
									<Shirt className="h-5 w-5 text-primary" />
									<FormLabel className="text-base">티셔츠 사이즈 *</FormLabel>
								</div>
								<FormDescription className="mb-4">
									수련회에서 제공되는 단체 티셔츠 사이즈를 선택해주세요.
								</FormDescription>
								<FormControl>
									<RadioGroup
										className="grid grid-cols-2 gap-3 sm:grid-cols-4"
										defaultValue={field.value}
										onValueChange={field.onChange}
									>
										{TSHIRT_SIZE_OPTIONS.map((option) => (
											<div
												className={`flex flex-col items-center justify-center rounded-lg border p-4 transition-colors ${
													field.value === option.value
														? "border-primary bg-primary/5"
														: "hover:bg-muted/50"
												}`}
												key={option.value}
											>
												<RadioGroupItem
													className="sr-only"
													id={option.value}
													value={option.value}
												/>
												<label
													className="flex cursor-pointer flex-col items-center text-center"
													htmlFor={option.value}
												>
													<span className="font-bold text-lg">
														{option.label}
													</span>
													<span className="text-muted-foreground text-xs">
														{option.description}
													</span>
												</label>
											</div>
										))}
									</RadioGroup>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* 사이즈 가이드 */}
					<div className="rounded-lg border bg-muted/30 p-4">
						<h4 className="mb-2 font-medium">사이즈 가이드</h4>
						<p className="text-muted-foreground text-sm">
							티셔츠는 일반적인 오버핏 스타일입니다. 평소 입으시는 사이즈를
							선택하시거나, 조금 여유있게 입고 싶으시면 한 사이즈 큰 것을
							선택해주세요.
						</p>
					</div>

					<div className="flex justify-end pt-4">
						<Button className="gap-2" type="submit">
							다음
							<ArrowRight className="h-4 w-4" />
						</Button>
					</div>
				</form>
			</Form>
		</motion.div>
	);
}
