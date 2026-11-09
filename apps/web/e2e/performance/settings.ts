export const PERFORMANCE_ORIGIN = "http://localhost:5181";
export const PERFORMANCE_PERSISTENCE = ".void/performance";
export const PERFORMANCE_SECRET = "performance-only-dummy-secret-0123456789";
export const PERFORMANCE_ACCOUNTS = {
	ready: {
		email: "performance-ready@example.com",
		phone: "01012340001",
		token: "performance-ready-session",
	},
	setup: {
		email: "performance-setup@example.com",
		phone: "01012340002",
		token: "performance-setup-session",
	},
} as const;

export const GOOD_BUDGETS = { LCP: 2500, INP: 200, CLS: 0.1 } as const;
