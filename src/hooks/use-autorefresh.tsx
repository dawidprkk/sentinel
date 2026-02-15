"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { mutate } from "swr";

interface AutoRefreshContext {
  enabled: boolean;
  toggle: () => void;
}

const Context = createContext<AutoRefreshContext>({
  enabled: true,
  toggle: () => {},
});

export function AutoRefreshProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      if (next) {
        void mutate(
          (key) => typeof key === "string" && key.startsWith("/api/"),
          undefined,
          { revalidate: true },
        );
      }
      return next;
    });
  }, []);

  return (
    <Context.Provider value={{ enabled, toggle }}>
      {children}
    </Context.Provider>
  );
}

export function useAutoRefresh() {
  return useContext(Context);
}
