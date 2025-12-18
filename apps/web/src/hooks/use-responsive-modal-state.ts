import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";

// =============================================================================
// Types
// =============================================================================

// History state에 저장될 modal 상태 타입
interface ModalHistoryState {
	openModals: string[];
}

interface UseResponsiveModalStateOptions {
	/**
	 * 모달의 고유 ID (history state에서 식별용)
	 */
	id: string;
	/**
	 * 모바일 모드 여부
	 */
	isMobile: boolean;
	/**
	 * 외부에서 상태 변경 시 호출될 콜백
	 */
	onOpenChange?: (isOpen: boolean) => void;
	/**
	 * 모드 전환 시(모바일<->데스크탑) 모달을 자동으로 닫을지 여부 (기본값: true)
	 */
	closeOnModeChange?: boolean;
}

interface UseResponsiveModalStateReturn {
	/**
	 * 모달이 열려있는지 여부
	 */
	isOpen: boolean;
	/**
	 * 모달 열기/닫기 함수 (Sheet/Dialog의 onOpenChange에 직접 전달 가능)
	 */
	setIsOpen: (isOpen: boolean) => void;
	/**
	 * 모달 열기
	 */
	open: () => void;
	/**
	 * 모달 닫기
	 */
	close: () => void;
	/**
	 * 모달 토글
	 */
	toggle: () => void;
	/**
	 * 현재 모바일 모드인지 여부
	 */
	isMobile: boolean;
}

interface UseAutoResponsiveModalStateOptions {
	/**
	 * 모달의 고유 ID (history state에서 식별용)
	 */
	id: string;
	/**
	 * 모바일 브레이크포인트 (기본값: 768)
	 */
	mobileBreakpoint?: number;
	/**
	 * 외부에서 상태 변경 시 호출될 콜백
	 */
	onOpenChange?: (isOpen: boolean) => void;
	/**
	 * 모드 전환 시(모바일<->데스크탑) 모달을 자동으로 닫을지 여부 (기본값: true)
	 */
	closeOnModeChange?: boolean;
}

// =============================================================================
// Modal Store (전역 상태 관리)
// =============================================================================

// SSR용 빈 상태 (안정적인 참조)
const EMPTY_ARRAY: readonly string[] = [];
const EMPTY_SET: ReadonlySet<string> = new Set();

const createModalStore = () => {
	// 데스크탑 모드에서 사용할 로컬 상태
	let desktopState: Set<string> = new Set();
	// 모바일 모드의 스냅샷 캐시 (참조 안정성을 위해)
	let mobileSnapshotCache: string[] = [];
	// 구독자들
	const listeners: Set<() => void> = new Set();

	const notifyListeners = () => {
		for (const listener of listeners) {
			listener();
		}
	};

	const getHistoryState = (): string[] => {
		if (typeof window === "undefined") {
			return [];
		}
		const state = window.history.state as ModalHistoryState | null;
		return state?.openModals ?? [];
	};

	// 배열 동등성 비교
	const arraysEqual = (a: string[], b: string[]): boolean => {
		if (a.length !== b.length) {
			return false;
		}
		return a.every((val, idx) => val === b[idx]);
	};

	return {
		subscribe: (listener: () => void) => {
			listeners.add(listener);
			return () => listeners.delete(listener);
		},

		// 데스크탑 모드: 로컬 상태 사용
		getDesktopSnapshot: () => desktopState,

		// SSR용 안정적인 빈 Set
		getServerSnapshot: () => EMPTY_SET,

		setDesktopState: (id: string, isOpen: boolean) => {
			if (isOpen) {
				desktopState = new Set(desktopState).add(id);
			} else {
				const newSet = new Set(desktopState);
				newSet.delete(id);
				desktopState = newSet;
			}
			notifyListeners();
		},

		// 데스크탑 모달 모두 닫기
		closeAllDesktop: () => {
			desktopState = new Set();
			notifyListeners();
		},

		// 모바일 모드: history.state 사용 (캐시된 스냅샷 반환)
		getMobileSnapshot: () => {
			const currentState = getHistoryState();
			// 캐시와 비교하여 변경된 경우에만 새 참조 반환
			if (!arraysEqual(currentState, mobileSnapshotCache)) {
				mobileSnapshotCache = currentState;
			}
			return mobileSnapshotCache;
		},

		// SSR용 안정적인 빈 배열
		getMobileServerSnapshot: () => EMPTY_ARRAY,

		setMobileState: (id: string, isOpen: boolean) => {
			const currentModals = getHistoryState();
			const modalSet = new Set(currentModals);

			if (isOpen && !modalSet.has(id)) {
				// 새로운 history entry 추가
				const newModals = [...currentModals, id];
				window.history.pushState(
					{ openModals: newModals } as ModalHistoryState,
					""
				);
				notifyListeners();
			} else if (!isOpen && modalSet.has(id)) {
				// 현재 modal만 닫기 위해 뒤로 가기
				window.history.back();
				// popstate 이벤트에서 notifyListeners가 호출됨
			}
		},

		// popstate 이벤트 핸들러
		handlePopState: () => {
			notifyListeners();
		},

		// 모드 전환 시 모든 모달 닫기
		closeAllOnModeChange: (fromMobile: boolean) => {
			if (fromMobile) {
				// 모바일 -> 데스크탑: history state 정리
				const historyModals = getHistoryState();
				if (historyModals.length > 0) {
					// 모든 모달 히스토리 제거 (현재 상태만 정리)
					window.history.replaceState({ openModals: [] }, "");
					mobileSnapshotCache = [];
				}
			} else if (desktopState.size > 0) {
				// 데스크탑 -> 모바일: 로컬 상태 정리
				desktopState = new Set();
			}
			notifyListeners();
		},

		// 특정 ID가 열려있는지 확인
		isOpenDesktop: (id: string) => desktopState.has(id),
		isOpenMobile: (id: string) => getHistoryState().includes(id),

		// 열린 모달 개수
		getOpenCountDesktop: () => desktopState.size,
		getOpenCountMobile: () => getHistoryState().length,
	};
};

