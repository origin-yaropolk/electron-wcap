class ThemeSwitcher {
	constructor() {
		this.currentTheme = 'light';
		this.init();
	}

	init() {
		const toggleBtn = document.getElementById('theme-toggle');
		if (toggleBtn) {
			toggleBtn.addEventListener('click', () => this.toggleTheme());
		}
		window.ThemeSwitcher = {
			switchTheme: this.switchTheme.bind(this),
			currentTheme: () => this.currentTheme,
			onThemeSwitched: this.onThemeSwitched.bind(this),
		}
	}

	toggleTheme() {
		const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
		this.switchTheme(newTheme);
	}

	switchTheme(theme) {
		const oldTheme = this.currentTheme;
		this.currentTheme = theme;
		this.applyTheme();

		this.cb(oldTheme, this.currentTheme);
	}

	onThemeSwitched(cb) {
		this.cb = cb;
	}

	applyTheme() {
		document.body.className = `${this.currentTheme}-theme`;
	}
}

document.addEventListener('DOMContentLoaded', () => {
	new ThemeSwitcher();
});
