export interface Club {
	id: string;
	title: string;
	content?: string;
	components: Component[];
	clubForms: ClubForm[];
	createdAt?: string;
	updatedAt?: string;
}

export interface Component {
	id: string;
	name: string;
	type: string;
	props?: Record<string, unknown>;
	createdAt?: string;
	updatedAt?: string;
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
