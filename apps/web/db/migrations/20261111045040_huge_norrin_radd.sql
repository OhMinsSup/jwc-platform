-- void:allow-destructive
-- 데이터 삭제 없음: 탭 위치 유니크 인덱스를 기본 스프레드시트(null)·탭 이름 대소문자까지 같게 보는 생성 열 기준으로 바꾼다 (ADR-0025)
DROP INDEX `forms_sheet_location_uq`;--> statement-breakpoint
ALTER TABLE `forms` ADD `spreadsheet_key` text GENERATED ALWAYS AS (coalesce(spreadsheet_id, '')) VIRTUAL;--> statement-breakpoint
ALTER TABLE `forms` ADD `sheet_name_key` text GENERATED ALWAYS AS (lower(sheet_name)) VIRTUAL;--> statement-breakpoint
CREATE UNIQUE INDEX `forms_sheet_location_key_uq` ON `forms` (`spreadsheet_key`,`sheet_name_key`);