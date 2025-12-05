import { api } from "@jwc/backend/convex/_generated/api";
import type { Doc } from "@jwc/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { stableHash } from "stable-hash";
import {
	decryptDraftPersonalInfoServer,
	encryptDraftPersonalInfoServer,
} from "../lib/crypto-server";
import {
	type StepSlug,
	useOnboardingFormStore,
} from "../store/onboarding-form-store";

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

// ============================================================
// Hook
// ============================================================

/**
 * 온보딩 Draft 관리 훅
 */
export function useOnboardingDraft(
	phoneHash: string | null
): UseOnboardingDraftReturn {
	const store = useOnboardingFormStore();

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

			// 폼 데이터 설정
			store.setFormData({
				personalInfo: {
					name: decryptedData?.name,
					phone: decryptedData?.phone,
					gender: draft.gender,
					department: draft.department,
					ageGroup: draft.ageGroup,
				},
				attendanceInfo: {
					stayType: draft.stayType,
					pickupTimeDescription: draft.pickupTimeDescription,
				},
				supportInfo: {
					tfTeam: draft.tfTeam,
					canProvideRide: draft.canProvideRide,
					rideDetails: draft.rideDetails,
				},
				additionalInfo: {
					tshirtSize: draft.tshirtSize,
				},
			});

			return true;
		} catch (err) {
			console.error("[Draft] Failed to hydrate:", err);
			return false;
		}
	}, [draft, store]);

	/**
	 * 현재 폼 데이터를 Draft args로 변환
	 */
	const getFormDataForDraft = useCallback(
		async (currentStep: StepSlug) => {
			const { personalInfo, attendanceInfo, supportInfo, additionalInfo } =
				store;

			// phoneHash가 없으면 저장 불가
			if (!phoneHash) {
				throw new Error("phoneHash is required to save draft");
			}

			// 개인정보 암호화
			let encryptedData:
				| { encryptedName?: string; encryptedPhone?: string }
				| undefined;

			if (personalInfo.name || personalInfo.phone) {
				const result = await encryptDraftPersonalInfoServer({
					data: {
						name: personalInfo.name || undefined,
						phone: personalInfo.phone || undefined,
					},
				});
				if (result.success) {
					encryptedData = result.data;
				}
			}

			return {
				phoneHash,
				currentStep,
				encryptedName: encryptedData?.encryptedName,
				encryptedPhone: encryptedData?.encryptedPhone,
				gender: personalInfo.gender ?? undefined,
				department: personalInfo.department ?? undefined,
				ageGroup: personalInfo.ageGroup || undefined,
				stayType: attendanceInfo.stayType ?? undefined,
				pickupTimeDescription: attendanceInfo.pickupTimeDescription,
				tfTeam: supportInfo.tfTeam,
				canProvideRide: supportInfo.canProvideRide,
				rideDetails: supportInfo.rideDetails,
				tshirtSize: additionalInfo.tshirtSize ?? undefined,
			};
		},
		[phoneHash, store]
	);

	/**
	 * 현재 폼 데이터 해시 생성
	 */
	const getFormDataHash = useCallback(() => {
		const { personalInfo, attendanceInfo, supportInfo, additionalInfo } = store;
		return stableHash({
			personalInfo,
			attendanceInfo,
			supportInfo,
			additionalInfo,
		});
	}, [store]);

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
				const dataHash = getFormDataHash();
				if (dataHash === lastSavedDataRef.current) {
					return;
				}

				setIsSaving(true);
				try {
					const args = await getFormDataForDraft(currentStep);
					await upsertDraft(args);
					lastSavedDataRef.current = dataHash;
				} catch (err) {
					console.error("[Draft] Failed to save:", err);
				} finally {
					setIsSaving(false);
				}
			}, DEBOUNCE_DELAY);
		},
		[phoneHash, getFormDataHash, getFormDataForDraft, upsertDraft]
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

			const dataHash = getFormDataHash();
			if (dataHash === lastSavedDataRef.current) {
				return;
			}

			setIsSaving(true);
			try {
				const args = await getFormDataForDraft(currentStep);
				await upsertDraft(args);
				lastSavedDataRef.current = dataHash;
			} catch (err) {
				const e = err instanceof Error ? err : new Error(String(err));
				console.error("[Draft] Failed to save:", e);
				setError(e);
			} finally {
				setIsSaving(false);
			}
		},
		[phoneHash, getFormDataHash, getFormDataForDraft, upsertDraft]
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
