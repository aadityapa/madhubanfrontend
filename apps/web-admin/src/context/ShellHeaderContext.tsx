import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export interface ShellHeaderConfig {
  title?: string;
  subtitle?: string;
  badge?: string;
  actions?: ReactNode;
  showSearch?: boolean;
}

interface ShellHeaderCtx {
  config: ShellHeaderConfig;
  setConfig: (c: ShellHeaderConfig) => void;
}

const ShellHeaderContext = createContext<ShellHeaderCtx>({
  config: { showSearch: true },
  setConfig: () => {},
});

export function ShellHeaderProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ShellHeaderConfig>({ showSearch: true });
  return (
    <ShellHeaderContext.Provider value={{ config, setConfig }}>
      {children}
    </ShellHeaderContext.Provider>
  );
}

export function useShellHeaderValue() {
  return useContext(ShellHeaderContext).config;
}

/** Call inside a page component to declaratively configure the top bar. */
export function useShellHeader(config: ShellHeaderConfig) {
  const { setConfig } = useContext(ShellHeaderContext);
  // Serialize to a stable string so the effect only re-runs when values change
  const key = (config.title ?? "") + (config.badge ?? "") + (config.subtitle ?? "") + String(config.showSearch);
  useEffect(() => {
    setConfig(config);
    return () => setConfig({ showSearch: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
