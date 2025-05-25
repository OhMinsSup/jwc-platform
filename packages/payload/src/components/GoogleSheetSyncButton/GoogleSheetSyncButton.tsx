"use client";
import { Button } from "@payloadcms/ui";
import React, { useActionState } from "react";
import { type State, syncGoogleSheetAction } from "./serverAction";

export function GoogleSheetSyncButton() {
	const [, formAction, isPending] = useActionState(async (state: State) => {
		return await syncGoogleSheetAction(state);
	}, null);

	return (
		<form action={formAction} aria-disabled={isPending}>
			<Button type="submit" disabled={isPending}>
				{isPending ? "구글 시트 동기화 중..." : "구글 시트 동기화"}
			</Button>
		</form>
	);
}
