import type { ButtonProps } from "@jwc/ui/components/shadcn/button";
import { buttonVariants } from "@jwc/ui/components/shadcn/button";
import { cn } from "@jwc/ui/lib/utils";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
	return (
		<nav
			aria-label="pagination"
			className={cn("mx-auto flex w-full justify-center", className)}
			data-slot="pagination"
			{...props}
		/>
	);
}

function PaginationContent({
	className,
	ref,
	...props
}: React.ComponentProps<"ul">) {
	return (
		<ul
			className={cn("flex flex-row items-center gap-1", className)}
			data-slot="pagination-content"
			ref={ref}
			{...props}
		/>
	);
}

function PaginationItem({
	className,
	ref,
	...props
}: React.ComponentProps<"li">) {
	return (
		<li
			className={cn("", className)}
			data-slot="pagination-item"
			ref={ref}
			{...props}
		/>
	);
}

type PaginationLinkProps = {
	isActive?: boolean;
} & Pick<ButtonProps, "size"> &
	React.ComponentProps<"a">;

function PaginationLink({
	className,
	isActive,
	size = "icon",
	...props
}: PaginationLinkProps) {
	return (
		<a
			aria-current={isActive ? "page" : undefined}
			className={cn(
				buttonVariants({
					variant: isActive ? "outline" : "ghost",
					size,
				}),
				className
			)}
			data-slot="pagination-link"
			{...props}
		/>
	);
}

function PaginationPrevious({
	className,
	...props
}: React.ComponentProps<typeof PaginationLink>) {
	return (
		<PaginationLink
			aria-label="Go to previous page"
			className={cn("gap-1 pl-2.5", className)}
			data-slot="pagination-previous"
			size="default"
			{...props}
		>
			<ChevronLeft className="h-4 w-4" />
			<span>Previous</span>
		</PaginationLink>
	);
}

function PaginationNext({
	className,
	...props
}: React.ComponentProps<typeof PaginationLink>) {
	return (
		<PaginationLink
			aria-label="Go to next page"
			className={cn("gap-1 pr-2.5", className)}
			data-slot="pagination-next"
			size="default"
			{...props}
		>
			<span>Next</span>
			<ChevronRight className="h-4 w-4" />
		</PaginationLink>
	);
}

function PaginationEllipsis({
	className,
	...props
}: React.ComponentProps<"span">) {
	return (
		<span
			aria-hidden
			className={cn("flex h-9 w-9 items-center justify-center", className)}
			data-slot="pagination-ellipsis"
			{...props}
		>
			<MoreHorizontal className="h-4 w-4" />
			<span className="sr-only">More pages</span>
		</span>
	);
}

export {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
};
