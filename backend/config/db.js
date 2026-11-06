
const mysql = require("mysql2");
require("dotenv").config();

const conexion = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 3306
});

conexion.connect((error) => {
  if (error) {
    console.error("Error al conectar con MySQL:", error.message);
    return;
  }

  console.log("¡AdminPro conectado a MySQL correctamente!");
});

module.exports = conexion;
