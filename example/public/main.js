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
			weak: () => this.wref,
		}
	}

toggleTheme() {
	const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
	this.switchTheme(newTheme);

	this.cb?.(oldTheme, this.currentTheme);
  }

  onThemeSwitched(cb) {
	this.cb = cb;
	this.wref = new WeakRef(cb);

	setTimeout(() => this.cb = null, 10000)
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
