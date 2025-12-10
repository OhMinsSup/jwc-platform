/**
 * @fileoverview 스키마 빌더 및 레지스트리
 *
 * 스프레드시트 스키마를 선언적으로 정의하고 관리하는 기능을 제공합니다.
 * 이를 통해 새로운 폼 타입을 쉽게 추가할 수 있습니다.
 */

import type {
	ColumnType,
	IColumnDefinition,
	ISchemaRegistry,
	ISpreadsheetSchema,
} from "./interfaces";

/**
 * SchemaBuilder와 ColumnBuilder를 결합한 Proxy 생성
 */
function createSchemaProxy<T>(
	schemaBuilder: SchemaBuilder<T>,
	columnBuilder: ColumnBuilder<T>
): ColumnBuilder<T> & SchemaBuilder<T> {
	return new Proxy(
		schemaBuilder as unknown as ColumnBuilder<T> & SchemaBuilder<T>,
		{
			get: (target, prop) => {
				// ColumnBuilder 메서드 우선
				if (prop in columnBuilder) {
					const value = (columnBuilder as unknown as Record<string, unknown>)[
						prop as string
					];
					if (typeof value === "function") {
						return (...args: unknown[]) => {
							const result = (value as (...a: unknown[]) => unknown).apply(
								columnBuilder,
								args
							);
							if (result === columnBuilder) {
								return target;
							}
							return result;
						};
					}
					return value;
				}
				// SchemaBuilder 메서드
				if (prop in schemaBuilder) {
					const value = (schemaBuilder as unknown as Record<string, unknown>)[
						prop as string
					];
					if (typeof value === "function") {
						return (value as (...a: unknown[]) => unknown).bind(schemaBuilder);
					}
					return value;
				}
				return;
			},
		}
	);
}

// ============================================================================
// 스키마 빌더
// ============================================================================

/**
 * 컬럼 빌더 클래스
 * 체이닝 방식으로 컬럼 정의를 생성합니다.
 */
export class ColumnBuilder<T = Record<string, unknown>> {
	private readonly definition: Partial<IColumnDefinition<T>> = {};

	constructor(key: keyof T | string, header: string) {
		this.definition.key = key;
		this.definition.header = header;
	}

	/**
	 * 컬럼 너비 설정
	 */
	width(value: number): this {
		this.definition.width = value;
		return this;
	}

	/**
	 * 컬럼 타입 설정
	 */
	type(value: ColumnType): this {
		this.definition.type = value;
		return this;
	}

	/**
	 * 드롭다운 옵션 설정
	 */
	options(values: string[]): this {
		this.definition.type = "dropdown";
		this.definition.options = values;
		return this;
	}

	/**
	 * 값 포맷터 설정
	 */
	formatter(fn: (value: unknown, row: T) => string): this {
		this.definition.formatter = fn;
		return this;
	}

	/**
	 * 정렬 설정
	 */
	align(value: "left" | "center" | "right"): this {
		this.definition.align = value;
		return this;
	}

	/**
	 * 컬럼 정의 빌드
	 */
	build(): IColumnDefinition<T> {
		if (!(this.definition.key && this.definition.header)) {
			throw new Error("Column key and header are required");
		}

		return {
			key: this.definition.key,
			header: this.definition.header,
			width: this.definition.width ?? 15,
			type: this.definition.type ?? "text",
			options: this.definition.options,
			formatter: this.definition.formatter,
			align: this.definition.align ?? "left",
		} as IColumnDefinition<T>;
	}
}

/**
 * 스키마 빌더 클래스
 * 체이닝 방식으로 스프레드시트 스키마를 정의합니다.
 *
 * @example
 * ```typescript
 * const schema = SchemaBuilder.create<UserData>('users')
 *   .column('id', 'ID').width(10).type('number')
 *   .column('name', '이름').width(20)
 *   .column('email', '이메일').width(30)
 *   .column('status', '상태').options(['활성', '비활성'])
 *   .defaultSheetName('사용자 목록')
 *   .build();
 * ```
 */
export class SchemaBuilder<T = Record<string, unknown>> {
	private readonly schemaName: string;
	private readonly columns: IColumnDefinition<T>[] = [];
	private sheetName?: string;
	private currentColumn?: ColumnBuilder<T>;

