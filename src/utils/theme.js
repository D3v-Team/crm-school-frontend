// src/utils/theme.js
const storageToCss = {
  accent: '--accent',
  accent_hover: '--accent-hover',
  card_bg: '--card-bg',
  card_border: '--card-border',
  text_primary: '--text-primary',
  text_secondary: '--text-secondary',
  input_bg: '--input-bg',
  input_border: '--input-border',
  input_text: '--input-text',
  placeholder_color: '--placeholder-color',
  page_bg: '--page-bg',
};

export function applyThemeFromStorage() {
  Object.entries(storageToCss).forEach(([storageKey, cssVar]) => {
    const v = localStorage.getItem(storageKey);
    if (v) document.documentElement.style.setProperty(cssVar, v);
  });

  // theme mode (dark/light)
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export function setThemeVars(vars = {}) {
  Object.entries(vars).forEach(([storageKey, value]) => {
    if (value == null) return;
    const cssVar = storageToCss[storageKey];
    if (cssVar) {
      document.documentElement.style.setProperty(cssVar, value);
      localStorage.setItem(storageKey, value);
    }
  });
}

export function initTheme() {
  applyThemeFromStorage();
}

export default {
  applyThemeFromStorage,
  setThemeVars,
  initTheme,
};
