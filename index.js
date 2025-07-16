import express from "express";
import cors from "cors";
import eventoRouter from "./src/controllers/event-controller.js";
import usuarioRouter from "./src/controllers/user-controller.js";

const app = express();
const puerto = 3000;

app.use(cors());
app.use(express.json());

app.use('/api/event', eventoRouter);
app.use('/api/user', usuarioRouter);

app.listen(puerto, () => {
  console.log(`Servidor escuchando en http://localhost:${puerto}`);
});
