import { api } from "@jwc/backend/convex/_generated/api";
import type { Doc } from "@jwc/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { stableHash } from "stable-hash";
import {
	decryptDraftPersonalInfoServer,
	encryptDraftPersonalInfoServer,
} from "./crypto-server";
import {
	type OnboardingFormData,
	type StepSlug,
	useOnboardingFormStore,
} from "./onboarding-form-store";

/** 디바운스 시간 (ms) */
const DEBOUNCE_DELAY = 1000;

type DraftDocument = Doc<"onboardingDrafts">;

// ============================================================
// Types
// ============================================================

export interface UseOnboardingDraftReturn {
	/** 서버에서 로드된 draft */
	draft: DraftDocument | null | undefined;
	/** Draft 존재 여부 */
	hasDraft: boolean;
	/** Draft 로딩 완료 여부 */
	isDraftReady: boolean;
	/** 저장 중 여부 */
	isSaving: boolean;
	/** 에러 */
	error: Error | null;
	/** Draft 데이터를 폼에 적용 (복호화 포함) */
	hydrateFormFromDraft: () => Promise<boolean>;
	/** 현재 폼 데이터를 서버에 저장 (디바운스) */
	saveDraft: (currentStep: StepSlug) => void;
	/** 즉시 저장 (스텝 이동 전) */
	saveDraftImmediately: (currentStep: StepSlug) => Promise<void>;
	/** Draft 삭제 (최종 제출 후) */
	deleteDraft: () => Promise<void>;
	/** 에러 초기화 */
	clearError: () => void;
}

/**
 * Draft 데이터를 OnboardingFormData 형식으로 변환 (복호화 필요)
 * - name, phone은 서버에서 복호화해야 함
 */
function mapDraftToFormData(
	draft: DraftDocument,
	decryptedData?: { name?: string; phone?: string }
): Partial<OnboardingFormData> {
	const result: Partial<OnboardingFormData> = {};

	// 복호화된 개인정보
	if (decryptedData?.name) {
		result.name = decryptedData.name;
	}
	if (decryptedData?.phone) {
		result.phone = decryptedData.phone;
	}

	if (draft.gender) {
		result.gender = draft.gender;
	}
	if (draft.department) {
		result.department = draft.department;
	}
	if (draft.ageGroup) {
		result.ageGroup = draft.ageGroup;
	}
	if (draft.stayType) {
		result.stayType = draft.stayType;
	}
	if (draft.attendanceDate) {
		result.attendanceDate = draft.attendanceDate;
	}
	if (draft.pickupTimeDescription) {
		result.pickupTimeDescription = draft.pickupTimeDescription;
	}
	if (draft.tfTeam) {
		result.tfTeam = draft.tfTeam;
	}
	if (draft.canProvideRide !== undefined) {
		result.canProvideRide = draft.canProvideRide;
	}
	if (draft.rideDetails) {
		result.rideDetails = draft.rideDetails;
	}
	if (draft.tshirtSize) {
		result.tshirtSize = draft.tshirtSize;
	}

	return result;
}

/**
 * FormData를 Draft upsert args로 변환 (암호화된 데이터 포함)
 */
function mapFormDataToDraftArgs(
	phoneHash: string,
	currentStep: StepSlug,
	formData: OnboardingFormData,
	encryptedData?: { encryptedName?: string; encryptedPhone?: string }
) {
	return {
		phoneHash,
		currentStep,
		encryptedName: encryptedData?.encryptedName,
		encryptedPhone: encryptedData?.encryptedPhone,
		gender: formData.gender ?? undefined,
		department: formData.department ?? undefined,
		ageGroup: formData.ageGroup || undefined,
		stayType: formData.stayType ?? undefined,
		attendanceDate: formData.attendanceDate,
		pickupTimeDescription: formData.pickupTimeDescription,
		tfTeam: formData.tfTeam,
		canProvideRide: formData.canProvideRide,
		rideDetails: formData.rideDetails,
		tshirtSize: formData.tshirtSize ?? undefined,
	};
}

// ============================================================
// Hook
// ============================================================

/**
 * 온보딩 Draft 관리 훅
 *
 * @description
 * - phoneHash로 서버에서 draft 실시간 구독
 * - 폼 데이터 저장/삭제 기능 제공
 * - Zustand store와 직접 연동
 *
 * @example
 * ```tsx
 * const { draft, hasDraft, isDraftReady, saveDraftImmediately, hydrateFormFromDraft } = useOnboardingDraft(phoneHash);
 *
 * // Draft 로드 후 폼에 적용
 * useEffect(() => {
 *   if (isDraftReady && hasDraft && !hasHydrated) {
 *     hydrateFormFromDraft();
 *     setHasHydrated(true);
 *   }
 * }, [isDraftReady, hasDraft]);
 *
 * // 스텝 이동 시 저장
 * const handleNext = async () => {
 *   await saveDraftImmediately(currentStep);
 *   navigate(nextStep);
 * };
 * ```
 */
