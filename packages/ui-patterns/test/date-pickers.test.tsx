import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vite-plus/test";

import { DatePicker } from "../src/components/date-picker";
import { DateTimePicker } from "../src/components/date-time-picker";
import { TimePicker } from "../src/components/time-picker";

/** 선택기 공통 onChange (값 없음 = undefined) */
type OnChange = (value: string | undefined) => void;

/** 달력의 날짜 칸은 "2026년 6월 27일 토요일" 같은 이름을 가진다 */
const day = (label: string) =>
	screen.getByRole("button", { name: new RegExp(`^${label}`, "u") });

/**
 * 선택 목록은 키보드(↓)로 연다. jsdom에서는 Base UI Select를 마우스로 열면
 * 두 번째 테스트부터 열리지 않는다 (실제 브라우저의 마우스 동작은 E2E가 확인한다).
 */
async function openSelect(
	user: ReturnType<typeof userEvent.setup>,
	name: string,
) {
	screen.getByRole("combobox", { name }).focus();
	await user.keyboard("{ArrowDown}");
}

describe(DatePicker, () => {
	it("값이 없으면 안내 문구, 있으면 짧은 날짜 라벨을 보인다", () => {
		const { rerender } = render(
			<DatePicker onChange={vi.fn<OnChange>()} value={undefined} />,
		);
		expect(screen.getByRole("button").textContent).toBe("날짜 선택");
		rerender(<DatePicker onChange={vi.fn<OnChange>()} value="2026-06-25" />);
		expect(screen.getByRole("button").textContent).toBe("2026.06.25 (목)");
	});

	it("공개 화면 크기(lg)는 긴 날짜 라벨을 쓴다", () => {
		render(
			<DatePicker onChange={vi.fn<OnChange>()} size="lg" value="2026-06-25" />,
		);
		expect(screen.getByRole("button").textContent).toBe("2026년 6월 25일 (목)");
	});

	it("날짜를 고르면 YYYY-MM-DD로 알리고 달력을 닫는다", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn<OnChange>();
		render(<DatePicker onChange={onChange} value="2026-06-25" />);
		await user.click(screen.getByRole("button"));
		await user.click(day("2026년 6월 27일"));
		expect(onChange).toHaveBeenCalledWith("2026-06-27");
		expect(screen.queryByRole("grid")).toBeNull();
	});

	it("min/max 밖의 날짜는 고를 수 없다", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn<OnChange>();
		render(
			<DatePicker
				max="2026-06-26"
				min="2026-06-24"
				onChange={onChange}
				value="2026-06-25"
			/>,
		);
		await user.click(screen.getByRole("button"));
		expect(day("2026년 6월 23일").hasAttribute("disabled")).toBe(true);
		expect(day("2026년 6월 27일").hasAttribute("disabled")).toBe(true);
		expect(day("2026년 6월 24일").hasAttribute("disabled")).toBe(false);
		await user.click(day("2026년 6월 23일"));
		expect(onChange).not.toHaveBeenCalled();
	});

	it("지우기 버튼은 clearable이고 값이 있을 때만 보이고 undefined를 알린다", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn<OnChange>();
		render(<DatePicker clearable onChange={onChange} value="2026-06-25" />);
		await user.click(screen.getByRole("button"));
		await user.click(screen.getByRole("button", { name: "날짜 지우기" }));
		expect(onChange).toHaveBeenCalledWith(undefined);
	});
});

describe(TimePicker, () => {
	it("시만 고르면 분은 00으로 채운다", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn<OnChange>();
		render(<TimePicker onChange={onChange} value={undefined} />);
		await openSelect(user, "시");
		await user.click(screen.getByRole("option", { name: "오후 3시" }));
		expect(onChange).toHaveBeenCalledWith("15:00");
	});

	it("분 목록은 간격(stepMinutes)만큼만 보인다", async () => {
		const user = userEvent.setup();
		render(
			<TimePicker
				onChange={vi.fn<OnChange>()}
				stepMinutes={15}
				value="09:00"
			/>,
		);
		await openSelect(user, "분");
		const minutes = screen.getAllByRole("option").map((o) => o.textContent);
		expect(minutes).toStrictEqual(["00분", "15분", "30분", "45분"]);
	});

	it("1시간을 나누지 않는 간격은 시각 목록 하나로 보인다", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn<OnChange>();
		render(
			<TimePicker onChange={onChange} stepMinutes={45} value={undefined} />,
		);
		await openSelect(user, "시각");
		await user.click(screen.getByRole("option", { name: "01:30" }));
		expect(onChange).toHaveBeenCalledWith("01:30");
	});

	it("바깥 라벨(id)이 있으면 시 칸 이름을 덮지 않는다", () => {
		render(
			<>
				<label htmlFor="start">시작 시각</label>
				<TimePicker id="start" onChange={vi.fn<OnChange>()} value={undefined} />
			</>,
		);
		expect(screen.getByRole("combobox", { name: "시작 시각" })).toBeDefined();
	});
});

describe(DateTimePicker, () => {
	it("날짜를 고르기 전에는 시각 칸이 잠겨 있다", () => {
		render(<DateTimePicker onChange={vi.fn<OnChange>()} value={undefined} />);
		for (const box of screen.getAllByRole("combobox")) {
			expect(box.hasAttribute("disabled")).toBe(true);
		}
	});

	it("날짜만 고르면 기본 시각(마감 23:59)을 붙인다", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn<OnChange>();
		render(
			<DateTimePicker
				defaultTime="23:59"
				min="2026-06-24T00:00"
				onChange={onChange}
				stepMinutes={1}
				value={undefined}
			/>,
		);
		await user.click(screen.getByRole("button", { name: /날짜 선택/u }));
		await user.click(day("2026년 6월 30일"));
		expect(onChange).toHaveBeenCalledWith("2026-06-30T23:59");
	});

	it("시각을 바꾸면 날짜는 유지한다", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn<OnChange>();
		render(<DateTimePicker onChange={onChange} value="2026-06-30T09:00" />);
		await openSelect(user, "시");
		await user.click(screen.getByRole("option", { name: "오후 6시" }));
		expect(onChange).toHaveBeenCalledWith("2026-06-30T18:00");
	});
});
