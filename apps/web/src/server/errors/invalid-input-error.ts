import { DomainError } from "./domain-error";

export class InvalidInputError extends DomainError {
	override name = "InvalidInputError";
	readonly fieldErrors: Record<string, string>;
	constructor(message: string, fieldErrors: Record<string, string> = {}) {
		super(message, { status: 422 });
		this.fieldErrors = fieldErrors;
	}
}
