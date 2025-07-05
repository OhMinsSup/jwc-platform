import type { ServerProps } from "payload";
import React from "react";

import { ClubFormExcelExportButton } from "../ClubFormExcelExportButton";

type ClubFormBeforeListTableProps = Partial<ServerProps>;

export function ClubFormBeforeListTable(_: ClubFormBeforeListTableProps) {
	return (
		<div className="befortable__container">
			<ClubFormExcelExportButton />
		</div>
	);
}
