/**
 * `LoginAdminPage`: pantalla de login de administrador.
 *
 * Ref: tasks.md T051 (depende de T027, T044, T047), spec.md FR-001, FR-002, US1.
 *
 * FR-001: permite iniciar sesión en el módulo administrativo mediante un formulario de
 * usuario/contraseña. FR-002: solo usuarios con rol ADMIN acceden; cualquier otro rol se rechaza
 * con un mensaje claro (el backend responde 401/403, `AuthAdminService.login` propaga ese error).
 *
 * Usa `AuthAdminService` (T027) a través de la instancia compartida de `serviceFactory` (T044);
 * no invoca `fetch`/`axios` directamente (Principio III de la constitución). Tras un login
 * exitoso, redirige a `/dashboard` (ruta configurada en `AppRouter`, T047).
 */
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerServiceFactory } from "../../infrastructure/serviceFactory";

export function LoginAdminPage(): JSX.Element {
  const navigate = useNavigate();
  const { authAdminService } = obtenerServiceFactory();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function manejarSubmit(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await authAdminService.login(email, password);
      navigate("/dashboard", { replace: true });
    } catch {
      // Ref: FR-002 — cualquier rol distinto de ADMIN, o credenciales inválidas, MUST rechazarse
      // con un mensaje claro. El backend distingue 401 (credenciales inválidas) de 403 (rol no
      // ADMIN); a nivel de UI se muestra un único mensaje claro sin filtrar detalles internos.
      setError("No se pudo iniciar sesión: verificá tus credenciales o tu rol de administrador.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={manejarSubmit} aria-label="Formulario de login de administrador">
      <h1>Ingreso al módulo administrativo</h1>

      <label htmlFor="login-email">Email</label>
      <input
        id="login-email"
        type="email"
        value={email}
        onChange={(evento) => setEmail(evento.target.value)}
        required
      />

      <label htmlFor="login-password">Contraseña</label>
      <input
        id="login-password"
        type="password"
        value={password}
        onChange={(evento) => setPassword(evento.target.value)}
        required
      />

      {error && (
        <p role="alert" data-testid="login-error">
          {error}
        </p>
      )}

      <button type="submit" disabled={enviando}>
        {enviando ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}
