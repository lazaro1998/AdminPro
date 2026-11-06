
const express = require("express");
const cors = require("cors");
const conexion = require("./config/db");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    mensaje: "¡Servidor AdminPro funcionando correctamente!"
  });
});


// OBTENER MOVIMIENTOS
app.get("/api/movimientos", (req, res) => {
  const sql = `
    SELECT * FROM movimientos
    ORDER BY fecha DESC, id DESC
  `;

  conexion.query(sql, (error, resultados) => {
    if (error) {
      console.error("Error al consultar movimientos:", error);

      return res.status(500).json({
        error: "No se pudieron obtener los movimientos"
      });
    }

    res.json(resultados);
  });
});



 // REGISTRAR MOVIMIENTO
app.post("/api/movimientos", (req, res) => {
  const { descripcion, tipo, categoria, importe, fecha } = req.body;

  if (!descripcion || !descripcion.trim()) {
    return res.status(400).json({
      error: "La descripción es obligatoria"
    });
  }

  if (!["ingreso", "gasto"].includes(tipo)) {
    return res.status(400).json({
      error: "El tipo debe ser ingreso o gasto"
    });
  }

  if (!Number.isFinite(Number(importe)) || Number(importe) <= 0) {
    return res.status(400).json({
      error: "El importe debe ser mayor a cero"
    });
  }

  if (!fecha) {
    return res.status(400).json({
      error: "La fecha es obligatoria"
    });
  }

  const sql = `
    INSERT INTO movimientos
    (descripcion, tipo, categoria, importe, fecha)
    VALUES (?, ?, ?, ?, ?)
  `;

  const valores = [
    descripcion.trim(),
    tipo,
    categoria || null,
    importe,
    fecha
  ];

  conexion.query(sql, valores, (error, resultado) => {
    if (error) {
      console.error("Error al guardar movimiento:", error);

      return res.status(500).json({
        error: "No se pudo guardar el movimiento"
      });
    }

    res.status(201).json({
      mensaje: "Movimiento registrado correctamente",
      id: resultado.insertId
    });
  });
});


 // EDITAR MOVIMIENTO
app.put("/api/movimientos/:id", (req, res) => {
  const { id } = req.params;
  const { descripcion, tipo, categoria, importe, fecha } = req.body;

  if (!descripcion || !descripcion.trim()) {
    return res.status(400).json({
      error: "La descripción es obligatoria"
    });
  }

  if (!["ingreso", "gasto"].includes(tipo)) {
    return res.status(400).json({
      error: "El tipo debe ser ingreso o gasto"
    });
  }

  if (!Number.isFinite(Number(importe)) || Number(importe) <= 0) {
    return res.status(400).json({
      error: "El importe debe ser mayor a cero"
    });
  }

  if (!fecha) {
    return res.status(400).json({
      error: "La fecha es obligatoria"
    });
  }

  const sql = `
    UPDATE movimientos
    SET descripcion = ?, tipo = ?, categoria = ?, importe = ?, fecha = ?
    WHERE id = ?
  `;

  const valores = [
    descripcion.trim(),
    tipo,
    categoria || null,
    importe,
    fecha,
    id
  ];

  conexion.query(sql, valores, (error, resultado) => {
    if (error) {
      console.error("Error al editar movimiento:", error);

      return res.status(500).json({
        error: "No se pudo editar el movimiento"
      });
    }

    if (resultado.affectedRows === 0) {
      return conexion.query(
        "SELECT id FROM movimientos WHERE id = ?",
        [id],
        (errorConsulta, filas) => {
          if (errorConsulta || filas.length === 0) {
            return res.status(404).json({
              error: "Movimiento no encontrado"
            });
          }

          res.json({
            mensaje: "Movimiento actualizado correctamente"
          });
        }
      );
    }

    res.json({
      mensaje: "Movimiento actualizado correctamente"
    });
  });
});


