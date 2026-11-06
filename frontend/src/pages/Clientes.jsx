
import { useState, useEffect } from "react";

import {
  Users,
  Plus,
  Search,
  X,
  UserPlus,
  Pencil,
  Trash2,
  ArrowLeft
} from "lucide-react";
import { notificar } from "../utils/notificaciones";
import { confirmar } from "../utils/confirmaciones";

const API_URL = "http://localhost:3001/api/clientes";

function Clientes({ onNavigate }) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [clientes, setClientes] = useState([]);

  
useEffect(() => {
  async function cargarClientes() {
    try {
      const respuesta = await fetch(API_URL);

      if (!respuesta.ok) {
        throw new Error("No se pudieron cargar los clientes");
      }

      const datos = await respuesta.json();
      setClientes(datos);

    } catch (error) {
      console.error("Error al cargar clientes:", error);
      notificar("No se pudieron cargar los clientes desde el servidor.", "error");
    }
  }

  cargarClientes();
}, []);



  const [busqueda, setBusqueda] = useState("");

  const [clienteEditando, setClienteEditando] = useState(null);

  const formularioInicial = {
    nombre: "",
    documento: "",
    telefono: "",
    email: "",
    direccion: ""
  };

  const [formulario, setFormulario] = useState(formularioInicial);

  // BUSCADOR
  const clientesFiltrados = clientes.filter((cliente) =>
    [
      cliente.nombre,
      cliente.documento,
      cliente.telefono,
      cliente.email,
      cliente.direccion
    ]
      .join(" ")
      .toLowerCase()
      .includes(busqueda.trim().toLowerCase())
  );

  // CAMBIOS DEL FORMULARIO
  function manejarCambio(e) {
    setFormulario({
      ...formulario,
      [e.target.name]: e.target.value
    });
  }

  // ABRIR FORMULARIO NUEVO
  function nuevoCliente() {
    setClienteEditando(null);
    setFormulario(formularioInicial);
    setMostrarFormulario(true);
  }

  // ABRIR FORMULARIO DE EDICIÓN
  function editarCliente(cliente) {
    setClienteEditando(cliente.id);

    setFormulario({
      nombre: cliente.nombre,
      documento: cliente.documento,
      telefono: cliente.telefono,
      email: cliente.email,
      direccion: cliente.direccion
    });

    setMostrarFormulario(true);
  }

  // GUARDAR CLIENTE

