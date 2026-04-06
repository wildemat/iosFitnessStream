/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OVERLAYS_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