// ELIMINAR MOVIMIENTO
app.delete("/api/movimientos/:id", (req, res) => {
  const { id } = req.params;

  conexion.query(
    "DELETE FROM movimientos WHERE id = ?",
    [id],
    (error, resultado) => {
      if (error) {
        console.error("Error al eliminar movimiento:", error);

        return res.status(500).json({
          error: "No se pudo eliminar el movimiento"
        });
      }

      if (resultado.affectedRows === 0) {
        return res.status(404).json({
          error: "Movimiento no encontrado"
        });
      }

      res.json({
        mensaje: "Movimiento eliminado correctamente"
      });
    }
  );
});

// REGISTRAR COBRO
app.post("/api/cobros", (req, res) => {
  const { factura_id, importe, fecha, metodo_pago, observaciones } = req.body;

  const monto = Number(importe);

  if (
    !Number.isInteger(Number(factura_id)) ||
    Number(factura_id) <= 0 ||
    !Number.isFinite(monto) ||
    monto <= 0 ||
    !fecha
  ) {
    return res.status(400).json({
      error: "Completá correctamente la factura, el importe y la fecha"
    });
  }

  conexion.beginTransaction((error) => {
    if (error) {
      return res.status(500).json({
        error: "No se pudo iniciar el cobro"
      });
    }

    conexion.query(
      "SELECT id, total FROM facturas WHERE id = ? FOR UPDATE",
      [factura_id],
      (error, facturas) => {
        if (error || facturas.length === 0) {
          return conexion.rollback(() => {
            res.status(error ? 500 : 404).json({
              error: error
                ? "No se pudo consultar la factura"
                : "Factura no encontrada"
            });
          });
        }

        conexion.query(
          "SELECT COALESCE(SUM(importe), 0) AS cobrado FROM cobros WHERE factura_id = ?",
          [factura_id],
          (error, resultados) => {
            if (error) {
              return conexion.rollback(() => {
                res.status(500).json({
                  error: "No se pudo calcular el saldo pendiente"
                });
              });
            }

            const totalCentavos = Math.round(Number(facturas[0].total) * 100);
            const cobradoCentavos = Math.round(Number(resultados[0].cobrado) * 100);
            const montoCentavos = Math.round(monto * 100);
            const pendienteCentavos = totalCentavos - cobradoCentavos;

            if (
              montoCentavos <= 0 ||
              montoCentavos > pendienteCentavos ||
              Math.abs(monto * 100 - montoCentavos) > 0.000001
            ) {
              return conexion.rollback(() => {
                res.status(400).json({
                  error: "El importe debe ser positivo, tener hasta dos decimales y no superar el saldo pendiente"
                });
              });
            }

            const sql = `
              INSERT INTO cobros
              (factura_id, importe, fecha, metodo_pago, observaciones)
              VALUES (?, ?, ?, ?, ?)
            `;

            conexion.query(
              sql,
              [
                factura_id,
                montoCentavos / 100,
                fecha,
                metodo_pago || null,
                observaciones || null
              ],
              (error, resultado) => {
                if (error) {
                  return conexion.rollback(() => {
                    res.status(500).json({
                      error: "No se pudo registrar el cobro"
                    });
                  });
                }

                const nuevoEstado =
                  montoCentavos === pendienteCentavos
                    ? "pagada"
                    : "pendiente";

                conexion.query(
                  "UPDATE facturas SET estado = ? WHERE id = ?",
                  [nuevoEstado, factura_id],
                  (error) => {
                    if (error) {
                      return conexion.rollback(() => {
                        res.status(500).json({
                          error: "No se pudo actualizar la factura"
                        });
                      });
                    }

                    conexion.commit((error) => {
                      if (error) {
                        return conexion.rollback(() => {
                          res.status(500).json({
                            error: "No se pudo confirmar el cobro"
                          });
                        });
                      }

                      res.status(201).json({
                        mensaje: "Cobro registrado correctamente",
                        id: resultado.insertId,
                        estado: nuevoEstado,
                        saldo_pendiente:
                          (pendienteCentavos - montoCentavos) / 100
                      });
                    });
                  }
                );
              }
            );
          }
        );
      }
    );
  });
});

