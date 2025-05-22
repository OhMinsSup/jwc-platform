"use client";
import type React from "react";
import type { FieldValues, Path } from "react-hook-form";
import { FormSwitchField } from "~/components/common/FormSwitchField";
import { FormContainer } from "~/components/forms/FormContainer";
import type { FormContainerProps } from "~/components/forms/FormContainer/FormContainer";
import { FormLabel } from "~/components/forms/FormLabel";
import type { FormLabelProps } from "~/components/forms/FormLabel/FormLabel";

interface SwitchFieldFormProps<TFieldValues extends FieldValues>
	extends Omit<FormContainerProps<TFieldValues>, "children">,
		FormLabelProps {
	beforeLabel?: React.ReactNode;
	afterLabel?: React.ReactNode;
	name: Path<TFieldValues>;
	beforeDescription?: React.ReactNode;
	description?: React.ReactNode;
	afterDescription?: React.ReactNode;
}

export default function SwitchFieldForm<TFieldValues extends FieldValues>({
	idx,
	required,
	label,
	name,
	description,
	onSubmitAction,
	isLoading,
	afterLabel,
	beforeLabel,
	beforeDescription,
	afterDescription,
}: SwitchFieldFormProps<TFieldValues>) {
	return (
		<FormContainer<TFieldValues>
			idx={idx}
			onSubmitAction={onSubmitAction}
			isLoading={isLoading}
		>
			<FormSwitchField
				name={name}
				className="space-y-3"
				description={description}
				beforeDescription={beforeDescription}
				afterDescription={afterDescription}
				label={
					<FormLabel
						idx={idx}
						required={required}
						label={label}
						afterLabel={afterLabel}
						beforeLabel={beforeLabel}
					/>
				}
			/>
		</FormContainer>
	);
}
