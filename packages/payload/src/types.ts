import type { drive_v3 } from "googleapis";
import type {
	Form as PayloadForm,
	Sheet as PayloadSheet,
} from "./payload.types";

export type PickDeepNonNullable<T, K extends keyof T> = {
	[P in K]-?: NonNullable<T[P]>;
} & {
	[P in Exclude<keyof T, K>]?: T[P];
};

export type Permission = Pick<
	drive_v3.Schema$Permission,
	"type" | "role" | "emailAddress"
> & {
	permissionId: string;
	[key: string]: unknown;
};

export interface Form extends PayloadForm {
	[key: string]: unknown;
}

export interface Sheet extends PayloadSheet {
	[key: string]: unknown;
}
