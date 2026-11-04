import { DomainError } from "./domain-error";

export class ConflictError extends DomainError {
	override name = "ConflictError";
	constructor(message: string, options?: ErrorOptions) {
		super(message, { ...options, status: 409 });
	}
}