// 싱글톤 store
let modalStore: ReturnType<typeof createModalStore> | null = null;

const getModalStore = () => {
	if (!modalStore) {
		modalStore = createModalStore();

		// popstate 이벤트 리스너 등록
		if (typeof window !== "undefined") {
			window.addEventListener("popstate", () => {
				modalStore?.handlePopState();
			});
		}
	}
	return modalStore;
};

// =============================================================================
// Hooks
// =============================================================================

/**
 * 반응형 모달 상태 관리 훅
 *
 * - 데스크탑: useState와 유사하게 로컬 상태로 관리
 * - 모바일: history.state를 사용하여 브라우저 뒤로가기로 모달 닫기 지원
 * - 화면 크기 변경 시 상태 동기화
 *
 * @example
 * ```tsx
 * const { width } = useWindowSize();
 * const isMobile = width < 768;
 *
 * const { isOpen, setIsOpen } = useResponsiveModalState({
 *   id: 'age-selector',
 *   isMobile,
 * });
 *
 * // Sheet 또는 Dialog에서 사용
 * <Sheet open={isOpen} onOpenChange={setIsOpen}>
 *   ...
 * </Sheet>
 * ```
 */
export function useResponsiveModalState({
	id,
	isMobile,
	onOpenChange,
	closeOnModeChange = true,
}: UseResponsiveModalStateOptions): UseResponsiveModalStateReturn {
	const store = getModalStore();
	const prevIsMobileRef = useRef(isMobile);
	const isInitializedRef = useRef(false);

	// 데스크탑 모드용 외부 상태 동기화
	const desktopModals = useSyncExternalStore(
		store.subscribe,
		store.getDesktopSnapshot,
		store.getServerSnapshot
	);

	// 모바일 모드용 외부 상태 동기화
	const mobileModals = useSyncExternalStore(
		store.subscribe,
		store.getMobileSnapshot,
		store.getMobileServerSnapshot
	);

	const isOpen = isMobile ? mobileModals.includes(id) : desktopModals.has(id);

	// 모드 전환 감지 및 모달 닫기
	useEffect(() => {
		if (
			isInitializedRef.current &&
			prevIsMobileRef.current !== isMobile &&
			closeOnModeChange
		) {
			// 모드 전환 시 모든 모달 닫기
			store.closeAllOnModeChange(prevIsMobileRef.current);
			onOpenChange?.(false);
		}
		prevIsMobileRef.current = isMobile;
		isInitializedRef.current = true;
	}, [isMobile, store, closeOnModeChange, onOpenChange]);

	const setIsOpen = useCallback(
		(newIsOpen: boolean) => {
			if (isMobile) {
				store.setMobileState(id, newIsOpen);
			} else {
				store.setDesktopState(id, newIsOpen);
			}
			onOpenChange?.(newIsOpen);
		},
		[id, isMobile, onOpenChange, store]
	);

	const open = useCallback(() => setIsOpen(true), [setIsOpen]);
	const close = useCallback(() => setIsOpen(false), [setIsOpen]);
	const toggle = useCallback(() => setIsOpen(!isOpen), [isOpen, setIsOpen]);

	return {
		isOpen,
		setIsOpen,
		open,
		close,
		toggle,
		isMobile,
	};
}

/**
 * 자동 반응형 모달 상태 관리 훅
 *
 * useWindowSize를 내부적으로 사용하여 isMobile을 자동으로 계산합니다.
 * 별도로 useWindowSize를 사용할 필요가 없습니다.
 *
 * @example
 * ```tsx
 * const { isOpen, setIsOpen, isMobile } = useAutoResponsiveModalState({
 *   id: 'age-selector',
 *   mobileBreakpoint: 768, // 기본값
 * });
 *
 * // isMobile에 따라 Sheet 또는 Dialog 선택적 렌더링
 * if (isMobile) {
 *   return <Sheet open={isOpen} onOpenChange={setIsOpen}>...</Sheet>
 * }
 * return <Dialog open={isOpen} onOpenChange={setIsOpen}>...</Dialog>
 * ```
 */
export function useAutoResponsiveModalState({
	id,
	mobileBreakpoint = 768,
	onOpenChange,
	closeOnModeChange = true,
}: UseAutoResponsiveModalStateOptions): UseResponsiveModalStateReturn {
	// 내부에서 window width 구독
	const noop = () => {
		// intentionally empty
	};

	const width = useSyncExternalStore(
		(callback) => {
			if (typeof window === "undefined") {
				return noop;
			}
			window.addEventListener("resize", callback);
			return () => window.removeEventListener("resize", callback);
		},
		() => (typeof window === "undefined" ? 0 : window.innerWidth),
		() => 0
	);

	const isMobile = width > 0 && width < mobileBreakpoint;

	return useResponsiveModalState({
		id,
		isMobile,
		onOpenChange,
		closeOnModeChange,
	});
}

/**
 * 간단한 사용을 위한 별칭
 */
export const useSheetState = useResponsiveModalState;

/**
 * 자동 반응형 모드를 사용하는 Sheet 상태 관리
 */
export const useAutoSheetState = useAutoResponsiveModalState;

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * 모든 열린 모달을 닫습니다 (데스크탑 모드 전용)
 */
export const closeAllModals = () => {
	const store = getModalStore();
	store.closeAllDesktop();
};
