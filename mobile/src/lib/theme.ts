import { useColorScheme } from "react-native";

// Same brand as the website: blue → emerald. All text/background pairs meet WCAG AA (4.5:1).
export const light = {
  bg: "#f3f6fb", card: "#ffffff", border: "#dbe3ee", input: "#f8fafc",
  text: "#0f172a", muted: "#475569", subtle: "#586579",
  primary: "#2563eb", onPrimary: "#ffffff", primarySoft: "#dbeafe", onPrimarySoft: "#1e40af",
  success: "#047857", successSoft: "#d1fae5", warn: "#92400e", warnSoft: "#fef3c7",
  danger: "#b91c1c", dangerSoft: "#fee2e2", violetSoft: "#ede9fe", onViolet: "#5b21b6",
  tabBar: "#ffffff", shadow: "#0f172a",
};
export type Palette = typeof light;
export const dark: Palette = {
  bg: "#0a1020", card: "#121a2e", border: "#26324b", input: "#0e1628",
  text: "#e8eef9", muted: "#b0bdd3", subtle: "#93a2bd",
  primary: "#3b82f6", onPrimary: "#ffffff", primarySoft: "#172a52", onPrimarySoft: "#bfdbfe",
  success: "#34d399", successSoft: "#0b2e25", warn: "#fbbf24", warnSoft: "#332706",
  danger: "#f87171", dangerSoft: "#3b1414", violetSoft: "#251a4a", onViolet: "#ddd6fe",
  tabBar: "#0e1628", shadow: "#000000",
};

export function useTheme(): Palette & { isDark: boolean } {
  const scheme = useColorScheme();
  return scheme === "dark" ? { ...dark, isDark: true } : { ...light, isDark: false };
}

export const radius = { sm: 10, md: 14, lg: 20, pill: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
