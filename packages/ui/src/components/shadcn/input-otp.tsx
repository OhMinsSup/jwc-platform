"use client";

import { cn } from "@jwc/ui/lib/utils";
import { OTPInput, OTPInputContext } from "input-otp";
import * as React from "react";

function InputOTP({
	className,
	containerClassName,
	...props
}: React.ComponentProps<typeof OTPInput>) {
	return (
		<OTPInput
			className={cn("disabled:cursor-not-allowed", className)}
			containerClassName={cn(
				"flex items-center gap-2 has-disabled:opacity-50",
				containerClassName
			)}
			data-slot="input-otp"
			{...props}
		/>
	);
}

function InputOTPGroup({
	className,
	ref,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			className={cn("flex items-center", className)}
			data-slot="input-otp-group"
			ref={ref}
			{...props}
		/>
	);
}

function InputOTPSlot({
	index,
	className,
	ref,
	...props
}: React.ComponentProps<"div"> & { index: number }) {
	const inputOTPContext = React.useContext(OTPInputContext);
	const slot = inputOTPContext.slots[index];
	if (!slot) {
		throw new Error(`Slot at index ${index} is undefined.`);
	}
	const { char, hasFakeCaret, isActive } = slot;

	return (
		<div
			className={cn(
				"relative flex h-10 w-10 items-center justify-center border-input border-y border-r text-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md",
				isActive && "z-10 ring-2 ring-ring ring-offset-background",
				className
			)}
			data-slot="input-otp-slot"
			ref={ref}
			{...props}
		>
			{char}
			{hasFakeCaret && (
				<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
					<div className="h-4 w-px animate-caret-blink bg-foreground duration-1000" />
				</div>
			)}
		</div>
	);
}

function InputOTPSeparator({ ref, ...props }: React.ComponentProps<"hr">) {
	return <hr data-slot="input-otp-separator" ref={ref} {...props} />;
}

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
