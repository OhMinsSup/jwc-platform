"use client";
import { Button } from "@payloadcms/ui";
import React, { useActionState } from "react";
import {
	type State,
	syncGoogleSheet,
} from "../../actions/syncGooleSheet.actions";

export function GoogleSheetSyncButton() {
	const [, formAction, isPending] = useActionState(async (state: State) => {
		return await syncGoogleSheet(state);
	}, null);

	return (
		<form action={formAction} aria-disabled={isPending}>
			<Button type="submit" disabled={isPending}>
				{isPending ? "구글 시트 동기화 중..." : "구글 시트 동기화"}
			</Button>
		</form>
	);
}
