import { render, screen, waitFor } from "@testing-library/react";
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
/**
 * 키보드로 달력을 열고 초점이 날짜 칸에 올 때까지 기다린다.
 * Base UI는 초기 초점을 다음 애니메이션 프레임에 옮기므로 바로 확인하면 아직 트리거에 있을 수 있다.
 */
async function openCalendarWithKeyboard(
	user: ReturnType<typeof userEvent.setup>,
	selectedLabel: string,
) {
	screen.getByRole("button").focus();
	await user.keyboard("{Enter}");
	await waitFor(() => {
		expect(document.activeElement).toBe(day(selectedLabel));
	});
}

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

describe("DatePicker 키보드와 스크린리더", () => {
	it("키보드로 열면 고른 날짜에 초점이 간다 (이전 달 버튼이 아니라)", async () => {
		const user = userEvent.setup();
		render(<DatePicker onChange={vi.fn<OnChange>()} value="2026-06-25" />);
		await openCalendarWithKeyboard(user, "2026년 6월 25일");
		expect(document.activeElement?.getAttribute("aria-label")).toBe(
			"2026년 6월 25일 목요일, 선택됨",
		);
	});

	it("화살표로 날짜를 옮기면 초점이 따라가고 Enter로 고른다", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn<OnChange>();
		render(<DatePicker onChange={onChange} value="2026-06-25" />);
		await openCalendarWithKeyboard(user, "2026년 6월 25일");
		await user.keyboard("{ArrowRight}");
		await waitFor(() => {
			expect(document.activeElement).toBe(day("2026년 6월 26일"));
		});
		await user.keyboard("{Enter}");
		expect(onChange).toHaveBeenCalledWith("2026-06-26");
	});

	it("고른 날짜를 다시 골라도 값이 지워지지 않는다", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn<OnChange>();
		render(<DatePicker onChange={onChange} value="2026-06-25" />);
		await openCalendarWithKeyboard(user, "2026년 6월 25일");
		await user.keyboard("{Enter}");
		expect(onChange).toHaveBeenCalledWith("2026-06-25");
		expect(onChange).not.toHaveBeenCalledWith(undefined);
	});

	it("Esc로 닫으면 초점이 트리거로 돌아온다", async () => {
		const user = userEvent.setup();
		render(<DatePicker onChange={vi.fn<OnChange>()} value="2026-06-25" />);
		const trigger = screen.getByRole("button");
		await openCalendarWithKeyboard(user, "2026년 6월 25일");
		await user.keyboard("{Escape}");
		expect(screen.queryByRole("grid")).toBeNull();
		await waitFor(() => {
			expect(document.activeElement).toBe(trigger);
		});
	});

	it("바깥 라벨이 이름이 되고, 고른 날짜는 설명으로 읽힌다", () => {
		render(
			<>
				<label htmlFor="closes">마감 일시</label>
				<DatePicker
					describedBy="hint"
					id="closes"
					onChange={vi.fn<OnChange>()}
					value="2026-06-25"
				/>
				<p id="hint">비우면 마감 없음</p>
			</>,
		);
		const trigger = screen.getByRole("button", { name: "마감 일시" });
		const description = (trigger.getAttribute("aria-describedby") ?? "")
			.split(" ")
			.map((id) => document.getElementById(id)?.textContent);
		expect(description).toStrictEqual(["2026.06.25 (목)", "비우면 마감 없음"]);
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
