import type { Form } from "@jwc/schema";
import { Button, Icons, ScrollArea } from "@jwc/ui";
import React, { useActionState, useEffect } from "react";
import { useStepAtomValue } from "~/atoms/stepAtom";
import { type State, upsert } from "~/libs/actions/upsert.actions";
import { useStepNavigation } from "~/libs/hooks/useStepNavigation";
import { getDisplayValueByTitle, getIdxToText } from "~/libs/utils/misc";

export default function FormConfirm() {
	const { stepMap } = useStepAtomValue();

	const { goToStep, goToNextStep } = useStepNavigation();

	const list = Array.from(stepMap.entries());

	const [state, formAction, isPending] = useActionState(
		async (state: State, formData: Form) => {
			return await upsert(state, formData);
		},
		null
	);

	const action = async (_: FormData) => {
		const values = Object.values(Object.fromEntries(stepMap)) as Record<
			string,
			string
		>[];
		const formData = values.reduce((acc, curr) => {
			return Object.assign(acc, curr);
		}, {} as Form);
		formAction(formData);
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		if (state?.success && typeof state?.data === "number") {
			goToNextStep();
		}
	}, [state?.success, state?.data]);

	return (
		<form className="space-y-8" action={action}>
			<h2 className="scroll-m-20 font-semibold text-2xl tracking-tight">
				최종 확인
			</h2>
			<p className="text-muted-foreground">
				아래 입력한 정보를 확인해주세요. 수정이 필요한 경우 각 항목의 수정
				버튼을 눌러주세요.
			</p>
			<ScrollArea>
				<div className="relative h-[300px] overflow-x-auto">
					<ol className="text-gray-500 text-sm">
						{list.map(([key, value]) => {
							const data = Object.values(value as Record<string, string>).at(0);
							const title = getIdxToText(key);
							return (
								<li
									key={`row:${key}`}
									className="flex flex-col gap-2 border-muted-foreground border-t p-4 first-of-type:border-t-0 dark:bg-background"
								>
									<div className="scroll-m-20 font-semibold text-xl tracking-tight">
										{key}. {title}
									</div>
									<div className="text-muted-foreground">
										{getDisplayValueByTitle(title, data)}
									</div>
									<div className="mt-2 flex justify-end">
										<Button
											type="button"
											size="sm"
											disabled={isPending}
											onClick={() => goToStep(key)}
										>
											수정
										</Button>
									</div>
								</li>
							);
						})}
					</ol>
				</div>
			</ScrollArea>
			<div className="flex justify-start">
				<Button type="submit" disabled={isPending}>
					{isPending ? (
						<Icons.Loader2 className="h-4 w-4 animate-spin" />
					) : null}
					최종 제출
				</Button>
			</div>
		</form>
	);
}
