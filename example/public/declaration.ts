import { ThemeSwitcherApi } from "./theme-switcher-api";

declare global {
	interface Window {
		ThemeSwitcher: ThemeSwitcherApi;
	}
}
