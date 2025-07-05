export interface ClubSelectionProps {
	id: string | number;
}

export interface ClubFormData {
	clubId: number;
	name: string;
	phone: string;
	department: "청년1부" | "청년2부" | "기타";
	ageGroup: string;
	data: Record<string, unknown>;
}

export interface FormFieldComponentProps {
	component: import("~/types/club").Component;
	fieldName: string;
}

export interface ClubInfoHeaderProps {
	club: { title: string };
	clubDescription: string;
}

export interface FormActionButtonsProps {
	isSubmitting: boolean;
	onGoBack: () => void;
}
