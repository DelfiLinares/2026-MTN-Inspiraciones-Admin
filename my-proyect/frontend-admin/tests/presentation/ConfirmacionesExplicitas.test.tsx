/**
 * Test consolidado de confirmaciones explícitas.
 *
 * Ref: tasks.md T082 (depende de T057, T058, T059, T066), spec.md FR-021, FR-022, SC-004.
 *
 * Consolida en un único test suite la verificación de que TODAS las acciones destructivas/
 * sensibles listadas en `spec.md` (FR-021: banear usuario, eliminar usuario, eliminar
 * publicación; FR-022: promover usuario a administrador) requieren confirmación explícita antes
 * de invocar el callback correspondiente, y que cancelar la confirmación NO ejecuta la acción.
 * No duplica los tests específicos de cada componente
 * (`UsuarioAccionesDestructivas.test.tsx` T062, `EliminarPublicacionAction.test.tsx` T069,
 * `PromoverUsuarioAction.test.tsx` T061): su propósito es verificar de forma consolidada, en una
 * única matriz, el cumplimiento de SC-004 ("toda acción destructiva registra confirmación
 * explícita").
 */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { BanearUsuarioAction } from "@/presentation/usuarios/BanearUsuarioAction";
import { EliminarUsuarioAction } from "@/presentation/usuarios/EliminarUsuarioAction";
import { PromoverUsuarioAction } from "@/presentation/usuarios/PromoverUsuarioAction";
import { EliminarPublicacionAction } from "@/presentation/moderacion/EliminarPublicacionAction";
import { Usuario } from "@/domain/Usuario";
import { RolUsuario } from "@/domain/enums/RolUsuario";
import { EstadoCuentaUsuario } from "@/domain/enums/EstadoCuentaUsuario";
import { Publicacion } from "@/domain/Publicacion";
import { EstadoPublicacion } from "@/domain/enums/EstadoPublicacion";
import { SesionAdministrativa } from "@/domain/SesionAdministrativa";

const obtenerSesionActualMock = vi.fn();

vi.mock("@/infrastructure/serviceFactory", () => ({
  obtenerServiceFactory: () => ({
    authAdminService: { obtenerSesionActual: obtenerSesionActualMock },
  }),
}));

function crearUsuarioActivo(id: string): Usuario {
  return new Usuario({
    id,
    nombre: `Usuario ${id}`,
    email: `${id}@example.com`,
    rol: RolUsuario.USER,
    estadoCuenta: EstadoCuentaUsuario.ACTIVO,
    fechaRegistro: new Date("2026-01-01T00:00:00Z"),
  });
}

function crearPublicacion(id: string): Publicacion {
  return new Publicacion({
    id,
    autorId: "u1",
    titulo: `Publicación ${id}`,
    estado: EstadoPublicacion.REPORTADA,
    fechaCreacion: new Date("2026-01-01T00:00:00Z"),
  });
}

function crearSesionAdmin(): SesionAdministrativa {
  return new SesionAdministrativa({
    token: "token-abc",
    expiraEn: new Date("2999-01-01T00:00:00Z"),
    usuario: new Usuario({
      id: "actor-admin",
      nombre: "Actor Admin",
      email: "admin@example.com",
      rol: RolUsuario.ADMIN,
      estadoCuenta: EstadoCuentaUsuario.ACTIVO,
      fechaRegistro: new Date("2026-01-01T00:00:00Z"),
    }),
  });
}

/**
 * Matriz de acciones destructivas/sensibles cubiertas por FR-021/FR-022, cada una con su botón
 * "gatillo" y el texto del botón de confirmación esperado.
 */
type CasoAccion = {
  nombre: string;
  render: (onConfirmado: (id: string) => void) => JSX.Element;
  textoBoton: string;
  idEsperado: string;
};

const casos: CasoAccion[] = [
  {
    nombre: "BanearUsuarioAction (FR-021, FR-005)",
    render: (onConfirmado) => (
      <BanearUsuarioAction usuario={crearUsuarioActivo("u1")} onBanear={onConfirmado} />
    ),
    textoBoton: "Banear",
    idEsperado: "u1",
  },
  {
    nombre: "EliminarUsuarioAction (FR-021, FR-006)",
    render: (onConfirmado) => (
      <EliminarUsuarioAction usuario={crearUsuarioActivo("u2")} onEliminar={onConfirmado} />
    ),
    textoBoton: "Eliminar",
    idEsperado: "u2",
  },
  {
    nombre: "EliminarPublicacionAction (FR-021, FR-010)",
    render: (onConfirmado) => (
      <EliminarPublicacionAction
        publicacion={crearPublicacion("p1")}
        onEliminar={onConfirmado}
      />
    ),
    textoBoton: "Eliminar publicación",
    idEsperado: "p1",
  },
  {
    nombre: "PromoverUsuarioAction (FR-022, FR-007)",
    render: (onConfirmado) => (
      <PromoverUsuarioAction usuario={crearUsuarioActivo("u3")} onPromover={onConfirmado} />
    ),
    textoBoton: "Promover a administrador",
    idEsperado: "u3",
  },
];

describe("Confirmaciones explícitas de acciones destructivas/sensibles (SC-004)", () => {
  beforeEachSetupSesionAdmin();

  it.each(casos)(
    "$nombre: no invoca la acción con el click inicial, solo tras confirmar explícitamente (FR-021/FR-022)",
    ({ render: renderCaso, textoBoton, idEsperado }) => {
      const onConfirmado = vi.fn();

      render(renderCaso(onConfirmado));

      fireEvent.click(screen.getByText(textoBoton));
      expect(onConfirmado).not.toHaveBeenCalled();

      fireEvent.click(screen.getByTestId("modal-confirmacion-confirmar"));
      expect(onConfirmado).toHaveBeenCalledWith(idEsperado);
    },
  );

  it.each(casos)(
    "$nombre: al cancelar la confirmación, NO invoca la acción (FR-021/FR-022)",
    ({ render: renderCaso, textoBoton }) => {
      const onConfirmado = vi.fn();

      render(renderCaso(onConfirmado));

      fireEvent.click(screen.getByText(textoBoton));
      fireEvent.click(screen.getByTestId("modal-confirmacion-cancelar"));

      expect(onConfirmado).not.toHaveBeenCalled();
    },
  );
});

function beforeEachSetupSesionAdmin(): void {
  // `PromoverUsuarioAction` requiere que el actor autenticado sea ADMIN para renderizarse
  // (FR-007, "la opción no debe existir para roles USER"); se configura una sesión ADMIN válida
  // para que las cuatro acciones de la matriz puedan evaluarse de forma homogénea.
  obtenerSesionActualMock.mockReturnValue(crearSesionAdmin());
}
