import { DomainError } from "./domain-error";

export class FormClosedError extends DomainError {
	override name = "FormClosedError";
	constructor() {
		super("접수가 마감된 폼입니다", { code: "form_closed" });
	}
}