async function guardarCliente(e) {
  e.preventDefault();

  const documentoExiste = clientes.some(
    (cliente) =>
      cliente.documento?.trim().toLowerCase() ===
        formulario.documento.trim().toLowerCase() &&
      cliente.id !== clienteEditando
  );

  if (formulario.documento.trim() && documentoExiste) {
    notificar("Ya existe un cliente con ese documento.", "error");
    return;
  }

  try {
    const metodo = clienteEditando !== null ? "PUT" : "POST";

    const url =
      clienteEditando !== null
        ? `${API_URL}/${clienteEditando}`
        : API_URL;

    const respuesta = await fetch(url, {
      method: metodo,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(formulario)
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(resultado.error || "No se pudo guardar el cliente");
    }

    const consulta = await fetch(API_URL);

    if (!consulta.ok) {
      throw new Error("No se pudo actualizar el listado");
    }

    const datos = await consulta.json();
    setClientes(datos);

    notificar(resultado.mensaje);
    cerrarFormulario();

  } catch (error) {
    console.error("Error al guardar cliente:", error);
    notificar(error.message, "error");
  }
}




  // CERRAR FORMULARIO
  function cerrarFormulario() {
    setMostrarFormulario(false);
    setClienteEditando(null);
    setFormulario(formularioInicial);
  }

  // ELIMINAR CLIENTE

async function eliminarCliente(id) {
  const aceptado = await confirmar({
    titulo: "Eliminar cliente",
    mensaje: "¿Estás seguro de que querés eliminar este cliente? Esta acción no se puede deshacer.",
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
      throw new Error(resultado.error || "No se pudo eliminar el cliente");
    }

    const consulta = await fetch(API_URL);

    if (!consulta.ok) {
      throw new Error("No se pudo actualizar el listado");
    }

    const datos = await consulta.json();
    setClientes(datos);

    notificar(resultado.mensaje);

  } catch (error) {
    console.error("Error al eliminar cliente:", error);
    notificar(error.message, "error");
  }
}



  return (
    <div className="content">

      {/* ENCABEZADO */}
      <div className="welcome">
  <div>
    <h1>Clientes</h1>
    <p>Administrá la información de tus clientes.</p>
  </div>

  <div className="header-actions">
    <button
      className="back-button"
      onClick={() => onNavigate("dashboard")}
    >
      <ArrowLeft size={18} />
      Volver al inicio
    </button>

    <button
      className="primary-button"
      onClick={nuevoCliente}
    >
      <Plus size={18} />
      Nuevo cliente
    </button>
  </div>
</div>

      {/* LISTADO */}
      <section className="panel">

        <h3>Listado de clientes</h3>

        <div className="search-box">
          <Search size={18} />

          <input
            placeholder="Buscar por nombre, DNI, teléfono o email..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        {clientes.length === 0 ? (
          <div className="empty-state">
            <Users size={42} color="#3478e5" />
            <p>Todavía no hay clientes registrados.</p>
          </div>
        ) : clientesFiltrados.length === 0 ? (
          <div className="empty-state">
            <Search size={42} color="#3478e5" />
            <p>No se encontraron clientes.</p>
          </div>
        ) : (

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Documento</th>
                  <th>Teléfono</th>
                  <th>Email</th>
                  <th>Dirección</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {clientesFiltrados.map((cliente) => (
                  <tr key={cliente.id}>

                    <td>{cliente.nombre}</td>
                    <td>{cliente.documento}</td>
                    <td>{cliente.telefono}</td>
                    <td>{cliente.email}</td>
                    <td>{cliente.direccion}</td>

                    <td>
                      <div className="action-buttons">

                        <button
                          className="edit-button"
                          title="Editar cliente"
                          onClick={() => editarCliente(cliente)}
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          className="delete-button"
                          title="Eliminar cliente"
                          onClick={() => eliminarCliente(cliente.id)}
                        >
                          <Trash2 size={16} />
                        </button>

                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        )}
      </section>

      {/* FORMULARIO */}
      {mostrarFormulario && (
        <div className="modal-overlay">

          <div className="modal">

            <div className="modal-header">

              <div>
                <h2>
                  {clienteEditando !== null
                    ? "Editar cliente"
                    : "Nuevo cliente"}
                </h2>

                <p>Completá los datos del cliente.</p>
              </div>

              <button
                type="button"
                className="close-button"
                onClick={cerrarFormulario}
              >
                <X />
              </button>

            </div>

            <form onSubmit={guardarCliente}>

              <div className="form-grid">

                <div className="form-field">
                  <label>Nombre y apellido *</label>

                  <input
                    name="nombre"
                    value={formulario.nombre}
                    onChange={manejarCambio}
                    placeholder="Ej. Juan Pérez"
                    required
                  />
                </div>

                <div className="form-field">
                  <label>DNI / CUIT *</label>

                  <input
                    name="documento"
                    value={formulario.documento}
                    onChange={manejarCambio}
                    placeholder="Ej. 30123456"
                    required
                  />
                </div>

                <div className="form-field">
                  <label>Teléfono</label>

                  <input
                    name="telefono"
                    value={formulario.telefono}
                    onChange={manejarCambio}
                    placeholder="Ej. 3511234567"
                  />
                </div>

                <div className="form-field">
                  <label>Correo electrónico</label>

                  <input
                    type="email"
                    name="email"
                    value={formulario.email}
                    onChange={manejarCambio}
                    placeholder="correo@ejemplo.com"
                  />
                </div>

                <div className="form-field full-width">
                  <label>Dirección</label>

                  <input
                    name="direccion"
                    value={formulario.direccion}
                    onChange={manejarCambio}
                    placeholder="Calle y número"
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

                <button
                  type="submit"
                  className="primary-button"
                >
                  <UserPlus size={17} />

                  {clienteEditando !== null
                    ? "Guardar cambios"
                    : "Guardar cliente"}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}

export default Clientes;
