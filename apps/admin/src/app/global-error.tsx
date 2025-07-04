"use client";

import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect } from "react";

type GlobalErrorProperties = {
	readonly error: NextError & { digest?: string };
	readonly reset: () => void;
};

export default function GlobalError({ error }: GlobalErrorProperties) {
	useEffect(() => {
		Sentry.captureException(error);
	}, [error]);

	return (
		<html lang="en">
			<body>
				<NextError statusCode={0} />
			</body>
		</html>
	);
}
