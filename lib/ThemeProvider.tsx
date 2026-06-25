import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { themes, type Theme, type ThemeName } from "./theme";

type Override = ThemeName | "system";

interface ThemeContextValue {
  theme: Theme;
  override: Override;
  setOverride: (o: Override) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const STORAGE_KEY = "lovenotes.theme-override";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [override, setOverrideState] = useState<Override>("system");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v === "light" || v === "dark" || v === "system") setOverrideState(v);
    });
  }, []);

  const setOverride = useCallback((o: Override) => {
    setOverrideState(o);
    AsyncStorage.setItem(STORAGE_KEY, o);
  }, []);

  const resolved: ThemeName =
    override === "system" ? (system === "dark" ? "dark" : "light") : override;

  const value = useMemo(
    () => ({ theme: themes[resolved], override, setOverride }),
    [resolved, override, setOverride]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx.theme;
}

export function useThemeControls() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemeControls must be used within ThemeProvider");
  return { override: ctx.override, setOverride: ctx.setOverride };
}
