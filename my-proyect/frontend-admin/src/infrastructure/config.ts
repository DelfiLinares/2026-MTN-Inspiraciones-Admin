/**
 * Configuración de entorno de frontend-admin/.
 *
 * Ref: tasks.md T005 — URL base de la API expuesta vía variable de entorno
 * (VITE_API_BASE_URL, ver .env.example), sin hardcodear endpoints en el código.
 *
 * Este módulo pertenece a la capa de infraestructura (Principio III de la constitución,
 * `.specify/memory/constitution.md`): es el único punto donde se lee la configuración de
 * conexión con la API REST del backend (contracts/openapi.yaml).
 */

function requireEnv(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name];
  if (!value) {
    throw new Error(
      `Falta la variable de entorno "${name}". Definila en un archivo .env a partir de .env.example.`,
    );
  }
  return value;
}

export const config = {
  apiBaseUrl: requireEnv("VITE_API_BASE_URL"),
};
