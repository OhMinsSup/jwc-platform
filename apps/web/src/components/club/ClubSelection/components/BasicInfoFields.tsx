import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@jwc/ui";
import React from "react";
import { useFormContext } from "react-hook-form";
import { DEPARTMENT_OPTIONS, FORM_PLACEHOLDERS } from "../constants";
import type { ClubFormData } from "../types";

/**
 * 기본 정보 입력 필드 컴포넌트
 */
export const BasicInfoFields = React.memo(() => {
	const { control } = useFormContext<ClubFormData>();

	return (
		<div className="space-y-6">
			<h3 className="font-semibold text-lg">신청자 정보</h3>
			<div className="grid gap-4 md:grid-cols-2">
				<FormField
					control={control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="font-semibold">
								이름 <span className="text-red-500">*</span>
							</FormLabel>
							<FormControl>
								<Input placeholder={FORM_PLACEHOLDERS.name} {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={control}
					name="phone"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="font-semibold">
								연락처 <span className="text-red-500">*</span>
							</FormLabel>
							<FormControl>
								<Input
									placeholder={FORM_PLACEHOLDERS.phone}
									type="tel"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<FormField
					control={control}
					name="department"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="font-semibold">
								부서 <span className="text-red-500">*</span>
							</FormLabel>
							<Select
								onValueChange={field.onChange}
								value={String(field.value || "")}
							>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder={FORM_PLACEHOLDERS.department} />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{DEPARTMENT_OPTIONS.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={control}
					name="ageGroup"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="font-semibold">
								또래 <span className="text-red-500">*</span>
							</FormLabel>
							<FormControl>
								<Input placeholder={FORM_PLACEHOLDERS.ageGroup} {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>
		</div>
	);
});

BasicInfoFields.displayName = "BasicInfoFields";
