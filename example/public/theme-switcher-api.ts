export interface ThemeSwitcherApi {
	switchTheme(theme: 'dark' | 'light'): void;
	currentTheme(): 'dark' | 'light';
	onThemeSwitched(cb: (oldTheme: 'dark' | 'light', newTheme: 'dark' | 'light') => void): void;
}
