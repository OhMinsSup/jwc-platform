import { DomainError } from "./domain-error";

export class InvalidInputError extends DomainError {
	override name = "InvalidInputError";
	readonly fieldErrors: Record<string, string>;
	constructor(message: string, fieldErrors: Record<string, string> = {}) {
		super(message, { code: "invalid_input" });
		this.fieldErrors = fieldErrors;
	}
}
