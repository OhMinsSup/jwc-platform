"use client";

import { captureException } from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect } from "react";

type GlobalErrorProperties = {
	readonly error: NextError & { digest?: string };
	readonly reset: () => void;
};

export default function GlobalError({ error }: GlobalErrorProperties) {
	useEffect(() => {
		captureException(error);
	}, [error]);

	return (
		<html lang="en">
			<body>
				<NextError statusCode={0} />
			</body>
		</html>
	);
}
