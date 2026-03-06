import type { HomeQuickAction } from "./HomePage.models";

export const HOME_QUICK_ACTIONS: HomeQuickAction[] = [
	{
		label: "Study",
		description: "Review cards due today",
		to: "/study",
		testId: "home-quick-action-study",
	},
	{
		label: "Library",
		description: "Manage your words",
		to: "/library",
		testId: "home-quick-action-library",
	},
	{
		label: "Dictionary",
		description: "Look up new words",
		to: "/dictionary",
		testId: "home-quick-action-dictionary",
	},
	{
		label: "Progress",
		description: "Track your learning",
		to: "/progress",
		testId: "home-quick-action-progress",
	},
];
