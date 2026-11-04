import { z } from "zod";

/**
 * 서버 함수 경계에서 쓰는 공통 입력 형식 (모든 기능이 같은 규칙을 쓴다).
 */

/** randomId()가 만드는 id (base64url) */
export const ID = z.string().regex(/^[A-Za-z0-9_-]{10,40}$/u);

/** 폼 공개 주소 */
export const SLUG = z
	.string()
	.regex(/^[a-z0-9][a-z0-9-]{1,60}$/u, "소문자/숫자/하이픈 2~61자");

/** RFC 5321 주소 길이 상한 */
export const MAX_EMAIL_LENGTH = 254;
