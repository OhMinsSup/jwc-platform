export const fieldUpdaters: Record<
	string,
	(val: string) => Record<string, unknown> | null
> = {
	납입여부: (val) => ({ isPaid: val === "납입" }),
	성별: (val) => {
		const genderMap: Record<string, string> = {
			남성: "male",
			여성: "female",
		};
		return genderMap[val] ? { gender: genderMap[val] } : null;
	},
	소속: (val) => {
		const deptMap: Record<string, string> = {
			청년1부: "youth1",
			청년2부: "youth2",
			기타: "other",
		};
		return deptMap[val] ? { department: deptMap[val] } : null;
	},
	연령대: (val) => ({ ageGroup: val }),
	숙박형태: (val) => {
		const stayMap: Record<string, string> = {
			"3박4일 (전체 참석)": "3nights4days",
			"2박3일": "2nights3days",
			"1박2일": "1night2days",
			"무박 (당일치기)": "dayTrip",
		};
		return stayMap[val] ? { stayType: stayMap[val] } : null;
	},
	픽업시간: (val) => ({ pickupTimeDescription: val || undefined }),
	TF팀: (val) => {
		const tfMap: Record<string, string> = {
			없음: "none",
			찬양팀: "praise",
			프로그램팀: "program",
			미디어팀: "media",
		};
		return tfMap[val] ? { tfTeam: tfMap[val] } : null;
	},
	차량지원: (val) => ({ canProvideRide: val === "가능" }),
	차량정보: (val) => ({ rideDetails: val || undefined }),
	티셔츠: (val) => {
		const sizeMap: Record<string, string> = {
			S: "s",
			M: "m",
			L: "l",
			XL: "xl",
			"2XL": "2xl",
			"3XL": "3xl",
		};
		return sizeMap[val] ? { tshirtSize: sizeMap[val] } : null;
	},
};