	private constructor(name: string) {
		this.schemaName = name;
	}

	/**
	 * 스키마 빌더 생성
	 * @param name - 스키마 이름
	 */
	static create<U = Record<string, unknown>>(name: string): SchemaBuilder<U> {
		return new SchemaBuilder<U>(name);
	}

	/**
	 * 컬럼 추가
	 * @param key - 데이터 키
	 * @param header - 헤더명
	 */
	column(
		key: keyof T | string,
		header: string
	): ColumnBuilder<T> & SchemaBuilder<T> {
		// 이전 컬럼이 있으면 빌드하여 추가
		if (this.currentColumn) {
			this.columns.push(this.currentColumn.build());
		}

		const columnBuilder = new ColumnBuilder<T>(key, header);
		this.currentColumn = columnBuilder;

		return createSchemaProxy(this, columnBuilder);
	}

	/**
	 * 기본 시트명 설정
	 */
	defaultSheetName(name: string): this {
		// 마지막 컬럼 빌드
		if (this.currentColumn) {
			this.columns.push(this.currentColumn.build());
			this.currentColumn = undefined;
		}
		this.sheetName = name;
		return this;
	}

	/**
	 * 스키마 빌드
	 */
	build(): ISpreadsheetSchema<T> {
		// 마지막 컬럼 빌드
		if (this.currentColumn) {
			this.columns.push(this.currentColumn.build());
			this.currentColumn = undefined;
		}

		if (this.columns.length === 0) {
			throw new Error("Schema must have at least one column");
		}

		return {
			name: this.schemaName,
			columns: this.columns,
			defaultSheetName: this.sheetName,
		};
	}
}

/**
 * 스키마 레지스트리 구현
 * 싱글톤 패턴으로 구현되어 전역적으로 스키마를 관리합니다.
 */
class SchemaRegistryImpl implements ISchemaRegistry {
	private readonly schemas = new Map<string, ISpreadsheetSchema<unknown>>();

	register<T>(name: string, schema: ISpreadsheetSchema<T>): void {
		if (this.schemas.has(name)) {
			console.warn(`Schema '${name}' is being overwritten`);
		}
		this.schemas.set(name, schema as ISpreadsheetSchema<unknown>);
	}

	get<T>(name: string): ISpreadsheetSchema<T> | undefined {
		return this.schemas.get(name) as ISpreadsheetSchema<T> | undefined;
	}

	list(): string[] {
		return Array.from(this.schemas.keys());
	}

	has(name: string): boolean {
		return this.schemas.has(name);
	}

	/**
	 * 레지스트리 초기화 (테스트용)
	 */
	clear(): void {
		this.schemas.clear();
	}
}

/**
 * 전역 스키마 레지스트리 인스턴스
 */
export const schemaRegistry = new SchemaRegistryImpl();

/**
 * 스키마를 등록하는 데코레이터 팩토리
 * @param name - 스키마 이름
 */
export function registerSchema(name: string) {
	return <T>(schema: ISpreadsheetSchema<T>): ISpreadsheetSchema<T> => {
		schemaRegistry.register(name, schema);
		return schema;
	};
}

/**
 * 스키마 정의 헬퍼 함수
 * 타입 안전하게 스키마를 정의할 수 있습니다.
 */
export function defineSchema<T = Record<string, unknown>>(config: {
	name: string;
	columns: IColumnDefinition<T>[];
	defaultSheetName?: string;
}): ISpreadsheetSchema<T> {
	return {
		name: config.name,
		columns: config.columns,
		defaultSheetName: config.defaultSheetName,
	};
}

/**
 * 컬럼 정의 헬퍼 함수
 */
export function column<T = Record<string, unknown>>(
	key: keyof T | string,
	header: string,
	options?: Partial<Omit<IColumnDefinition<T>, "key" | "header">>
): IColumnDefinition<T> {
	return {
		key,
		header,
		width: options?.width ?? 15,
		type: options?.type ?? "text",
		options: options?.options,
		formatter: options?.formatter,
		align: options?.align ?? "left",
	} as IColumnDefinition<T>;
}
