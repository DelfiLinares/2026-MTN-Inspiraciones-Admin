/// <reference types="vite/client" />

/**
 * Tipado de las variables de entorno propias de frontend-admin/ (prefijo VITE_).
 * Ref: tasks.md T005, .env.example
 */
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
