export interface Club {
	id: string | number;
	title: string;
	content?: unknown; // Rich text content
	components: Component[];
	clubForms: ClubForm[];
	createdAt?: string;
	updatedAt?: string;
}

export interface Component {
	id: string | number;
	title: string;
	type: "select" | "radio" | "description";
	description?: string;
	data?: {
		data?: ComponentData[];
		required: boolean;
	};
	content?: unknown;
	createdAt?: string;
	updatedAt?: string;
}

export interface ComponentData {
	id: number;
	name: string;
	value?: boolean | string; // radio 타입을 위한 value 필드
}

export interface ClubForm {
	id: string;
	name: string;
	email: string;
	phone: string;
	clubId: string;
	club?: Club;
	experience?: string;
	motivation?: string;
	availableTime?: string;
	skills?: string;
	createdAt?: string;
	updatedAt?: string;
}
