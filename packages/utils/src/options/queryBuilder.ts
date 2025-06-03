import type { Option } from "./types";

/**
 * 옵션 배열을 ORM 스타일로 쿼리할 수 있는 빌더 클래스입니다.
 *
 * value, name 등 주요 필드는 Map 인덱싱을 통해 빠른 조회가 가능하며,
 * where 체이닝, find, all, reset 등 ORM-like 메서드를 제공합니다.
 *
 * @typeParam T - Option 타입 또는 Option을 확장한 타입
 */
export class OptionQueryBuilder<T extends Option = Option> {
	/** 원본 옵션 배열 */
	private _options: T[];
	/** value 필드 기준 인덱스 맵 */
	private _byValue: Map<T["value"], T>;
	/** name 필드 기준 인덱스 맵 */
	private _byName: Map<T["name"], T>;
	/** 현재 쿼리 조건 객체 */
	private _query: Partial<T> = {};

	/**
	 * 옵션 배열로 빌더를 생성합니다.
	 * @param options - Option 객체 배열
	 */
	constructor(options: T[]) {
		this._options = options;
		this._byValue = new Map(options.map((opt) => [opt.value, opt]));
		this._byName = new Map(options.map((opt) => [opt.name, opt]));
	}

	/**
	 * 쿼리 조건을 추가합니다. (체이닝 가능)
	 * @param key - 필드명 (name, value, description 등)
	 * @param value - 값
	 * @returns this (체이닝 지원)
	 */
	where<K extends keyof T>(key: K, value: T[K]): this {
		this._query[key] = value;
		return this;
	}

	/**
	 * 첫 번째 일치하는 옵션을 반환합니다.
	 * value, name 단일 조건은 Map으로 O(1) 조회, 복합 조건은 filter 사용
	 * @returns 첫 번째 일치하는 옵션 객체 또는 undefined
	 */
	find(): T | undefined {
		const keys = Object.keys(this._query) as (keyof T)[];
		if (keys.length === 1) {
			const key = keys[0];
			if (key !== undefined) {
				const value = this._query[key];
				if (key === "value") return this._byValue.get(value as T["value"]);
				if (key === "name") return this._byName.get(value as T["name"]);
			}
		}
		return this._options.find((opt) =>
			Object.entries(this._query).every(([k, v]) => opt[k as keyof T] === v)
		);
	}

	/**
	 * 모든 일치하는 옵션 배열을 반환합니다.
	 * value, name 단일 조건은 Map으로 O(1) 조회, 복합 조건은 filter 사용
	 * @returns 조건에 일치하는 옵션 객체 배열
	 */
	all(): T[] {
		const keys = Object.keys(this._query) as (keyof T)[];
		if (keys.length === 1) {
			const key = keys[0];
			if (key !== undefined) {
				const value = this._query[key];
				if (key === "value") {
					const found = this._byValue.get(value as T["value"]);
					return found ? [found] : [];
				}
				if (key === "name") {
					const found = this._byName.get(value as T["name"]);
					return found ? [found] : [];
				}
			}
		}
		return this._options.filter((opt) =>
			Object.entries(this._query).every(([k, v]) => opt[k as keyof T] === v)
		);
	}

	/**
	 * 쿼리 조건을 초기화합니다.
	 * @returns this (체이닝 지원)
	 */
	reset(): this {
		this._query = {};
		return this;
	}
}
