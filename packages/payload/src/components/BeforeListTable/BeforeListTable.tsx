import type { ServerProps } from "payload";
import React from "react";

import { ExcelExportButton } from "../ExcelExportButton";
import { GoogleSheetDownloadButton } from "../GoogleSheetDownloadButton";
import { GoogleSheetSyncButton } from "../GoogleSheetSyncButton";

type BeforeListTableProps = Partial<ServerProps>;

export function BeforeListTable(_: BeforeListTableProps) {
	return (
		<div className="befortable__container">
			<ExcelExportButton />
			<GoogleSheetDownloadButton />
			<GoogleSheetSyncButton />
		</div>
	);
}
