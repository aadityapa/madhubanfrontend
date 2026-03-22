import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import { colors, font, radii, space, type ThemeColors } from "./primitives";

export interface Theme {
  colors: ThemeColors;
  radii: typeof radii;
  space: typeof space;
  font: typeof font;
}

const defaultTheme: Theme = { colors, radii, space, font };

const ThemeContext = createContext<Theme>(defaultTheme);

export function ThemeProvider({
  children,
  value,
}: {
  children: ReactNode;
  value?: Partial<Theme>;
}) {
  const merged: Theme = {
    colors: { ...colors, ...value?.colors },
    radii: { ...radii, ...value?.radii },
    space: { ...space, ...value?.space },
    font: { ...font, ...value?.font },
  };
  return (
    <ThemeContext.Provider value={merged}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
