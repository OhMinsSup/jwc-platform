-- void:allow-destructive
-- 데이터 삭제 없음: sheet_name 단독 유니크 인덱스를 (spreadsheet_id, sheet_name) 유니크 인덱스로 바꾼다 (ADR-0025)
DROP INDEX `forms_sheet_name_unique`;--> statement-breakpoint
ALTER TABLE `forms` ADD `spreadsheet_id` text;--> statement-breakpoint
CREATE UNIQUE INDEX `forms_sheet_location_uq` ON `forms` (`spreadsheet_id`,`sheet_name`);