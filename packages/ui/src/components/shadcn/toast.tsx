"use client";

import { cn } from "@jwc/ui/lib/utils";
import * as ToastPrimitives from "@radix-ui/react-toast";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { X } from "lucide-react";

const ToastProvider = ToastPrimitives.Provider;

function ToastViewport({
	className,
	...props
}: React.ComponentProps<typeof ToastPrimitives.Viewport>) {
	return (
		<ToastPrimitives.Viewport
			className={cn(
				"fixed top-0 z-100 flex max-h-screen w-full flex-col-reverse p-4 sm:top-auto sm:right-0 sm:bottom-0 sm:flex-col md:max-w-[420px]",
				className
			)}
			data-slot="toast-viewport"
			{...props}
		/>
	);
}

const toastVariants = cva(
	"group data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full sm:data-[state=open]:slide-in-from-bottom-full pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-(--radix-toast-swipe-end-x) data-[swipe=move]:translate-x-(--radix-toast-swipe-move-x) data-[state=closed]:animate-out data-[state=open]:animate-in data-[swipe=end]:animate-out data-[swipe=move]:transition-none",
	{
		variants: {
			variant: {
				default: "border bg-background text-foreground",
				destructive:
					"destructive group border-destructive bg-destructive text-destructive-foreground",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	}
);

function Toast({
	className,
	variant,
	...props
}: React.ComponentProps<typeof ToastPrimitives.Root> &
	VariantProps<typeof toastVariants>) {
	return (
		<ToastPrimitives.Root
			className={cn(toastVariants({ variant }), className)}
			data-slot="toast"
			{...props}
		/>
	);
}

function ToastAction({
	className,
	...props
}: React.ComponentProps<typeof ToastPrimitives.Action>) {
	return (
		<ToastPrimitives.Action
			className={cn(
				"inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 font-medium text-sm ring-offset-background transition-colors hover:bg-secondary focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 focus:group-[.destructive]:ring-destructive hover:group-[.destructive]:border-destructive/30 hover:group-[.destructive]:bg-destructive hover:group-[.destructive]:text-destructive-foreground",
				className
			)}
			data-slot="toast-action"
			{...props}
		/>
	);
}

function ToastClose({
	className,
	...props
}: React.ComponentProps<typeof ToastPrimitives.Close>) {
	return (
		<ToastPrimitives.Close
			className={cn(
				"absolute top-2 right-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-hidden focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 focus:group-[.destructive]:ring-red-400 focus:group-[.destructive]:ring-offset-red-600 hover:group-[.destructive]:text-red-50",
				className
			)}
			data-slot="toast-close"
			toast-close=""
			{...props}
		>
			<X className="h-4 w-4" />
		</ToastPrimitives.Close>
	);
}

function ToastTitle({
	className,
	...props
}: React.ComponentProps<typeof ToastPrimitives.Title>) {
	return (
		<ToastPrimitives.Title
			className={cn("font-semibold text-sm", className)}
			data-slot="toast-title"
			{...props}
		/>
	);
}

function ToastDescription({
	className,
	...props
}: React.ComponentProps<typeof ToastPrimitives.Description>) {
	return (
		<ToastPrimitives.Description
			className={cn("text-sm opacity-90", className)}
			data-slot="toast-description"
			{...props}
		/>
	);
}

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;

type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
	type ToastProps,
	type ToastActionElement,
	ToastProvider,
	ToastViewport,
	Toast,
	ToastTitle,
	ToastDescription,
	ToastClose,
	ToastAction,
};