// REGISTRAR PAGO
app.post("/api/pagos", (req, res) => {
  const {
    descripcion,
    proveedor,
    importe,
    fecha,
    metodo_pago,
    categoria,
    observaciones
  } = req.body;

  const monto = Number(importe);

  if (
    !descripcion ||
    !descripcion.trim() ||
    !Number.isFinite(monto) ||
    monto <= 0 ||
    !fecha
  ) {
    return res.status(400).json({
      error: "Completá correctamente la descripción, el importe y la fecha"
    });
  }

  const sql = `
    INSERT INTO pagos
    (descripcion, proveedor, importe, fecha, metodo_pago, categoria, observaciones)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  const valores = [
    descripcion.trim(),
    proveedor || null,
    monto,
    fecha,
    metodo_pago || null,
    categoria || null,
    observaciones || null
  ];

  conexion.query(sql, valores, (error, resultado) => {
    if (error) {
      console.error("Error al registrar pago:", error);

      return res.status(500).json({
        error: "No se pudo registrar el pago"
      });
    }

    res.status(201).json({
      mensaje: "Pago registrado correctamente",
      id: resultado.insertId
    });
  });
});



// OBTENER PAGOS
app.get("/api/pagos", (req, res) => {
  const sql = `
    SELECT *
    FROM pagos
    ORDER BY fecha DESC, id DESC
  `;

  conexion.query(sql, (error, resultados) => {
    if (error) {
      console.error("Error al consultar pagos:", error);

      return res.status(500).json({
        error: "No se pudieron obtener los pagos"
      });
    }

    res.json(resultados);
  });
});


// OBTENER COBROS
app.get("/api/cobros", (req, res) => {
  const sql = `
    SELECT
      co.*,
      f.numero AS factura_numero,
      c.nombre AS cliente_nombre,
      f.total AS factura_total,
      COALESCE(
        (SELECT SUM(c2.importe)
         FROM cobros c2
         WHERE c2.factura_id = f.id), 0
      ) AS total_cobrado
    FROM cobros co
    INNER JOIN facturas f ON co.factura_id = f.id
    INNER JOIN clientes c ON f.cliente_id = c.id
    ORDER BY co.fecha DESC, co.id DESC
  `;

  conexion.query(sql, (error, resultados) => {
    if (error) {
      console.error("Error al consultar cobros:", error);
      return res.status(500).json({
        error: "No se pudieron obtener los cobros"
      });
    }

    res.json(resultados);
  });
});


 // OBTENER FACTURAS
app.get("/api/facturas", (req, res) => {
  const sql = `
    SELECT
      f.*,
      c.nombre AS cliente_nombre
    FROM facturas f
    INNER JOIN clientes c ON f.cliente_id = c.id
    ORDER BY f.id DESC
  `;

  conexion.query(sql, (error, resultados) => {
    if (error) {
      console.error("Error al consultar facturas:", error);

      return res.status(500).json({
        error: "No se pudieron obtener las facturas"
      });
    }

    res.json(resultados);
  });
});



 // OBTENER DETALLE DE UNA FACTURA
app.get("/api/facturas/:id", (req, res) => {
  const facturaId = req.params.id;

  const sql = `
    SELECT
      f.*,
      c.nombre AS cliente_nombre,
      d.id AS detalle_id,
      d.descripcion,
      d.cantidad,
      d.precio_unitario,
      d.subtotal AS detalle_subtotal
    FROM facturas f
    INNER JOIN clientes c ON f.cliente_id = c.id
    LEFT JOIN factura_detalles d ON f.id = d.factura_id
    WHERE f.id = ?
  `;

  conexion.query(sql, [facturaId], (error, resultados) => {
    if (error) {
      console.error("Error al consultar factura:", error);
      return res.status(500).json({
        error: "No se pudo consultar la factura"
      });
    }

    if (resultados.length === 0) {
      return res.status(404).json({
        error: "Factura no encontrada"
      });
    }

    const factura = {
      id: resultados[0].id,
      numero: resultados[0].numero,
      cliente_nombre: resultados[0].cliente_nombre,
      fecha: resultados[0].fecha,
      fecha_vencimiento: resultados[0].fecha_vencimiento,
      total: resultados[0].total,
      estado: resultados[0].estado,
      detalles: resultados
        .filter((fila) => fila.detalle_id !== null)
        .map((fila) => ({
          descripcion: fila.descripcion,
          cantidad: fila.cantidad,
          precio_unitario: fila.precio_unitario,
          subtotal: fila.detalle_subtotal
        }))
    };

    res.json(factura);
  });
});


 // ACTUALIZAR ESTADO DE FACTURA
app.put("/api/facturas/:id/estado", (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  if (!["pendiente", "pagada", "vencida"].includes(estado)) {
    return res.status(400).json({
      error: "Estado de factura no válido"
    });
  }

  const sql = `
    UPDATE facturas
    SET estado = ?
    WHERE id = ?
  `;

  conexion.query(sql, [estado, id], (error, resultado) => {
    if (error) {
      console.error("Error al actualizar factura:", error);

      return res.status(500).json({
        error: "No se pudo actualizar la factura"
      });
    }

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        error: "Factura no encontrada"
      });
    }

    res.json({
      mensaje: "Estado de factura actualizado correctamente"
    });
  });
});


// ELIMINAR FACTURA
app.delete("/api/facturas/:id", (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM facturas WHERE id = ?";

  conexion.query(sql, [id], (error, resultado) => {
    if (error) {
      console.error("Error al eliminar factura:", error);

      return res.status(500).json({
        error: "No se pudo eliminar la factura"
      });
    }

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        error: "Factura no encontrada"
      });
    }

    res.json({
      mensaje: "Factura eliminada correctamente"
    });
  });
});




// RESUMEN FINANCIERO

app.get("/api/estadisticas", (req, res) => {
  const { desde, hasta } = req.query;

  let condiciones = [];
  let parametros = [];

  if (desde) {
    condiciones.push("fecha >= ?");
    parametros.push(desde);
  }

  if (hasta) {
    condiciones.push("fecha <= ?");
    parametros.push(hasta);
  }

  const where = condiciones.length
    ? `WHERE ${condiciones.join(" AND ")}`
    : "";

  const sql = `
    SELECT
      COALESCE(SUM(CASE
        WHEN tipo = 'ingreso' THEN importe
        ELSE 0
      END), 0) AS ingresos,

      COALESCE(SUM(CASE
        WHEN tipo = 'gasto' THEN importe
        ELSE 0
      END), 0) AS gastos

    FROM movimientos
    ${where}
  `;

  conexion.query(sql, parametros, (error, resultados) => {
    if (error) {
      console.error("Error al calcular estadísticas:", error);

      return res.status(500).json({
        error: "No se pudieron calcular las estadísticas"
      });
    }

    const ingresos = Number(resultados[0].ingresos);
    const gastos = Number(resultados[0].gastos);

    res.json({
      ingresos,
      gastos,
      saldo: ingresos - gastos
    });
  });
});



// DATOS MENSUALES PARA EL GRÁFICO
app.get("/api/movimientos/mensuales", (req, res) => {
  const { desde, hasta } = req.query;

  let condiciones = [];
  let parametros = [];

  if (desde) {
    condiciones.push("fecha >= ?");
    parametros.push(desde);
  }

  if (hasta) {
    condiciones.push("fecha <= ?");
    parametros.push(hasta);
  }

  if (!desde && !hasta) {
    condiciones.push("YEAR(fecha) = YEAR(CURDATE())");
  }

  const where = condiciones.length
    ? `WHERE ${condiciones.join(" AND ")}`
    : "";

  const sql = `
    SELECT
      MONTH(fecha) AS mes,
      YEAR(fecha) AS anio,
      SUM(CASE
        WHEN tipo = 'ingreso' THEN importe
        ELSE 0
      END) AS ingresos,
      SUM(CASE
        WHEN tipo = 'gasto' THEN importe
        ELSE 0
      END) AS gastos
    FROM movimientos
    ${where}
    GROUP BY YEAR(fecha), MONTH(fecha)
    ORDER BY anio, mes
  `;

  conexion.query(sql, parametros, (error, resultados) => {
    if (error) {
      console.error("Error al consultar movimientos mensuales:", error);

      return res.status(500).json({
        error: "No se pudieron obtener los datos mensuales"
      });
    }

    res.json(resultados);
  });
});






app.get("/api/clientes", (req, res) => {
  conexion.query("SELECT * FROM clientes ORDER BY id DESC", (error, resultados) => {
    if (error) {
      console.error("Error al consultar clientes:", error);
      return res.status(500).json({ error: "Error al obtener clientes" });
    }

    res.json(resultados);
  });
});


app.post("/api/clientes", (req, res) => {
  const { nombre, documento, telefono, email, direccion } = req.body;

  if (!nombre || !nombre.trim()) {
    return res.status(400).json({
      error: "El nombre del cliente es obligatorio"
    });
  }

  const sql = `
    INSERT INTO clientes (nombre, documento, telefono, email, direccion)
    VALUES (?, ?, ?, ?, ?)
  `;

  const valores = [
    nombre.trim(),
    documento || null,
    telefono || null,
    email || null,
    direccion || null
  ];

  conexion.query(sql, valores, (error, resultado) => {
    if (error) {
      console.error("Error al guardar cliente:", error);
      return res.status(500).json({
        error: "No se pudo guardar el cliente"
      });
    }

    res.status(201).json({
      mensaje: "Cliente registrado correctamente",
      id: resultado.insertId
    });
  });
});



// EDITAR CLIENTE
app.put("/api/clientes/:id", (req, res) => {
  const { id } = req.params;
  const { nombre, documento, telefono, email, direccion } = req.body;

  if (!nombre || !nombre.trim()) {
    return res.status(400).json({
      error: "El nombre del cliente es obligatorio"
    });
  }

  const sql = `
    UPDATE clientes
    SET nombre = ?, documento = ?, telefono = ?, email = ?, direccion = ?
    WHERE id = ?
  `;

  const valores = [
    nombre.trim(),
    documento || null,
    telefono || null,
    email || null,
    direccion || null,
    id
  ];

  conexion.query(sql, valores, (error, resultado) => {
    if (error) {
      console.error("Error al editar cliente:", error);
      return res.status(500).json({
        error: "No se pudo editar el cliente"
      });
    }

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        error: "No se encontró el cliente"
      });
    }

    res.json({
      mensaje: "Cliente actualizado correctamente"
    });
  });
});


// REGISTRAR FACTURA
app.post("/api/facturas", (req, res) => {
  const {
    cliente_id,
    numero,
    fecha,
    fecha_vencimiento,
    detalles
  } = req.body;

  if (!cliente_id || !numero || !fecha || !detalles || detalles.length === 0) {
    return res.status(400).json({
      error: "Faltan datos para registrar la factura"
    });
  }

  const subtotal = detalles.reduce((total, detalle) => {
    return total + Number(detalle.cantidad) * Number(detalle.precio_unitario);
  }, 0);

  conexion.beginTransaction((error) => {
    if (error) {
      return res.status(500).json({
        error: "No se pudo iniciar el registro de la factura"
      });
    }

    const sqlFactura = `
      INSERT INTO facturas
      (cliente_id, numero, fecha, fecha_vencimiento, subtotal, total)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    conexion.query(
      sqlFactura,
      [
        cliente_id,
        numero,
        fecha,
        fecha_vencimiento || null,
        subtotal,
        subtotal
      ],
      (error, resultado) => {
        if (error) {
          return conexion.rollback(() => {
            console.error("Error al guardar factura:", error);
            res.status(500).json({
              error: "No se pudo guardar la factura"
            });
          });
        }

        const facturaId = resultado.insertId;

        const guardarDetalle = (indice) => {
          if (indice >= detalles.length) {
            return conexion.commit((error) => {
              if (error) {
                return conexion.rollback(() => {
                  res.status(500).json({
                    error: "No se pudo confirmar la factura"
                  });
                });
              }

              res.status(201).json({
                mensaje: "Factura registrada correctamente",
                id: facturaId
              });
            });
          }

          const detalle = detalles[indice];
          const detalleSubtotal =
            Number(detalle.cantidad) * Number(detalle.precio_unitario);

          const sqlDetalle = `
            INSERT INTO factura_detalles
            (factura_id, descripcion, cantidad, precio_unitario, subtotal)
            VALUES (?, ?, ?, ?, ?)
          `;

          conexion.query(
            sqlDetalle,
            [
              facturaId,
              detalle.descripcion,
              detalle.cantidad,
              detalle.precio_unitario,
              detalleSubtotal
            ],
            (error) => {
              if (error) {
                return conexion.rollback(() => {
                  console.error("Error al guardar detalle:", error);
                  res.status(500).json({
                    error: "No se pudieron guardar los detalles"
                  });
                });
              }

              guardarDetalle(indice + 1);
            }
          );
        };

        guardarDetalle(0);
      }
    );
  });
});


