
import { useEffect, useState } from "react";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Movimientos from "./pages/Movimientos";
import Facturacion from "./pages/Facturacion";
import CobrosPagos from "./pages/CobrosPagos";
import Reportes from "./pages/Reportes";
import Configuracion from "./pages/Configuracion";

function App() {
  const [pagina, setPagina] = useState("dashboard");
  const [notificacion, setNotificacion] = useState(null);
  const [confirmacion, setConfirmacion] = useState(null);

  useEffect(() => {
    const mostrarNotificacion = (evento) => {
      setNotificacion({
        mensaje: evento.detail.mensaje,
        tipo: evento.detail.tipo || "exito",
        id: Date.now()
      });
    };

    const mostrarConfirmacion = (evento) => {
      setConfirmacion(evento.detail);
    };

    window.addEventListener(
      "adminpro-notificacion",
      mostrarNotificacion
    );

    window.addEventListener(
      "adminpro-confirmacion",
      mostrarConfirmacion
    );

    return () => {
      window.removeEventListener(
        "adminpro-notificacion",
        mostrarNotificacion
      );

      window.removeEventListener(
        "adminpro-confirmacion",
        mostrarConfirmacion
      );
    };
  }, []);

  useEffect(() => {
    if (!notificacion) return;

    const temporizador = setTimeout(() => {
      setNotificacion(null);
    }, 3500);

    return () => clearTimeout(temporizador);
  }, [notificacion]);

  const responderConfirmacion = (respuesta) => {
    if (!confirmacion) return;

    confirmacion.resolver(respuesta);
    setConfirmacion(null);
  };

  return (
    <>
      {notificacion && (
        <div
          style={{
            position: "fixed",
            top: "25px",
            right: "25px",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            gap: "14px",
            padding: "16px 22px",
            minWidth: "280px",
            maxWidth: "400px",
            background: "#ffffff",
            borderRadius: "12px",
            borderLeft: `5px solid ${
              notificacion.tipo === "error" ? "#ef4444" : "#22c55e"
            }`,
            boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
            color: "#1f2937",
            animation: "aparecer 0.3s ease"
          }}
        >
          <span style={{ fontSize: "25px" }}>
            {notificacion.tipo === "error" ? "⚠️" : "✓"}
          </span>

          <div style={{ flex: 1 }}>
            <strong style={{ display: "block", marginBottom: "4px" }}>
              {notificacion.tipo === "error"
                ? "Atención"
                : "¡Operación exitosa!"}
            </strong>

            <span style={{ fontSize: "14px", color: "#6b7280" }}>
              {notificacion.mensaje}
            </span>
          </div>

          <button
            onClick={() => setNotificacion(null)}
            style={{
              border: "none",
              background: "transparent",
              color: "#9ca3af",
              fontSize: "20px",
              cursor: "pointer"
            }}
          >
            ×
          </button>
        </div>
      )}

      {confirmacion && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100000,
            padding: "20px"
          }}
        >
          <div
            style={{
              background: "#ffffff",
              width: "100%",
              maxWidth: "420px",
              padding: "28px",
              borderRadius: "16px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
              animation: "aparecer 0.2s ease"
            }}
          >
            <div style={{ fontSize: "32px", marginBottom: "14px" }}>
              ⚠️
            </div>

            <h2 style={{
              margin: "0 0 10px",
              color: "#1f2937",
              fontSize: "20px"
            }}>
              {confirmacion.titulo || "¿Estás seguro?"}
            </h2>

            <p style={{
              margin: "0 0 25px",
              color: "#6b7280",
              fontSize: "14px",
              lineHeight: "1.6"
            }}>
              {confirmacion.mensaje}
            </p>

            <div style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px"
            }}>
              <button
                onClick={() => responderConfirmacion(false)}
                style={{
                  padding: "11px 18px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  background: "#ffffff",
                  color: "#374151",
                  cursor: "pointer",
                  fontWeight: "600"
                }}
              >
                Cancelar
              </button>

              <button
                onClick={() => responderConfirmacion(true)}
                style={{
                  padding: "11px 18px",
                  border: "none",
                  borderRadius: "8px",
                  background: confirmacion.tipo === "peligro"
                    ? "#ef4444"
                    : "#2563eb",
                  color: "#ffffff",
                  cursor: "pointer",
                  fontWeight: "600"
                }}
              >
                {confirmacion.textoConfirmar || "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {pagina === "dashboard" && <Dashboard onNavigate={setPagina} />}
      {pagina === "clientes" && <Clientes onNavigate={setPagina} />}
      {pagina === "movimientos" && <Movimientos onNavigate={setPagina} />}
      {pagina === "facturacion" && <Facturacion onNavigate={setPagina} />}
      {pagina === "cobros-pagos" && <CobrosPagos onNavigate={setPagina} />}
      {pagina === "reportes" && <Reportes onNavigate={setPagina} />}
      {pagina === "configuracion" && <Configuracion onNavigate={setPagina} />}

      <style>
        {`
          @keyframes aparecer {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </>
  );
}

export default App;

