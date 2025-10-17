import express from "express";
import cors from "cors";
import eventoRouter from "./src/controllers/event-controller.js";
import usuarioRouter from "./src/controllers/user-controller.js";
import pool from './database/database.js'
import requestContext from './src/middlewares/context-middleware.js'
import Autentication from './src/middlewares/autentication-middleware.js'


const app = express();
const puerto = 3000;

app.use(cors());
app.use(express.json());
app.use(requestContext);

app.use('/api/event', eventoRouter);



app.use('/api/user', usuarioRouter);

app.get('/', (req, res) => {
  res.send('Bienvenido a la API de TpDaiPosta. Usa /api/event o /api/user para acceder a los recursos.');
});

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
