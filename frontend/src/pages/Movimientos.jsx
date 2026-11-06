
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Plus,
  TrendingUp,
  TrendingDown,
  Pencil,
  Trash2
} from "lucide-react";
import { notificar } from "../utils/notificaciones";
import { confirmar } from "../utils/confirmaciones";

const API_URL = "http://localhost:3001/api/movimientos";

function Movimientos({ onNavigate }) {
  const [movimientos, setMovimientos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [movimientoEditando, setMovimientoEditando] = useState(null);

  const formularioInicial = {
    descripcion: "",
    tipo: "ingreso",
    categoria: "",
    importe: "",
    fecha: new Date().toISOString().slice(0, 10)
  };

  const [formulario, setFormulario] = useState(formularioInicial);

  const movimientosFiltrados = movimientos.filter((movimiento) => {
    const coincideBusqueda =
      movimiento.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
      (movimiento.categoria || "").toLowerCase().includes(busqueda.toLowerCase());

    const coincideTipo =
      filtroTipo === "todos" || movimiento.tipo === filtroTipo;

    return coincideBusqueda && coincideTipo;
  });

  async function cargarMovimientos() {
    try {
      const respuesta = await fetch(API_URL);

      if (!respuesta.ok) {
        throw new Error("No se pudieron cargar los movimientos");
      }

      const datos = await respuesta.json();
      setMovimientos(datos);
    } catch (error) {
      console.error(error);
      notificar(error.message, "error");
    }
  }

  useEffect(() => {
    cargarMovimientos();
  }, []);

  function actualizarFormulario(e) {
    const { name, value } = e.target;

    setFormulario({
      ...formulario,
      [name]: value
    });
  }

  function abrirNuevoMovimiento() {
    setMovimientoEditando(null);
    setFormulario(formularioInicial);
    setMostrarFormulario(true);
  }

  function editarMovimiento(movimiento) {
    setMovimientoEditando(movimiento.id);

    setFormulario({
      descripcion: movimiento.descripcion,
      tipo: movimiento.tipo,
      categoria: movimiento.categoria || "",
      importe: movimiento.importe,
      fecha: new Date(movimiento.fecha).toISOString().slice(0, 10)
    });

    setMostrarFormulario(true);
  }

  function cerrarFormulario() {
    setMostrarFormulario(false);
    setMovimientoEditando(null);
    setFormulario(formularioInicial);
  }

  async function guardarMovimiento(e) {
    e.preventDefault();

    try {
      const metodo = movimientoEditando !== null ? "PUT" : "POST";

      const url = movimientoEditando !== null
        ? `${API_URL}/${movimientoEditando}`
        : API_URL;

      const respuesta = await fetch(url, {
        method: metodo,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...formulario,
          importe: Number(formulario.importe)
        })
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(resultado.error || "No se pudo guardar el movimiento");
      }

      notificar(resultado.mensaje, "exito");

      cerrarFormulario();
      await cargarMovimientos();

    } catch (error) {
      console.error(error);
      notificar(error.message, "error");
    }
  }

  
async function eliminarMovimiento(id) {
  const aceptado = await confirmar({
    titulo: "Eliminar movimiento",
    mensaje: "¿Estás seguro de que querés eliminar este movimiento? Esta acción no se puede deshacer.",
    textoConfirmar: "Eliminar",
    tipo: "peligro"
  });

  if (!aceptado) return;

  try {
    const respuesta = await fetch(`${API_URL}/${id}`, {
      method: "DELETE"
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(resultado.error || "No se pudo eliminar el movimiento");
    }

    notificar(resultado.mensaje, "exito");
    await cargarMovimientos();

  } catch (error) {
    console.error(error);
    notificar(error.message, "error");
  }
}


  return (
    <div className="content">
      <div className="welcome">
        <div>
          <h1>Movimientos</h1>
          <p>Administrá los ingresos y gastos de tu negocio.</p>
        </div>

        <div className="header-actions">
          <button
            className="back-button"
            onClick={() => onNavigate("dashboard")}
          >
            <ArrowLeft size={18} /> Volver
          </button>

          <button
            className="primary-button"
            onClick={abrirNuevoMovimiento}
          >
            <Plus size={18} /> Nuevo movimiento
          </button>
        </div>
      </div>

      {mostrarFormulario && (
        <section className="panel">
          <h3>
            {movimientoEditando !== null
              ? "Editar movimiento"
              : "Registrar movimiento"}
          </h3>

          <form onSubmit={guardarMovimiento}>
            <div className="form-grid">
              <div className="form-field full-width">
                <label>Descripción</label>
                <input
                  name="descripcion"
                  value={formulario.descripcion}
                  onChange={actualizarFormulario}
                  placeholder="Ej. Venta de productos"
                  required
                />
              </div>

              <div className="form-field">
                <label>Tipo de movimiento</label>
                <select
                  name="tipo"
                  value={formulario.tipo}
                  onChange={actualizarFormulario}
                >
                  <option value="ingreso">Ingreso</option>
                  <option value="gasto">Gasto</option>
                </select>
              </div>

              <div className="form-field">
                <label>Categoría</label>
                <input
                  name="categoria"
                  value={formulario.categoria}
                  onChange={actualizarFormulario}
                  placeholder="Ej. Ventas"
                />
              </div>

              <div className="form-field">
                <label>Importe</label>
                <input
                  type="number"
                  name="importe"
                  min="0.01"
                  step="0.01"
                  value={formulario.importe}
                  onChange={actualizarFormulario}
                  placeholder="125000"
                  required
                />
              </div>

              <div className="form-field">
                <label>Fecha</label>
                <input
                  type="date"
                  name="fecha"
                  value={formulario.fecha}
                  onChange={actualizarFormulario}
                  required
                />
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={cerrarFormulario}
              >
                Cancelar
              </button>

              <button type="submit" className="primary-button">
                {movimientoEditando !== null
                  ? "Guardar cambios"
                  : "Guardar movimiento"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="panel movements-panel">
        <div className="header-actions" style={{ marginBottom: "22px" }}>
          <div className="search-box">
            <input
              type="text"
              placeholder="Buscar por descripción o categoría..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            style={{
              padding: "11px 14px",
              border: "1px solid #dce3ed",
              borderRadius: "7px",
              background: "white",
              color: "#42516a"
            }}
          >
            <option value="todos">Todos los movimientos</option>
            <option value="ingreso">Solo ingresos</option>
            <option value="gasto">Solo gastos</option>
          </select>
        </div>

        <div className="panel-header">
          <div>
            <h3>Historial de movimientos</h3>
            <p>Operaciones registradas en tu negocio</p>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Tipo</th>
                <th>Categoría</th>
                <th>Fecha</th>
                <th>Importe</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {movimientosFiltrados.map((movimiento) => (
                <tr key={movimiento.id}>
                  <td>{movimiento.descripcion}</td>

                  <td>
                    {movimiento.tipo === "ingreso"
                      ? <TrendingUp size={16} />
                      : <TrendingDown size={16} />}
                    {" "}{movimiento.tipo}
                  </td>

                  <td>{movimiento.categoria || "Sin categoría"}</td>

                  <td>
                    {new Date(movimiento.fecha).toLocaleDateString("es-AR", {
                      timeZone: "UTC"
                    })}
                  </td>

                  <td className={movimiento.tipo === "ingreso" ? "positive" : "negative"}>
                    {Number(movimiento.importe).toLocaleString("es-AR", {
                      style: "currency",
                      currency: "ARS"
                    })}
                  </td>

                  <td>
                    <div className="action-buttons">
                      <button
                        className="edit-button"
                        title="Editar movimiento"
                        onClick={() => editarMovimiento(movimiento)}
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        className="delete-button"
                        title="Eliminar movimiento"
                        onClick={() => eliminarMovimiento(movimiento.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {movimientosFiltrados.length === 0 && (
                <tr>
                  <td colSpan="6">
                    No se encontraron movimientos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default Movimientos;
