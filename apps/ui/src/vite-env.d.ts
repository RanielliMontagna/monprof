/// <reference types="vite/client" />

interface Window {
  monprof?: {
    list: () => Promise<Record<string, { outputs: unknown[] }>>;
    apply: (name: string) => Promise<boolean>;
    save: (name: string) => Promise<boolean>;
    update: (payload: { name: string; profile: { outputs: unknown[] } }) => Promise<boolean>;
    getCurrent: () => Promise<{ outputs: unknown[] }>;
  };
}
