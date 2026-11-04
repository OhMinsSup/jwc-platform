import { DomainError } from "./domain-error";

export class NotFoundError extends DomainError {
	override name = "NotFoundError";
	constructor(message = "요청한 항목을 찾을 수 없습니다") {
		super(message, { status: 404 });
	}
}
