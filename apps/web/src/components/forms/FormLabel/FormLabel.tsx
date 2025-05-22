import { Icons, FormLabel as ShadcnFormLabel, cn } from "@jwc/ui";
import type React from "react";
import type { LazyComponentProps } from "~/components/common/ConditionLazyRenderer/ConditionLazyRenderer";

export interface FormLabelProps extends Pick<LazyComponentProps, "idx"> {
	required?: boolean;
	label: React.ReactNode;
	beforeLabel?: React.ReactNode;
	afterLabel?: React.ReactNode;
}

export default function FormLabel({
	idx,
	required,
	label,
	afterLabel,
	beforeLabel,
}: FormLabelProps) {
	return (
		<ShadcnFormLabel className="flex flex-row items-center space-x-4">
			{beforeLabel}
			<div className="flex flex-row items-center space-x-2">
				<span>{idx}</span>
				<Icons.ArrowRight className="size-4" />
			</div>
			<span
				data-required={required ?? false}
				className={cn(
					"font-semibold text-lg tracking-tight",
					"data-[required='true']:before:mr-[var(--ant-margin-xxs)] data-[required='true']:before:inline-block data-[required='true']:before:text-red-500 data-[required='true']:before:content-['*']"
				)}
			>
				{label}
			</span>
			{afterLabel}
		</ShadcnFormLabel>
	);
}
