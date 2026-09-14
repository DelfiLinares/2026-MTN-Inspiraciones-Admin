/**
 * Test de `LoginAdminPage`.
 *
 * Ref: tasks.md T054 (depende de T051), spec.md US1 (escenarios 1–3), FR-001, FR-002.
 *
 * Cubre los 3 escenarios de US1:
 * 1. Rechazo de un usuario con rol distinto de ADMIN (backend responde 403 → mensaje claro,
 *    sin navegar a /dashboard).
 * 2. Aceptación de un usuario ADMIN (login exitoso → navega a /dashboard).
 * 3. Error de credenciales inválidas (backend responde 401 → mensaje claro, sin navegar).
 *
 * Mockea `obtenerServiceFactory` (T044) para controlar `authAdminService.login` sin depender de
 * `httpClient` real, y mockea `useNavigate` de `react-router-dom` para verificar la navegación.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LoginAdminPage } from "@/presentation/login/LoginAdminPage";

const loginMock = vi.fn();
const navigateMock = vi.fn();

vi.mock("@/infrastructure/serviceFactory", () => ({
  obtenerServiceFactory: () => ({
    authAdminService: { login: loginMock },
  }),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

function completarYEnviarFormulario(email: string, password: string): void {
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: /ingresar/i }));
}

describe("LoginAdminPage", () => {
  beforeEach(() => {
    loginMock.mockReset();
    navigateMock.mockReset();
  });

  it("escenario 1: rechaza a un usuario sin rol ADMIN mostrando un mensaje claro (FR-002)", async () => {
    loginMock.mockRejectedValue(new Error("403: rol no autorizado"));

    render(
      <MemoryRouter>
        <LoginAdminPage />
      </MemoryRouter>,
    );

    completarYEnviarFormulario("usuario@example.com", "clave-valida");

    await waitFor(() => {
      expect(screen.getByTestId("login-error")).toBeInTheDocument();
    });
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("escenario 2: acepta a un usuario ADMIN y navega a /dashboard (FR-001)", async () => {
    loginMock.mockResolvedValue({});

    render(
      <MemoryRouter>
        <LoginAdminPage />
      </MemoryRouter>,
    );

    completarYEnviarFormulario("admin@example.com", "clave-valida");

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith("/dashboard", { replace: true });
    });
    expect(screen.queryByTestId("login-error")).not.toBeInTheDocument();
  });

  it("escenario 3: muestra un mensaje claro ante credenciales inválidas (401)", async () => {
    loginMock.mockRejectedValue(new Error("401: credenciales inválidas"));

    render(
      <MemoryRouter>
        <LoginAdminPage />
      </MemoryRouter>,
    );

    completarYEnviarFormulario("admin@example.com", "clave-incorrecta");

    await waitFor(() => {
      expect(screen.getByTestId("login-error")).toBeInTheDocument();
    });
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
