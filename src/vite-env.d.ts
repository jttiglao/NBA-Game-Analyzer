/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NBA_SERVICE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