export function useOnboardingDraft(
	phoneHash: string | null
): UseOnboardingDraftReturn {
	const { formData, setFormData } = useOnboardingFormStore();

	// State
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	// Refs
	const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const lastSavedDataRef = useRef<string | null>(null);

	// Convex 실시간 구독
	const draft = useQuery(
		api.onboardingDrafts.getByPhoneHash,
		phoneHash ? { phoneHash } : "skip"
	);

	// Mutations
	const upsertDraft = useMutation(api.onboardingDrafts.upsert);
	const removeDraft = useMutation(api.onboardingDrafts.remove);

	// 파생 상태
	const hasDraft = draft !== null && draft !== undefined;
	const isDraftReady = phoneHash !== null && draft !== undefined;

	/**
	 * Draft 데이터를 폼에 적용 (복호화 포함)
	 */
	const hydrateFormFromDraft = useCallback(async () => {
		if (!draft) {
			return false;
		}

		try {
			// 암호화된 개인정보가 있으면 복호화
			let decryptedData: { name?: string; phone?: string } | undefined;

			if (draft.encryptedName || draft.encryptedPhone) {
				const result = await decryptDraftPersonalInfoServer({
					data: {
						encryptedName: draft.encryptedName,
						encryptedPhone: draft.encryptedPhone,
					},
				});
				if (result.success) {
					decryptedData = result.data;
				}
			}

			const draftData = mapDraftToFormData(draft, decryptedData);
			const hasData = Object.keys(draftData).length > 0;

			if (hasData) {
				setFormData(draftData);
			}
			return hasData;
		} catch (err) {
			console.error("[Draft] Failed to hydrate:", err);
			return false;
		}
	}, [draft, setFormData]);

	/**
	 * 현재 폼 데이터를 서버에 저장 (디바운스)
	 */
	const saveDraft = useCallback(
		(currentStep: StepSlug) => {
			if (!phoneHash) {
				return;
			}

			// 기존 타이머 취소
			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current);
			}

			// 디바운스된 저장
			saveTimeoutRef.current = setTimeout(async () => {
				const dataHash = stableHash(formData);
				if (dataHash === lastSavedDataRef.current) {
					return;
				}

				setIsSaving(true);
				try {
					// 개인정보 암호화
					let encryptedData:
						| { encryptedName?: string; encryptedPhone?: string }
						| undefined;

					if (formData.name || formData.phone) {
						const result = await encryptDraftPersonalInfoServer({
							data: {
								name: formData.name || undefined,
								phone: formData.phone || undefined,
							},
						});
						if (result.success) {
							encryptedData = result.data;
						}
					}

					await upsertDraft(
						mapFormDataToDraftArgs(
							phoneHash,
							currentStep,
							formData,
							encryptedData
						)
					);
					lastSavedDataRef.current = dataHash;
				} catch (err) {
					console.error("[Draft] Failed to save:", err);
				} finally {
					setIsSaving(false);
				}
			}, DEBOUNCE_DELAY);
		},
		[phoneHash, formData, upsertDraft]
	);

	/**
	 * 즉시 저장 (스텝 이동 전)
	 */
	const saveDraftImmediately = useCallback(
		async (currentStep: StepSlug) => {
			if (!phoneHash) {
				return;
			}

			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current);
				saveTimeoutRef.current = null;
			}

			const dataHash = stableHash(formData);
			if (dataHash === lastSavedDataRef.current) {
				return;
			}

			setIsSaving(true);
			try {
				// 개인정보 암호화
				let encryptedData:
					| { encryptedName?: string; encryptedPhone?: string }
					| undefined;

				if (formData.name || formData.phone) {
					const result = await encryptDraftPersonalInfoServer({
						data: {
							name: formData.name || undefined,
							phone: formData.phone || undefined,
						},
					});
					if (result.success) {
						encryptedData = result.data;
					}
				}

				await upsertDraft(
					mapFormDataToDraftArgs(
						phoneHash,
						currentStep,
						formData,
						encryptedData
					)
				);
				lastSavedDataRef.current = dataHash;
			} catch (err) {
				const e = err instanceof Error ? err : new Error(String(err));
				console.error("[Draft] Failed to save:", e);
				setError(e);
			} finally {
				setIsSaving(false);
			}
		},
		[phoneHash, formData, upsertDraft]
	);

	/**
	 * Draft 삭제 (최종 제출 후)
	 */
	const deleteDraft = useCallback(async () => {
		if (!phoneHash) {
			return;
		}

		try {
			await removeDraft({ phoneHash });
			lastSavedDataRef.current = null;
		} catch (err) {
			const e = err instanceof Error ? err : new Error(String(err));
			console.error("[Draft] Failed to delete:", e);
			setError(e);
		}
	}, [phoneHash, removeDraft]);

	/**
	 * 에러 초기화
	 */
	const clearError = useCallback(() => {
		setError(null);
	}, []);

	// 클린업
	useEffect(
		() => () => {
			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current);
			}
		},
		[]
	);

	return {
		draft,
		hasDraft,
		isDraftReady,
		isSaving,
		error,
		hydrateFormFromDraft,
		saveDraft,
		saveDraftImmediately,
		deleteDraft,
		clearError,
	};
}
