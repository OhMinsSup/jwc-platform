import {
	Button,
	Calendar,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Icons,
	Input,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	cn,
} from "@jwc/ui";
import { format, parse, setHours, setMinutes } from "date-fns";
import { ko } from "date-fns/locale";
import type React from "react";
import { useState } from "react";
import { type FieldValues, type Path, useFormContext } from "react-hook-form";

type FormDateFieldProps<TFieldValues extends FieldValues> = {
	label: React.ReactNode;
	inputProps?: Omit<
		React.InputHTMLAttributes<HTMLInputElement>,
		"name" | "ref" | "onChange" | "value" | "onBlur" | "disabled"
	>;
	description?: React.ReactNode;
	className?: string;
	name: Path<TFieldValues>;
	dateFormat?: string;
	/**
	 * 시간 선택 활성화 여부
	 */
	enableTime?: boolean;
	/**
	 * 시간 표시 형식 (기본값: "HH:mm")
	 */
	timeFormat?: string;
};

export default function FormDateField<TFieldValues extends FieldValues>({
	label,
	name,
	description,
	inputProps,
	className,
	dateFormat = "yyyy년 MM월 dd일",
	enableTime = false,
	timeFormat = "HH:mm",
}: FormDateFieldProps<TFieldValues>) {
	const { control } = useFormContext<TFieldValues>();

	const generateHourOptions = () => {
		return Array.from({ length: 24 }, (_, i) => {
			const hour = i.toString().padStart(2, "0");
			return { value: hour, label: hour };
		});
	};

	const generateMinuteOptions = () => {
		return Array.from({ length: 12 }, (_, i) => {
			const minute = (i * 5).toString().padStart(2, "0");
			return { value: minute, label: minute };
		});
	};

	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => {
				const selectedDate = field.value ? new Date(field.value) : undefined;
				const selectedHour = selectedDate ? format(selectedDate, "HH") : "00";
				const selectedMinute = selectedDate ? format(selectedDate, "mm") : "00";

				const updateDateTime = (
					date: Date | undefined,
					hour: string,
					minute: string
				) => {
					if (!date) return undefined;

					const updatedDate = setMinutes(
						setHours(date, Number.parseInt(hour, 10)),
						Number.parseInt(minute, 10)
					);
					return updatedDate;
				};

				return (
					<FormItem className={cn(className)}>
						{typeof label === "string" ? (
							<FormLabel
								data-required={inputProps?.required ?? false}
								className={cn(
									"data-[required='true']:before:mr-[var(--ant-margin-xxs)] data-[required='true']:before:inline-block data-[required='true']:before:text-red-500 data-[required='true']:before:content-['*']"
								)}
							>
								{label}
							</FormLabel>
						) : (
							label
						)}
						<FormControl>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant={"outline"}
										className={cn(
											"w-full justify-start text-left font-normal",
											!field.value && "text-muted-foreground"
										)}
									>
										<Icons.CalendarIcon className="mr-2 h-4 w-4" />
										{field.value ? (
											<>
												{format(new Date(field.value), dateFormat, {
													locale: ko,
												})}
												{enableTime && (
													<>
														{" "}
														<Icons.Clock className="mx-2 inline h-3 w-3" />
														{format(new Date(field.value), timeFormat)}
													</>
												)}
											</>
										) : (
											<span>날짜 선택</span>
										)}
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0">
									<Calendar
										mode="single"
										selected={selectedDate}
										onSelect={(date) => {
											if (date) {
												// 기존 시간 정보 유지
												const hour = selectedDate
													? format(selectedDate, "HH")
													: selectedHour;
												const minute = selectedDate
													? format(selectedDate, "mm")
													: selectedMinute;
												const newDate = updateDateTime(date, hour, minute);
												field.onChange(newDate);
											} else {
												field.onChange(date);
											}
										}}
										initialFocus
										locale={ko}
									/>

									{enableTime && (
										<div className="flex items-center justify-between border-t p-3">
											<span className="font-medium text-sm">
												<Icons.Clock className="mr-1 inline h-4 w-4" /> 시간
												설정
											</span>
											<div className="flex space-x-2">
												<Select
													value={selectedHour}
													onValueChange={(hour) => {
														const newDate = updateDateTime(
															selectedDate || new Date(),
															hour,
															selectedMinute
														);
														field.onChange(newDate);
													}}
												>
													<SelectTrigger className="w-16">
														<SelectValue placeholder="시" />
													</SelectTrigger>
													<SelectContent className="max-h-56 overflow-y-auto">
														{generateHourOptions().map((option) => (
															<SelectItem
																key={option.value}
																value={option.value}
															>
																{option.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>

												<span className="flex items-center">:</span>

												<Select
													value={selectedMinute}
													onValueChange={(minute) => {
														const newDate = updateDateTime(
															selectedDate || new Date(),
															selectedHour,
															minute
														);
														field.onChange(newDate);
													}}
												>
													<SelectTrigger className="w-16">
														<SelectValue placeholder="분" />
													</SelectTrigger>
													<SelectContent className="max-h-56 overflow-y-auto">
														{generateMinuteOptions().map((option) => (
															<SelectItem
																key={option.value}
																value={option.value}
															>
																{option.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
										</div>
									)}
								</PopoverContent>
							</Popover>
						</FormControl>
						{description ? (
							<FormDescription>{description}</FormDescription>
						) : null}
						<FormMessage />
					</FormItem>
				);
			}}
		/>
	);
}
