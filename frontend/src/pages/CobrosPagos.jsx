import { useEffect, useState } from "react";
import { Wallet, TrendingUp, TrendingDown, Receipt } from "lucide-react";
import { notificar } from "../utils/notificaciones";

const API = "http://localhost:3001/api";

function CobrosPagos({ onNavigate }) {
  const [pestana, setPestana] = useState("cobros");
  const [facturas, setFacturas] = useState([]);
  const [cobros, setCobros] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [nuevoCobro, setNuevoCobro] = useState({
    factura_id: "",
    importe: "",
    fecha: new Date().toISOString().slice(0, 10),
    metodo_pago: "Efectivo",
    observaciones: ""
  });

  const [nuevoPago, setNuevoPago] = useState({
    descripcion: "",
    proveedor: "",
    importe: "",
    fecha: new Date().toISOString().slice(0, 10),
    metodo_pago: "Efectivo",
    categoria: "",
    observaciones: ""
  });

  const cargarDatos = async () => {
    try {
      const [rFacturas, rCobros, rPagos] = await Promise.all([
        fetch(`${API}/facturas`),
        fetch(`${API}/cobros`),
        fetch(`${API}/pagos`)
      ]);

      if (!rFacturas.ok || !rCobros.ok || !rPagos.ok) {
        throw new Error("No se pudieron cargar los datos");
      }

      const [datosFacturas, datosCobros, datosPagos] =
        await Promise.all([
          rFacturas.json(),
          rCobros.json(),
          rPagos.json()
        ]);

      setFacturas(datosFacturas);
      setCobros(datosCobros);
      setPagos(datosPagos);
    } catch (error) {
      notificar(error.message, "error");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const totalCobrado = cobros.reduce(
    (total, cobro) => total + Number(cobro.importe), 0
  );

  const totalPagado = pagos.reduce(
    (total, pago) => total + Number(pago.importe), 0
  );

  const totalPendiente = facturas.reduce((total, factura) => {
    const cobrado = cobros
      .filter(c => Number(c.factura_id) === Number(factura.id))
      .reduce((suma, c) => suma + Number(c.importe), 0);

    return total + Math.max(0, Number(factura.total) - cobrado);
  }, 0);

  const registrarCobro = async (e) => {
    e.preventDefault();

    try {
      const respuesta = await fetch(`${API}/cobros`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoCobro)
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) throw new Error(datos.error);

      notificar("¡Cobro registrado correctamente!", "exito");

      setNuevoCobro({
        factura_id: "",
        importe: "",
        fecha: new Date().toISOString().slice(0, 10),
        metodo_pago: "Efectivo",
        observaciones: ""
      });

      await cargarDatos();
    } catch (error) {
      notificar(error.message, "error");
    }
  };

  const registrarPago = async (e) => {
    e.preventDefault();

    try {
      const respuesta = await fetch(`${API}/pagos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoPago)
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) throw new Error(datos.error);

      notificar("¡Pago registrado correctamente!", "exito");

      setNuevoPago({
        descripcion: "",
        proveedor: "",
        importe: "",
        fecha: new Date().toISOString().slice(0, 10),
        metodo_pago: "Efectivo",
        categoria: "",
        observaciones: ""
      });

      await cargarDatos();
    } catch (error) {
      notificar(error.message, "error");
    }
  };

  const dinero = (valor) =>
    Number(valor).toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS"
    });

  if (cargando) return <p>Cargando cobros y pagos...</p>;

  return (
    <div className="cobros-page">
      <div className="page-header">
        <div>
          <h1>Cobros y pagos</h1>
          <p>Administrá los ingresos recibidos y los pagos realizados.</p>
        </div>

        <button
          className="back-button"
          onClick={() => onNavigate("dashboard")}
        >
          ← Volver
        </button>
      </div>

      <div className="cobros-resumen">
        <div className="cobros-card">
          <TrendingUp color="#16a34a" />
          <span>Total cobrado</span>
          <h2>{dinero(totalCobrado)}</h2>
        </div>

        <div className="cobros-card">
          <TrendingDown color="#dc2626" />
          <span>Total pagado</span>
          <h2>{dinero(totalPagado)}</h2>
        </div>

        <div className="cobros-card">
          <Wallet color="#2563eb" />
          <span>Saldo pendiente</span>
          <h2>{dinero(totalPendiente)}</h2>
        </div>

        <div className="cobros-card">
          <Receipt color="#9333ea" />
          <span>Operaciones registradas</span>
          <h2>{cobros.length + pagos.length}</h2>
        </div>
      </div>

      <div className="cobros-panel">
        <div className="cobros-tabs">
          <button
            className={pestana === "cobros" ? "active" : ""}
            onClick={() => setPestana("cobros")}
          >
            Cobros
          </button>

          <button
            className={pestana === "pagos" ? "active" : ""}
            onClick={() => setPestana("pagos")}
          >
            Pagos
          </button>

          <button
            className={pestana === "historial" ? "active" : ""}
            onClick={() => setPestana("historial")}
          >
            Historial
          </button>
        </div>

        {pestana === "cobros" && (
          <>
            <h2>Registrar cobro</h2>

            <form className="cobros-form" onSubmit={registrarCobro}>
              <label>Factura</label>
              <select
                required
                value={nuevoCobro.factura_id}
                onChange={e => setNuevoCobro({
                  ...nuevoCobro,
                  factura_id: e.target.value
                })}
              >
                <option value="">Seleccionar factura</option>
                {facturas
                  .filter(f => f.estado !== "pagada")
                  .map(f => (
                    <option key={f.id} value={f.id}>
                      {f.numero} - {f.cliente_nombre} - {dinero(f.total)}
                    </option>
                  ))}
              </select>

              <label>Importe</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={nuevoCobro.importe}
                onChange={e => setNuevoCobro({
                  ...nuevoCobro,
                  importe: e.target.value
                })}
                placeholder="Importe del cobro"
              />

              <label>Fecha</label>
              <input
                type="date"
                required
                value={nuevoCobro.fecha}
                onChange={e => setNuevoCobro({
                  ...nuevoCobro,
                  fecha: e.target.value
                })}
              />

              <label>Medio de pago</label>
              <select
                value={nuevoCobro.metodo_pago}
                onChange={e => setNuevoCobro({
                  ...nuevoCobro,
                  metodo_pago: e.target.value
                })}
              >
                <option>Efectivo</option>
                <option>Transferencia</option>
                <option>Tarjeta</option>
                <option>Otro</option>
              </select>

              <label>Observaciones</label>
              <input
                value={nuevoCobro.observaciones}
                onChange={e => setNuevoCobro({
                  ...nuevoCobro,
                  observaciones: e.target.value
                })}
                placeholder="Observaciones (opcional)"
              />

              <button type="submit">Guardar cobro</button>
            </form>

            <h2>Últimos cobros</h2>
            <div className="cobros-tabla">
              <table>
                <thead>
                  <tr>
                    <th>Factura</th>
                    <th>Cliente</th>
                    <th>Fecha</th>
                    <th>Medio</th>
                    <th>Importe</th>
                  </tr>
                </thead>
                <tbody>
                  {cobros.map(c => (
                    <tr key={c.id}>
                      <td>{c.factura_numero}</td>
                      <td>{c.cliente_nombre}</td>
                      <td>{new Date(c.fecha).toLocaleDateString("es-AR")}</td>
                      <td>{c.metodo_pago || "-"}</td>
                      <td>{dinero(c.importe)}</td>
                    </tr>
                  ))}
                  {cobros.length === 0 && (
                    <tr>
                      <td colSpan="5">Todavía no hay cobros registrados.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {pestana === "pagos" && (
          <>
            <h2>Registrar pago</h2>

            <form className="cobros-form" onSubmit={registrarPago}>
              <label>Descripción</label>
              <input
                required
                value={nuevoPago.descripcion}
                onChange={e => setNuevoPago({
                  ...nuevoPago,
                  descripcion: e.target.value
                })}
                placeholder="Ej. Pago de alquiler"
              />

              <label>Proveedor</label>
              <input
                value={nuevoPago.proveedor}
                onChange={e => setNuevoPago({
                  ...nuevoPago,
                  proveedor: e.target.value
                })}
                placeholder="Nombre del proveedor"
              />

              <label>Importe</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={nuevoPago.importe}
                onChange={e => setNuevoPago({
                  ...nuevoPago,
                  importe: e.target.value
                })}
                placeholder="Importe"
              />

              <label>Fecha</label>
              <input
                type="date"
                required
                value={nuevoPago.fecha}
                onChange={e => setNuevoPago({
                  ...nuevoPago,
                  fecha: e.target.value
                })}
              />

              <label>Medio de pago</label>
              <select
                value={nuevoPago.metodo_pago}
                onChange={e => setNuevoPago({
                  ...nuevoPago,
                  metodo_pago: e.target.value
                })}
              >
                <option>Efectivo</option>
                <option>Transferencia</option>
                <option>Tarjeta</option>
                <option>Otro</option>
              </select>

              <label>Categoría</label>
              <input
                value={nuevoPago.categoria}
                onChange={e => setNuevoPago({
                  ...nuevoPago,
                  categoria: e.target.value
                })}
                placeholder="Ej. Servicios"
              />

              <label>Observaciones</label>
              <input
                value={nuevoPago.observaciones}
                onChange={e => setNuevoPago({
                  ...nuevoPago,
                  observaciones: e.target.value
                })}
                placeholder="Opcional"
              />

              <button type="submit">Guardar pago</button>
            </form>

            <h2>Últimos pagos</h2>
            <div className="cobros-tabla">
              <table>
                <thead>
                  <tr>
                    <th>Descripción</th>
                    <th>Proveedor</th>
                    <th>Fecha</th>
                    <th>Medio</th>
                    <th>Importe</th>
                  </tr>
                </thead>
                <tbody>
                  {pagos.map(p => (
                    <tr key={p.id}>
                      <td>{p.descripcion}</td>
                      <td>{p.proveedor || "-"}</td>
                      <td>{new Date(p.fecha).toLocaleDateString("es-AR")}</td>
                      <td>{p.metodo_pago || "-"}</td>
                      <td>{dinero(p.importe)}</td>
                    </tr>
                  ))}
                  {pagos.length === 0 && (
                    <tr>
                      <td colSpan="5">Todavía no hay pagos registrados.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {pestana === "historial" && (
          <>
            <h2>Historial de operaciones</h2>
            <div className="cobros-tabla">
              <table>
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Descripción</th>
                    <th>Fecha</th>
                    <th>Importe</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ...cobros.map(c => ({
                      id: `c-${c.id}`,
                      tipo: "Cobro",
                      descripcion: `${c.factura_numero} - ${c.cliente_nombre}`,
                      fecha: c.fecha,
                      importe: c.importe
                    })),
                    ...pagos.map(p => ({
                      id: `p-${p.id}`,
                      tipo: "Pago",
                      descripcion: p.descripcion,
                      fecha: p.fecha,
                      importe: -Number(p.importe)
                    }))
                  ]
                    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                    .map(op => (
                      <tr key={op.id}>
                        <td>{op.tipo}</td>
                        <td>{op.descripcion}</td>
                        <td>{new Date(op.fecha).toLocaleDateString("es-AR")}</td>
                        <td>{dinero(op.importe)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CobrosPagos;
