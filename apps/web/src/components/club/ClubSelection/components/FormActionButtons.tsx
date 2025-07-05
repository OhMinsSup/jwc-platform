import { Button, Icons } from "@jwc/ui";
import React from "react";
import type { FormActionButtonsProps } from "../types";

/**
 * 폼 액션 버튼들 컴포넌트
 */
export const FormActionButtons = React.memo<FormActionButtonsProps>(
	({ isSubmitting, onGoBack }) => (
		<div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
			<Button
				type="button"
				variant="outline"
				onClick={onGoBack}
				className="flex items-center gap-2"
			>
				<Icons.ArrowLeft className="size-4" />
				이전으로
			</Button>
			<Button
				type="submit"
				disabled={isSubmitting}
				className="flex items-center gap-2"
			>
				{isSubmitting ? (
					<>
						<Icons.Loader2 className="size-4 animate-spin" />
						제출 중...
					</>
				) : (
					<>
						신청 완료
						<Icons.SendHorizontal className="size-4" />
					</>
				)}
			</Button>
		</div>
	)
);

FormActionButtons.displayName = "FormActionButtons";
