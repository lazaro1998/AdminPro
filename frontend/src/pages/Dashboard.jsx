import "../App.css";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  FileText,
  Wallet,
  ArrowLeftRight,
  BarChart3,
  Settings,
  Bell,
  Search,
  TrendingUp,
  TrendingDown,
  Plus
} from "lucide-react";
import { notificar } from "../utils/notificaciones";

function Dashboard({ onNavigate }) {
  const [totalClientes, setTotalClientes] = useState(0);
  const [mostrarNuevaOperacion, setMostrarNuevaOperacion] = useState(false);
  const [nuevaOperacion, setNuevaOperacion] = useState({
    descripcion: "",
    tipo: "ingreso",
    categoria: "",
    importe: "",
    fecha: new Date().toISOString().split("T")[0]
  });

  const [resumenRapido, setResumenRapido] = useState({
    facturas_emitidas: 0,
    facturas_pendientes: 0,
    pagos_registrados: 0,
    clientes_registrados: 0
  });

  const [estadisticas, setEstadisticas] = useState({
    ingresos: 0,
    gastos: 0,
    saldo: 0
  });

  useEffect(() => {
    async function cargarClientes() {
      try {
        const respuesta = await fetch("http://localhost:3001/api/clientes");

        if (!respuesta.ok) {
          throw new Error("No se pudieron cargar los clientes");
        }

        const datos = await respuesta.json();
        setTotalClientes(datos.length);
      } catch (error) {
        console.error("Error al obtener clientes:", error);
        notificar(error.message, "error");
      }
    }

    cargarClientes();
  }, []);

  useEffect(() => {
    async function cargarEstadisticas() {
      try {
        const respuesta = await fetch(
          "http://localhost:3001/api/estadisticas"
        );

        if (!respuesta.ok) {
          throw new Error("No se pudieron cargar las estadísticas");
        }

        const datos = await respuesta.json();
        setEstadisticas(datos);
      } catch (error) {
        console.error("Error al cargar estadísticas:", error);
        notificar(error.message, "error");
      }
    }

    cargarEstadisticas();

    const intervalo = setInterval(cargarEstadisticas, 10000);

    return () => clearInterval(intervalo);
  }, []);

  const [movements, setMovements] = useState([]);

  useEffect(() => {
    async function cargarMovimientos() {
      try {
        const respuesta = await fetch(
          "http://localhost:3001/api/movimientos"
        );

        if (!respuesta.ok) {
          throw new Error("No se pudieron cargar los movimientos");
        }

        const datos = await respuesta.json();
        setMovements(datos);
      } catch (error) {
        console.error("Error al cargar movimientos:", error);
        notificar(error.message, "error");
      }
    }

    cargarMovimientos();
  }, []);

  const [movimientosMensuales, setMovimientosMensuales] = useState([]);

  useEffect(() => {
    async function cargarMovimientosMensuales() {
      try {
        const respuesta = await fetch(
          "http://localhost:3001/api/movimientos/mensuales"
        );

        if (!respuesta.ok) {
          throw new Error("No se pudieron cargar los datos mensuales");
        }

        const datos = await respuesta.json();
        setMovimientosMensuales(datos);
      } catch (error) {
        console.error("Error al cargar el gráfico:", error);
        notificar(error.message, "error");
      }
    }

    cargarMovimientosMensuales();
  }, []);

  useEffect(() => {
    async function cargarResumenRapido() {
      try {
        const respuesta = await fetch(
          "http://localhost:3001/api/resumen-rapido"
        );

        if (!respuesta.ok) {
          throw new Error("No se pudo cargar el resumen rápido");
        }

        const datos = await respuesta.json();
        setResumenRapido(datos);
      } catch (error) {
        console.error("Error al cargar resumen rápido:", error);
        notificar(error.message, "error");
      }
    }

    cargarResumenRapido();

    const intervalo = setInterval(cargarResumenRapido, 10000);

    return () => clearInterval(intervalo);
  }, []);

  async function guardarNuevaOperacion() {
    try {
      if (!nuevaOperacion.descripcion.trim()) {
        notificar("Ingresá una descripción", "error");
        return;
      }

      if (
        !nuevaOperacion.importe ||
        !Number.isFinite(Number(nuevaOperacion.importe)) ||
        Number(nuevaOperacion.importe) <= 0
      ) {
        notificar("Ingresá un importe válido", "error");
        return;
      }

      const respuesta = await fetch(
        "http://localhost:3001/api/movimientos",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(nuevaOperacion)
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.error || "No se pudo registrar la operación");
      }

      notificar("¡Operación registrada correctamente!", "exito");

      setMostrarNuevaOperacion(false);

      setNuevaOperacion({
        descripcion: "",
        tipo: "ingreso",
        categoria: "",
        importe: "",
        fecha: new Date().toISOString().split("T")[0]
      });

      const respuestaMovimientos = await fetch(
        "http://localhost:3001/api/movimientos"
      );
      setMovements(await respuestaMovimientos.json());

      const respuestaEstadisticas = await fetch(
        "http://localhost:3001/api/estadisticas"
      );
      setEstadisticas(await respuestaEstadisticas.json());

      const respuestaMensual = await fetch(
        "http://localhost:3001/api/movimientos/mensuales"
      );
      setMovimientosMensuales(await respuestaMensual.json());

    } catch (error) {
      console.error("Error al registrar operación:", error);
      notificar(error.message, "error");
    }
  }

  const datosGrafico = Array.from({ length: 12 }, (_, index) => {
    const movimiento = movimientosMensuales.find(
      (item) => Number(item.mes) === index + 1
    );

    return {
      mes: index + 1,
      ingresos: Number(movimiento?.ingresos || 0),
      gastos: Number(movimiento?.gastos || 0)
    };
  });

  const maximoGrafico = Math.max(
    1,
    ...datosGrafico.flatMap((item) => [
      item.ingresos,
      item.gastos
    ])
  );

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">A</div>
          <span>AdminPro</span>
        </div>

        <p className="menu-label">MENÚ PRINCIPAL</p>

        <nav>
          <a
            className="nav-item active"
            onClick={() => onNavigate("dashboard")}
          >
            <LayoutDashboard /> Dashboard
          </a>

          <a
            className="nav-item"
            onClick={() => onNavigate("clientes")}
          >
            <Users /> Clientes
          </a>

          <a
            className="nav-item"
            onClick={() => onNavigate("facturacion")}
          >
            <FileText /> Facturación
          </a>

          <a
            className="nav-item"
            onClick={() => onNavigate("cobros-pagos")}
          >
            <Wallet /> Cobros y pagos
          </a>

          <a
            className="nav-item"
            onClick={() => onNavigate("movimientos")}
          >
            <ArrowLeftRight /> Movimientos
          </a>

          <a
            className="nav-item"
            onClick={() => onNavigate("reportes")}
          >
            <BarChart3 /> Reportes
          </a>
        </nav>

        <div className="sidebar-bottom">
          <a
            className="nav-item"
            onClick={() => onNavigate("configuracion")}
          >
            <Settings /> Configuración
          </a>

          <div className="user-profile">
            <div className="avatar">LC</div>
            <div>
              <strong>Lázaro Cifra</strong>
              <small>Administrador</small>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="search-box">
            <Search size={18} />
            <input placeholder="Buscar..." />
          </div>

          <div className="topbar-right">
            <button className="icon-button">
              <Bell size={20} />
            </button>
            <span className="today">AdminPro · Panel administrativo</span>
          </div>
        </header>

        <section className="content">
          <div className="welcome">
            <div>
              <h1>Dashboard</h1>
              <p>Bienvenido a AdminPro. Este es el resumen de tu negocio.</p>
            </div>

            <button
              className="primary-button"
              onClick={() => setMostrarNuevaOperacion(true)}
            >
              <Plus size={18} /> Nueva operación
            </button>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-top">
                <span>Ingresos totales</span>
                <div className="stat-icon green"><TrendingUp /></div>
              </div>

              <h2>
                {estadisticas.ingresos.toLocaleString("es-AR", {
                  style: "currency",
                  currency: "ARS",
                  maximumFractionDigits: 2
                })}
              </h2>

              <small className="positive">+12,5% respecto al mes anterior</small>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                <span>Gastos totales</span>
                <div className="stat-icon red"><TrendingDown /></div>
              </div>

              <h2>
                {estadisticas.gastos.toLocaleString("es-AR", {
                  style: "currency",
                  currency: "ARS",
                  maximumFractionDigits: 2
                })}
              </h2>

              <small className="negative">+4,2% respecto al mes anterior</small>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                <span>Saldo disponible</span>
                <div className="stat-icon blue"><Wallet /></div>
              </div>

              <h2>
                {estadisticas.saldo.toLocaleString("es-AR", {
                  style: "currency",
                  currency: "ARS",
                  maximumFractionDigits: 2
                })}
              </h2>

              <small>Ingresos menos gastos</small>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                <span>Clientes registrados</span>
                <div className="stat-icon purple"><Users /></div>
              </div>

              <h2>{totalClientes}</h2>

              <small>
                Total de clientes guardados en el sistema
              </small>
            </div>
          </div>

          <div className="dashboard-grid">
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h3>Actividad financiera</h3>
                  <p>Resumen de ingresos y gastos</p>
                </div>
              </div>

              <div className="chart-placeholder">
                <div className="chart-bars">
                  {datosGrafico.map((dato) => (
                    <div className="bar-group" key={dato.mes}>
                      <div
                        className="bar income-bar"
                        style={{
                          height: `${(dato.ingresos / maximoGrafico) * 100}%`
                        }}
                        title={`Ingresos: $${dato.ingresos.toLocaleString("es-AR")}`}
                      />

                      <div
                        className="bar expense-bar"
                        style={{
                          height: `${(dato.gastos / maximoGrafico) * 100}%`
                        }}
                        title={`Gastos: $${dato.gastos.toLocaleString("es-AR")}`}
                      />
                    </div>
                  ))}
                </div>

                <div className="chart-labels">
                  {[
                    "ENE", "FEB", "MAR", "ABR", "MAY", "JUN",
                    "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"
                  ].map(month => (
                    <span key={month}>{month}</span>
                  ))}
                </div>
              </div>

              <div className="legend">
                <span><i className="legend-income" /> Ingresos</span>
                <span><i className="legend-expense" /> Gastos</span>
              </div>
            </section>

            <section className="panel">
              <div className="panel-header">
                <div>
                  <h3>Resumen rápido</h3>
                  <p>Estado de la administración</p>
                </div>
              </div>

              <div className="quick-item">
                <span>Facturas emitidas</span>
                <strong>{resumenRapido.facturas_emitidas}</strong>
              </div>

              <div className="quick-item">
                <span>Facturas pendientes</span>
                <strong>{resumenRapido.facturas_pendientes}</strong>
              </div>

              <div className="quick-item">
                <span>Pagos registrados</span>
                <strong>{resumenRapido.pagos_registrados}</strong>
              </div>

              <div className="quick-item">
                <span>Clientes registrados</span>
                <strong>{resumenRapido.clientes_registrados}</strong>
              </div>
            </section>
          </div>

          <section className="panel movements-panel">
            <div className="panel-header">
              <div>
                <h3>Últimos movimientos</h3>
                <p>Actividad reciente de tu negocio</p>
              </div>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Descripción</th>
                    <th>Categoría</th>
                    <th>Fecha</th>
                    <th>Importe</th>
                  </tr>
                </thead>

                <tbody>
                  {movements.map((movement) => (
                    <tr key={movement.id}>
                      <td>{movement.descripcion}</td>
                      <td>{movement.categoria || "Sin categoría"}</td>
                      <td>
                        {new Date(movement.fecha).toLocaleDateString("es-AR", {
                          timeZone: "UTC"
                        })}
                      </td>
                      <td className={movement.tipo === "ingreso" ? "positive" : "negative"}>
                        {movement.tipo === "ingreso" ? "+" : "-"}{" "}
                        {Number(movement.importe).toLocaleString("es-AR", {
                          style: "currency",
                          currency: "ARS",
                          maximumFractionDigits: 2
                        })}
                      </td>
                    </tr>
                  ))}

                  {movements.length === 0 && (
                    <tr>
                      <td colSpan="4">Todavía no hay movimientos registrados.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {mostrarNuevaOperacion && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h2>Nueva operación</h2>
                <p>Registrá un ingreso o gasto.</p>

                <div className="form-group">
                  <label>Tipo de operación</label>
                  <select
                    value={nuevaOperacion.tipo}
                    onChange={(e) =>
                      setNuevaOperacion({
                        ...nuevaOperacion,
                        tipo: e.target.value
                      })
                    }
                  >
                    <option value="ingreso">Ingreso</option>
                    <option value="gasto">Gasto</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Descripción</label>
                  <input
                    type="text"
                    value={nuevaOperacion.descripcion}
                    onChange={(e) =>
                      setNuevaOperacion({
                        ...nuevaOperacion,
                        descripcion: e.target.value
                      })
                    }
                    placeholder="Ej. Venta de productos"
                  />
                </div>

                <div className="form-group">
                  <label>Categoría</label>
                  <input
                    type="text"
                    value={nuevaOperacion.categoria}
                    onChange={(e) =>
                      setNuevaOperacion({
                        ...nuevaOperacion,
                        categoria: e.target.value
                      })
                    }
                    placeholder="Ej. Ventas, servicios, alquiler"
                  />
                </div>

                <div className="form-group">
                  <label>Importe</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={nuevaOperacion.importe}
                    onChange={(e) =>
                      setNuevaOperacion({
                        ...nuevaOperacion,
                        importe: e.target.value
                      })
                    }
                    placeholder="0.00"
                  />
                </div>

                <div className="form-group">
                  <label>Fecha</label>
                  <input
                    type="date"
                    value={nuevaOperacion.fecha}
                    onChange={(e) =>
                      setNuevaOperacion({
                        ...nuevaOperacion,
                        fecha: e.target.value
                      })
                    }
                  />
                </div>

                <div className="modal-actions">
                  <button
                    className="back-button"
                    onClick={() => setMostrarNuevaOperacion(false)}
                  >
                    Cancelar
                  </button>

                  <button
                    className="primary-button"
                    onClick={guardarNuevaOperacion}
                  >
                    Guardar operación
                  </button>
                </div>
              </div>
            </div>
          )}

          <footer>© 2026 AdminPro · Sistema de gestión administrativa</footer>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;