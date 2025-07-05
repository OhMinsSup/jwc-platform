import { CardHeader, CardTitle, Icons, Separator } from "@jwc/ui";
import React from "react";

/**
 * 폼 헤더 컴포넌트
 */
export const FormHeader = React.memo(() => (
	<CardHeader>
		<div className="mb-4 flex items-center space-x-3">
			<div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
				<Icons.FileText className="h-4 w-4 text-blue-600" />
			</div>
			<CardTitle className="text-xl">신청서 작성</CardTitle>
		</div>
		<Separator />
	</CardHeader>
));

FormHeader.displayName = "FormHeader";