// ELIMINAR CLIENTE
app.delete("/api/clientes/:id", (req, res) => {
  const { id } = req.params;

  conexion.query(
    "DELETE FROM clientes WHERE id = ?",
    [id],
    (error, resultado) => {
      if (error) {
  console.error("Error al eliminar cliente:", error);

  if (error.code === "ER_ROW_IS_REFERENCED_2") {
    return res.status(409).json({
      error: "No se puede eliminar este cliente porque tiene facturas asociadas."
    });
  }

  return res.status(500).json({
    error: "No se pudo eliminar el cliente"
  });
}

      if (resultado.affectedRows === 0) {
        return res.status(404).json({
          error: "Cliente no encontrado"
        });
      }

      res.json({
        mensaje: "Cliente eliminado correctamente"
      });
    }
  );
});

// OBTENER CONFIGURACIÓN DE LA EMPRESA
app.get("/api/configuracion", (req, res) => {
  conexion.query(
    "SELECT * FROM configuracion WHERE id = 1",
    (error, resultados) => {
      if (error) {
        console.error("Error al consultar configuración:", error);
        return res.status(500).json({
          error: "No se pudo obtener la configuración"
        });
      }

      res.json(resultados[0] || {});
    }
  );
});

// GUARDAR CONFIGURACIÓN DE LA EMPRESA
app.put("/api/configuracion", (req, res) => {
  const {
    nombre_empresa,
    cuit,
    telefono,
    email,
    direccion
  } = req.body;

  if (!nombre_empresa || !nombre_empresa.trim()) {
    return res.status(400).json({
      error: "El nombre de la empresa es obligatorio"
    });
  }

  const sql = `
    UPDATE configuracion
    SET nombre_empresa = ?,
        cuit = ?,
        telefono = ?,
        email = ?,
        direccion = ?
    WHERE id = 1
  `;

  const valores = [
    nombre_empresa.trim(),
    cuit || null,
    telefono || null,
    email || null,
    direccion || null
  ];

  conexion.query(sql, valores, (error) => {
    if (error) {
      console.error("Error al guardar configuración:", error);
      return res.status(500).json({
        error: "No se pudo guardar la configuración"
      });
    }

    res.json({
      mensaje: "Configuración guardada correctamente"
    });
  });
});

// RESUMEN RÁPIDO DEL DASHBOARD
app.get("/api/resumen-rapido", (req, res) => {
  const sql = `
    SELECT
      (SELECT COUNT(*) FROM facturas) AS facturas_emitidas,
      (SELECT COUNT(*) FROM facturas
       WHERE estado = 'pendiente') AS facturas_pendientes,
      (SELECT COUNT(*) FROM pagos) AS pagos_registrados,
      (SELECT COUNT(*) FROM clientes) AS clientes_registrados
  `;

  conexion.query(sql, (error, resultados) => {
    if (error) {
      console.error("Error al obtener resumen rápido:", error);

      return res.status(500).json({
        error: "No se pudo obtener el resumen rápido"
      });
    }

    res.json(resultados[0]);
  });
});


app.listen(PORT, () => {
  console.log(`Servidor AdminPro iniciado en http://localhost:${PORT}`);
});
