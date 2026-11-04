import { DomainError } from "./domain-error";

export class UnauthorizedError extends DomainError {
	override name = "UnauthorizedError";
	constructor(message = "관리자 로그인이 필요합니다") {
		super(message, { status: 401 });
	}
}
