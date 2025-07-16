import express from "express";
import cors from "cors";
import eventoRouter from "./src/controllers/event-controller.js";
import usuarioRouter from "./src/controllers/user-controller.js";
import pool from './database/database.js'

const app = express();
const puerto = 3000;

app.use(cors());
app.use(express.json());

app.use('/api/event', eventoRouter);
app.use('/api/user', usuarioRouter);

//Verificar la conexión a pgadmin
app.get("/api/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ connected: true, time: result.rows[0].now });
  } catch (err) {
    console.error("Error de conexión a PostgreSQL:", err);
    res.status(500).json({ connected: false, error: err.message });
  }
});

app.listen(puerto, () => {
  console.log(`Servidor escuchando en http://localhost:${puerto}`);
});
