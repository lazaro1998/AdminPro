import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { notificar } from "../utils/notificaciones";
import { confirmar } from "../utils/confirmaciones";

function Facturacion({ onNavigate }) {
  const [clientes, setClientes] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [clienteId, setClienteId] = useState("");
  const [numero, setNumero] = useState("");
  const [fecha, setFecha] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [fechaVencimiento, setFechaVencimiento] = useState("");

  const [detalles, setDetalles] = useState([
    {
      descripcion: "",
      cantidad: 1,
      precio_unitario: 0
    }
  ]);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const respuestaClientes = await fetch(
          "http://localhost:3001/api/clientes"
        );
        const datosClientes = await respuestaClientes.json();
        setClientes(datosClientes);

        const respuestaFacturas = await fetch(
          "http://localhost:3001/api/facturas"
        );
        const datosFacturas = await respuestaFacturas.json();
        setFacturas(datosFacturas);
      } catch (error) {
        console.error("Error al cargar datos:", error);
        notificar("No se pudieron cargar los datos de facturación.", "error");
      }
    };

    cargarDatos();
  }, []);

  const descargarFacturaPDF = async (id) => {
    try {
      const respuesta = await fetch(
        `http://localhost:3001/api/facturas/${id}`
      );

      const factura = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error("No se pudo obtener la factura");
      }

      const documento = new jsPDF();

      documento.setFontSize(20);
      documento.text("ADMINPRO", 14, 20);

      documento.setFontSize(16);
      documento.text(`Factura ${factura.numero}`, 14, 35);

      documento.setFontSize(11);
      documento.text(`Cliente: ${factura.cliente_nombre}`, 14, 48);
      documento.text(
        `Fecha: ${new Date(factura.fecha).toLocaleDateString("es-AR")}`,
        14,
        56
      );
      documento.text(`Estado: ${factura.estado}`, 14, 64);

      autoTable(documento, {
        startY: 75,
        head: [[
          "Descripción",
          "Cantidad",
          "Precio unitario",
          "Subtotal"
        ]],
        body: factura.detalles.map((detalle) => [
          detalle.descripcion,
          Number(detalle.cantidad).toString(),
          `$${Number(detalle.precio_unitario).toFixed(2)}`,
          `$${Number(detalle.subtotal).toFixed(2)}`
        ])
      });

      const posicionFinal = documento.lastAutoTable.finalY + 15;

      documento.setFontSize(16);
      documento.text(
        `TOTAL: $${Number(factura.total).toFixed(2)}`,
        14,
        posicionFinal
      );

      documento.save(`Factura-${factura.numero}.pdf`);
    } catch (error) {
      notificar(error.message, "error");
    }
  };

  const verDetalleFactura = async (id) => {
    setCargandoDetalle(true);

    try {
      const respuesta = await fetch(
        `http://localhost:3001/api/facturas/${id}`
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.error || "No se pudo consultar la factura");
      }

      setFacturaSeleccionada(datos);
    } catch (error) {
      notificar(error.message, "error");
    } finally {
      setCargandoDetalle(false);
    }
  };

  const cambiarEstadoFactura = async (id, nuevoEstado) => {
    try {
      const respuesta = await fetch(
        `http://localhost:3001/api/facturas/${id}/estado`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            estado: nuevoEstado
          })
        }
      );

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(resultado.error || "No se pudo actualizar el estado");
      }

      setFacturas((facturasActuales) =>
        facturasActuales.map((factura) =>
          factura.id === id
            ? { ...factura, estado: nuevoEstado }
            : factura
        )
      );

      setFacturaSeleccionada((facturaActual) =>
        facturaActual && facturaActual.id === id
          ? { ...facturaActual, estado: nuevoEstado }
          : facturaActual
      );

      notificar("¡Estado de factura actualizado!", "exito");
    } catch (error) {
      notificar(error.message, "error");
    }
  };

  
