import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@jwc/ui/components/alert-dialog";

/** 되돌리기 어려운 동작 전 확인. Radix AlertDialog라 포커스 가두기/Esc/복귀가 기본 제공된다 */
interface ConfirmDialogProps {
	confirmLabel: string;
	description: string;
	onCancel: () => void;
	onConfirm: () => void;
	open: boolean;
	title: string;
}

export function ConfirmDialog({
	open,
	title,
	description,
	confirmLabel,
	onConfirm,
	onCancel,
}: ConfirmDialogProps) {
	return (
		<AlertDialog onOpenChange={(next) => !next && onCancel()} open={open}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>취소</AlertDialogCancel>
					<AlertDialogAction onClick={onConfirm}>
						{confirmLabel}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
