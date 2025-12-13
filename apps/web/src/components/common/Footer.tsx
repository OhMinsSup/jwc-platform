interface FooterProps {
	/** 저작권 텍스트 */
	copyright?: string;
}

/**
 * 공통 푸터 컴포넌트
 *
 * @example
 * ```tsx
 * <Footer copyright="© 2026 JWC Youth. All rights reserved." />
 * ```
 */
export function Footer({
	copyright = "© 2026 JWC Youth. All rights reserved.",
}: FooterProps) {
	return (
		<footer className="border-t py-12 text-center text-muted-foreground text-sm">
			<div className="container mx-auto px-4">
				<p>{copyright}</p>
			</div>
		</footer>
	);
}