const eliminarFactura = async (id) => {
  const aceptado = await confirmar({
    titulo: "Eliminar factura",
    mensaje: "¿Estás seguro de que querés eliminar esta factura? Esta acción no se puede deshacer.",
    textoConfirmar: "Eliminar",
    tipo: "peligro"
  });

  if (!aceptado) return;

  try {
    const respuesta = await fetch(
      `http://localhost:3001/api/facturas/${id}`,
      {
        method: "DELETE"
      }
    );

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(resultado.error || "No se pudo eliminar la factura");
    }

    setFacturas((facturasActuales) =>
      facturasActuales.filter((factura) => factura.id !== id)
    );

    if (facturaSeleccionada?.id === id) {
      setFacturaSeleccionada(null);
    }

    notificar("¡Factura eliminada correctamente!", "exito");
  } catch (error) {
    notificar(error.message, "error");
  }
};


  const agregarDetalle = () => {
    setDetalles([
      ...detalles,
      {
        descripcion: "",
        cantidad: 1,
        precio_unitario: 0
      }
    ]);
  };

  const actualizarDetalle = (indice, campo, valor) => {
    const nuevosDetalles = [...detalles];
    nuevosDetalles[indice][campo] = valor;
    setDetalles(nuevosDetalles);
  };

  const eliminarDetalle = (indice) => {
    if (detalles.length === 1) return;

    setDetalles(detalles.filter((_, i) => i !== indice));
  };

  const total = detalles.reduce((acumulado, detalle) => {
    return acumulado +
      Number(detalle.cantidad) * Number(detalle.precio_unitario);
  }, 0);

  const guardarFactura = async (e) => {
    e.preventDefault();

    if (!clienteId || !numero || detalles.some(
      (detalle) => !detalle.descripcion.trim() ||
      Number(detalle.cantidad) <= 0 ||
      Number(detalle.precio_unitario) < 0
    )) {
      notificar("Completá todos los datos correctamente.", "error");
      return;
    }

    try {
      const respuesta = await fetch(
        "http://localhost:3001/api/facturas",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            cliente_id: clienteId,
            numero,
            fecha,
            fecha_vencimiento: fechaVencimiento,
            detalles
          })
        }
      );

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(resultado.error || "No se pudo guardar la factura");
      }

      notificar("¡Factura registrada correctamente!", "exito");

      setClienteId("");
      setNumero("");
      setFechaVencimiento("");
      setDetalles([
        {
          descripcion: "",
          cantidad: 1,
          precio_unitario: 0
        }
      ]);

      const respuestaFacturas = await fetch(
        "http://localhost:3001/api/facturas"
      );
      const datosFacturas = await respuestaFacturas.json();
      setFacturas(datosFacturas);
    } catch (error) {
      notificar(error.message, "error");
    }
  };

  return (
    <div className="content">
      <div className="welcome">
        <div>
          <h1>Facturación</h1>
          <p>Registrá y administrá las facturas de tu negocio.</p>
        </div>

        <button
          className="back-button"
          onClick={() => onNavigate("dashboard")}
        >
          Volver
        </button>
      </div>

      <section className="panel invoice-panel">
        <h3>Nueva factura</h3>

        <form onSubmit={guardarFactura}>
          <div className="invoice-form-grid">
            <div>
              <label>Cliente</label>
              <select
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                required
              >
                <option value="">Seleccionar cliente</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Número de factura</label>
              <input
                type="text"
                placeholder="Ej: FAC-0001"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                required
              />
            </div>

            <div>
              <label>Fecha</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
              />
            </div>

            <div>
              <label>Fecha de vencimiento</label>
              <input
                type="date"
                value={fechaVencimiento}
                onChange={(e) => setFechaVencimiento(e.target.value)}
              />
            </div>
          </div>

          <h3>Detalle de la factura</h3>

          <div className="invoice-details">
            {detalles.map((detalle, indice) => (
              <div className="invoice-detail-row" key={indice}>
                <div className="invoice-field">
                  <label>Descripción</label>
                  <input
                    type="text"
                    placeholder="Producto o servicio"
                    value={detalle.descripcion}
                    onChange={(e) =>
                      actualizarDetalle(indice, "descripcion", e.target.value)
                    }
                    required
                  />
                </div>

                <div className="invoice-field">
                  <label>Cantidad</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={detalle.cantidad}
                    onChange={(e) =>
                      actualizarDetalle(indice, "cantidad", e.target.value)
                    }
                    required
                  />
                </div>

                <div className="invoice-field">
                  <label>Precio unitario</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={detalle.precio_unitario}
                    onChange={(e) =>
                      actualizarDetalle(indice, "precio_unitario", e.target.value)
                    }
                    required
                  />
                </div>

                <div className="invoice-field">
                  <label>Subtotal</label>
                  <div className="invoice-subtotal">
                    ${(Number(detalle.cantidad) *
                      Number(detalle.precio_unitario)).toFixed(2)}
                  </div>
                </div>

                <button
                  type="button"
                  className="invoice-remove-button"
                  onClick={() => eliminarDetalle(indice)}
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="invoice-add-button"
            onClick={agregarDetalle}
          >
            + Agregar producto o servicio
          </button>

          <div className="invoice-total">
            Total: ${total.toFixed(2)}
          </div>

          <button type="submit" className="invoice-save-button">
            Guardar factura
          </button>
        </form>
      </section>

      <section className="panel">
        <h3>Facturas registradas</h3>

        {facturas.length === 0 ? (
          <p>Todavía no hay facturas registradas.</p>
        ) : (
          <div className="table-container">
            <table className="invoice-table">
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {facturas.map((factura) => (
                  <tr key={factura.id}>
                    <td>{factura.numero}</td>
                    <td>{factura.cliente_nombre}</td>
                    <td>
                      {new Date(factura.fecha).toLocaleDateString("es-AR")}
                    </td>
                    <td>
                      ${Number(factura.total).toLocaleString("es-AR", {
                        minimumFractionDigits: 2
                      })}
                    </td>
                    <td>
                      <span className="invoice-status">
                        {factura.estado}
                      </span>
                    </td>

                    <td>
                      <div className="invoice-actions">
                        <button
                          type="button"
                          className="invoice-add-button"
                          onClick={() => verDetalleFactura(factura.id)}
                        >
                          Ver detalle
                        </button>

                        <button
                          type="button"
                          className="invoice-add-button"
                          onClick={() => descargarFacturaPDF(factura.id)}
                        >
                          Descargar PDF
                        </button>

                        {factura.estado !== "pagada" && (
                          <button
                            type="button"
                            className="invoice-save-button"
                            onClick={async () => {
  const aceptado = await confirmar({
    titulo: "Marcar factura como pagada",
    mensaje: "¿Confirmás que esta factura ya fue pagada?",
    textoConfirmar: "Sí, marcar como pagada"
  });

  if (aceptado) {
    cambiarEstadoFactura(factura.id, "pagada");
  }
}}
                          >
                            Marcar como pagada
                          </button>
                        )}

                        <button
                          type="button"
                          className="invoice-remove-button"
                          onClick={() => eliminarFactura(factura.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {cargandoDetalle && (
              <p>Cargando detalle de factura...</p>
            )}

            {facturaSeleccionada && (
              <section className="panel invoice-panel">
                <div className="welcome">
                  <div>
                    <h3>Detalle de factura {facturaSeleccionada.numero}</h3>
                    <p>Cliente: {facturaSeleccionada.cliente_nombre}</p>
                    <p>
                      Fecha: {new Date(facturaSeleccionada.fecha).toLocaleDateString("es-AR")}
                    </p>
                    <p>Estado: {facturaSeleccionada.estado}</p>
                  </div>

                  <button
                    type="button"
                    className="back-button"
                    onClick={() => setFacturaSeleccionada(null)}
                  >
                    Cerrar detalle
                  </button>
                </div>

                <table className="invoice-table">
                  <thead>
                    <tr>
                      <th>Descripción</th>
                      <th>Cantidad</th>
                      <th>Precio unitario</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>

                  <tbody>
                    {facturaSeleccionada.detalles.map((detalle, indice) => (
                      <tr key={indice}>
                        <td>{detalle.descripcion}</td>
                        <td>{Number(detalle.cantidad)}</td>
                        <td>${Number(detalle.precio_unitario).toFixed(2)}</td>
                        <td>${Number(detalle.subtotal).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="invoice-total">
                  Total: ${Number(facturaSeleccionada.total).toFixed(2)}
                </div>
              </section>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default Facturacion;