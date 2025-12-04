import { cn } from "@jwc/ui/lib/utils";

function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn(
				"rounded-lg border bg-card text-card-foreground shadow-xs",
				className
			)}
			data-slot="card"
			{...props}
		/>
	);
}

function CardHeader({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn("flex flex-col space-y-1.5 p-6", className)}
			data-slot="card-header"
			{...props}
		/>
	);
}

function CardTitle({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn(
				"font-semibold text-2xl leading-none tracking-tight",
				className
			)}
			data-slot="card-title"
			{...props}
		/>
	);
}

function CardDescription({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn("text-muted-foreground text-sm", className)}
			data-slot="card-description"
			{...props}
		/>
	);
}

function CardContent({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn("p-6 pt-0", className)}
			data-slot="card-content"
			{...props}
		/>
	);
}

function CardFooter({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn("flex items-center p-6 pt-0", className)}
			data-slot="card-footer"
			{...props}
		/>
	);
}

export {
	Card,
	CardHeader,
	CardFooter,
	CardTitle,
	CardDescription,
	CardContent,
};
