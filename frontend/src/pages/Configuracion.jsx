import { useEffect, useState } from "react";
import { Building2, Palette, Shield } from "lucide-react";
import { notificar } from "../utils/notificaciones";

const API = "http://localhost:3001/api";

function Configuracion({ onNavigate }) {
  const [empresa, setEmpresa] = useState({
    nombre: "",
    cuit: "",
    telefono: "",
    email: "",
    direccion: ""
  });

  useEffect(() => {
    async function cargarConfiguracion() {
      try {
        const respuesta = await fetch(`${API}/configuracion`);

        if (!respuesta.ok) {
          throw new Error("No se pudo cargar la configuración");
        }

        const datos = await respuesta.json();

        setEmpresa({
          nombre: datos.nombre_empresa || "",
          cuit: datos.cuit || "",
          telefono: datos.telefono || "",
          email: datos.email || "",
          direccion: datos.direccion || ""
        });
      } catch (error) {
        console.error("Error al cargar configuración:", error);
        notificar(error.message, "error");
      }
    }

    cargarConfiguracion();
  }, []);

  async function guardarConfiguracion() {
    try {
      const respuesta = await fetch(`${API}/configuracion`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          nombre_empresa: empresa.nombre,
          cuit: empresa.cuit,
          telefono: empresa.telefono,
          email: empresa.email,
          direccion: empresa.direccion
        })
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.error || "No se pudo guardar");
      }

      notificar("¡Configuración guardada correctamente!", "exito");
    } catch (error) {
      console.error("Error al guardar:", error);
      notificar(error.message, "error");
    }
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1>Configuración</h1>
          <p>Administrá las preferencias de AdminPro</p>
        </div>

        <button
          className="back-button"
          onClick={() => onNavigate("dashboard")}
        >
          Volver al inicio
        </button>
      </header>

      <div className="configuracion-grid">
        <section className="configuracion-card">
          <Building2 size={24} />
          <h2>Datos de la empresa</h2>
          <p>Configurá la información de tu negocio.</p>

          <label>Nombre de la empresa</label>
          <input
            type="text"
            value={empresa.nombre}
            onChange={(e) =>
              setEmpresa({ ...empresa, nombre: e.target.value })
            }
            placeholder="Nombre de la empresa"
          />

          <label>CUIT</label>
          <input
            type="text"
            value={empresa.cuit}
            onChange={(e) =>
              setEmpresa({ ...empresa, cuit: e.target.value })
            }
            placeholder="20-12345678-9"
          />

          <label>Teléfono</label>
          <input
            type="text"
            value={empresa.telefono}
            onChange={(e) =>
              setEmpresa({ ...empresa, telefono: e.target.value })
            }
            placeholder="Teléfono"
          />

          <label>Email</label>
          <input
            type="email"
            value={empresa.email}
            onChange={(e) =>
              setEmpresa({ ...empresa, email: e.target.value })
            }
            placeholder="correo@empresa.com"
          />

          <label>Dirección</label>
          <input
            type="text"
            value={empresa.direccion}
            onChange={(e) =>
              setEmpresa({ ...empresa, direccion: e.target.value })
            }
            placeholder="Dirección"
          />

          <button
            className="primary-button"
            onClick={guardarConfiguracion}
            style={{ marginTop: "24px" }}
          >
            Guardar cambios
          </button>
        </section>

        <section className="configuracion-card">
          <Palette size={24} />
          <h2>Personalización</h2>
          <p>Próximamente podrás personalizar la apariencia.</p>
        </section>

        <section className="configuracion-card">
          <Shield size={24} />
          <h2>Seguridad</h2>
          <p>Próximamente podrás administrar las opciones de seguridad.</p>
        </section>
      </div>
    </div>
  );
}

export default Configuracion;
