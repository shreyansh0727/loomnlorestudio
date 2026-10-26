export const THEME_STORAGE_KEY = "buniya-theme";

export type Theme = "light" | "dark";

export const THEME_COLORS: Record<Theme, string> = {
  light: "#fdf6f3",
  dark: "#141013",
};

export function currentTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function applyThemeToDocument(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((meta) => meta.setAttribute("content", THEME_COLORS[theme]));
}

/** Resolves the stored/system preference before first paint to avoid a flash. */
export const THEME_INIT_SCRIPT = `(function(){try{var stored=localStorage.getItem("${THEME_STORAGE_KEY}");var dark=stored?stored==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;var root=document.documentElement;if(dark){root.classList.add("dark");}var metas=document.querySelectorAll('meta[name="theme-color"]');for(var i=0;i<metas.length;i++){metas[i].setAttribute("content",dark?"${THEME_COLORS.dark}":"${THEME_COLORS.light}");}}catch(e){}})();`;
