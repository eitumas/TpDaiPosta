import { AsyncLocalStorage } from 'node:async_hooks';

const almacenamientoLocalAsincrono = new AsyncLocalStorage();

function obtenerContexto() {
  return almacenamientoLocalAsincrono.getStore() || {};
}

function establecerValorEnContexto(clave, valor) {
  const contexto = almacenamientoLocalAsincrono.getStore();
  if (contexto) {
    contexto[clave] = valor;
  }
}

function ejecutarConContexto(contextoInicial, callback) {
  return almacenamientoLocalAsincrono.run(contextoInicial, callback);
}

// Aliases en inglés para compatibilidad con otros módulos del repo
const runWithContext = ejecutarConContexto;
const getContext = obtenerContexto;

export { obtenerContexto, establecerValorEnContexto, ejecutarConContexto, runWithContext, getContext };
export default almacenamientoLocalAsincrono;