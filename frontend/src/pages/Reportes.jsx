import { useEffect, useState } from "react";
import { BarChart3, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { notificar } from "../utils/notificaciones";

const API = "http://localhost:3001/api";

function Reportes({ onNavigate }) {
  const [estadisticas, setEstadisticas] = useState({
    ingresos: 0,
    gastos: 0,
    saldo: 0
  });

  const [movimientosMensuales, setMovimientosMensuales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [periodo, setPeriodo] = useState("mes");

  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  useEffect(() => {
    async function cargarReportes() {
      setCargando(true);

      try {
        let desde = fechaDesde;
        let hasta = fechaHasta;

        if (periodo === "mes") {
          const hoy = new Date();
          desde = new Date(
            hoy.getFullYear(),
            hoy.getMonth(),
            1
          ).toLocaleDateString("en-CA");

          hasta = hoy.toLocaleDateString("en-CA");
        }

        if (periodo === "3meses" || periodo === "6meses") {
          const hoy = new Date();
          const meses = periodo === "3meses" ? 3 : 6;

          const inicio = new Date(
            hoy.getFullYear(),
            hoy.getMonth() - meses + 1,
            1
          );

          desde = inicio.toLocaleDateString("en-CA");
          hasta = hoy.toLocaleDateString("en-CA");
        }

        if (periodo === "anio") {
          const hoy = new Date();
          desde = `${hoy.getFullYear()}-01-01`;
          hasta = hoy.toLocaleDateString("en-CA");
        }

        const parametros = new URLSearchParams();

        if (desde) parametros.set("desde", desde);
        if (hasta) parametros.set("hasta", hasta);

        const [respuestaEstadisticas, respuestaMensual] =
          await Promise.all([
            fetch(`${API}/estadisticas?${parametros.toString()}`),
            fetch(`${API}/movimientos/mensuales?${parametros.toString()}`)
          ]);

        if (!respuestaEstadisticas.ok || !respuestaMensual.ok) {
          throw new Error("No se pudieron cargar los reportes");
        }

        const datosEstadisticas = await respuestaEstadisticas.json();
        const datosMensuales = await respuestaMensual.json();

        setEstadisticas(datosEstadisticas);
        setMovimientosMensuales(datosMensuales);

      } catch (error) {
        console.error("Error al cargar reportes:", error);
        notificar(error.message, "error");
      } finally {
        setCargando(false);
      }
    }

    cargarReportes();
  }, [periodo, fechaDesde, fechaHasta]);

  const dinero = (valor) =>
    Number(valor).toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 2
    });

  if (cargando) {
    return <p>Cargando reportes...</p>;
  }

  return (
    <div className="reportes-page">
      <div className="page-header">
        <div>
          <h1>Reportes</h1>
          <p>Analizá el rendimiento financiero de tu negocio.</p>
        </div>

        <button
          className="back-button"
          onClick={() => onNavigate("dashboard")}
        >
          ← Volver
        </button>
      </div>

      <div className="reportes-filtros">
        <label>Período:</label>

        <select
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value)}
        >
          <option value="mes">Este mes</option>
          <option value="3meses">Últimos 3 meses</option>
          <option value="6meses">Últimos 6 meses</option>
          <option value="anio">Este año</option>
          <option value="personalizado">Personalizado</option>
        </select>

        {periodo === "personalizado" && (
          <>
            <label>Desde:</label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
            />

            <label>Hasta:</label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
            />
          </>
        )}
      </div>

      <div className="reportes-resumen">
        <div className="reportes-card">
          <TrendingUp />
          <span>Ingresos totales</span>
          <h2>{dinero(estadisticas.ingresos)}</h2>
        </div>

        <div className="reportes-card">
          <TrendingDown />
          <span>Gastos totales</span>
          <h2>{dinero(estadisticas.gastos)}</h2>
        </div>

        <div className="reportes-card">
          <Wallet />
          <span>Saldo disponible</span>
          <h2>{dinero(estadisticas.saldo)}</h2>
        </div>
      </div>

      <section className="reportes-panel">
        <div className="reportes-panel-header">
          <div>
            <h2>
              <BarChart3 size={20} />
              Ingresos y gastos mensuales
            </h2>
            <p>Comparación de movimientos durante el año.</p>
          </div>
        </div>

        <div className="reportes-grafico">
          {Array.from({ length: 12 }, (_, index) => {
            const dato = movimientosMensuales.find(
              item => Number(item.mes) === index + 1
            );

            const ingresos = Number(dato?.ingresos || 0);
            const gastos = Number(dato?.gastos || 0);

            const maximo = Math.max(
              1,
              ...movimientosMensuales.flatMap(item => [
                Number(item.ingresos || 0),
                Number(item.gastos || 0)
              ])
            );

            return (
              <div className="reportes-mes" key={index}>
                <div className="reportes-barras">
                  <div
                    className="reportes-barra ingresos"
                    style={{ height: `${(ingresos / maximo) * 100}%` }}
                    title={`Ingresos: ${dinero(ingresos)}`}
                  />

                  <div
                    className="reportes-barra gastos"
                    style={{ height: `${(gastos / maximo) * 100}%` }}
                    title={`Gastos: ${dinero(gastos)}`}
                  />
                </div>

                <span>
                  {[
                    "ENE", "FEB", "MAR", "ABR", "MAY", "JUN",
                    "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"
                  ][index]}
                </span>
              </div>
            );
          })}
        </div>

        <div className="reportes-leyenda">
          <span><i className="leyenda-ingresos" /> Ingresos</span>
          <span><i className="leyenda-gastos" /> Gastos</span>
        </div>
      </section>
    </div>
  );
}

export default Reportes;
