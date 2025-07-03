import React from "react";
import { ContentLayout } from "~/components/layouts/ContentLayout";
import { Page as MainPage } from "~/components/retreat/Page";

export default function Page() {
	return (
		<ContentLayout>
			<MainPage />
		</ContentLayout>
	);
}
