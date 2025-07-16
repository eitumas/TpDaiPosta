import { 
  obtenerTodosLosEventos, 
  obtenerEventoPorId, 
  crearEvento, 
  actualizarEventoPorId,  
  eliminarEvento, 
  inscribirUsuarioEvento, 
  eliminarInscripcion, 
  obtenerParticipantesEvento, 
  obtenerMaxCapacityEvento, 
  obtenerCantidadInscritos, 
  estaUsuarioInscripto 
} from '../repositories/event-repository.js';

async function obtenerTodosLosEventosServicio(parametros) {
  return await obtenerTodosLosEventos(parametros);
}

async function obtenerEventoPorIdServicio(id) {
  return await obtenerEventoPorId(id);
}

async function crearEventoServicio(eventoData, usuarioId) {
  if (!eventoData.name || eventoData.name.length < 3) {
    throw new Error('El campo name está vacío o tiene menos de tres letras.');
  }
  if (!eventoData.description || eventoData.description.length < 3) {
    throw new Error('El campo description está vacío o tiene menos de tres letras.');
  }
  if (eventoData.price < 0) {
    throw new Error('El campo price no puede ser menor que cero.');
  }
  if (eventoData.duration_in_minutes < 0) {
    throw new Error('El campo duration_in_minutes no puede ser menor que cero.');
  }
  if (!eventoData.max_assistance || eventoData.max_assistance < 0) {
    throw new Error('El campo max_assistance es inválido.');
  }
  const maxCapacity = await obtenerMaxCapacityEvento(eventoData.id_event_location);
  if (eventoData.max_assistance > maxCapacity) {
    throw new Error('El max_assistance no puede ser mayor que el max_capacity del id_event_location.');
  }
  return await crearEvento(eventoData, usuarioId);
}

async function actualizarEventoServicio(eventoData, usuarioId) {
  if (!eventoData.id) {
    throw new Error('El id del evento es requerido para actualizar.');
  }
  if (!eventoData.name || eventoData.name.length < 3) {
    throw new Error('El campo name está vacío o tiene menos de tres letras.');
  }
  if (!eventoData.description || eventoData.description.length < 3) {
    throw new Error('El campo description está vacío o tiene menos de tres letras.');
  }
  if (eventoData.price < 0) {
    throw new Error('El campo price no puede ser menor que cero.');
  }
  if (eventoData.duration_in_minutes < 0) {
    throw new Error('El campo duration_in_minutes no puede ser menor que cero.');
  }
  if (!eventoData.max_assistance || eventoData.max_assistance < 0) {
    throw new Error('El campo max_assistance es inválido.');
  }
  const maxCapacity = await obtenerMaxCapacityEvento(eventoData.id_event_location);
  if (eventoData.max_assistance > maxCapacity) {
    throw new Error('El max_assistance no puede ser mayor que el max_capacity del id_event_location.');
  }
  return await actualizarEventoPorId(eventoData, usuarioId);
}

async function eliminarEventoServicio(eventoId, usuarioId) {
  const inscritos = await obtenerCantidadInscritos(eventoId);
  if (inscritos > 0) {
    throw new Error('No se puede eliminar el evento porque tiene usuarios registrados.');
  }
  return await eliminarEvento(eventoId, usuarioId);
}

async function inscribirUsuarioEventoServicio(eventoId, usuarioId) {
  const evento = await obtenerEventoPorId(eventoId);
  if (!evento) {
    throw new Error('Evento no encontrado.');
  }
  const fechaActual = new Date();
  const fechaEvento = new Date(evento.start_date);
  if (fechaEvento <= fechaActual) {
    throw new Error('No se puede inscribir a un evento que ya sucedió o es hoy.');
  }
  if (!evento.enabled_for_enrollment) {
    throw new Error('El evento no está habilitado para inscripción.');
  }
  const inscritos = await obtenerCantidadInscritos(eventoId);
  if (inscritos >= evento.max_assistance) {
    throw new Error('Se excedió la capacidad máxima de inscritos.');
  }
  const yaInscripto = await estaUsuarioInscripto(eventoId, usuarioId);
  if (yaInscripto) {
    throw new Error('El usuario ya está registrado en el evento.');
  }
  return await inscribirUsuarioEvento(eventoId, usuarioId);
}

async function eliminarInscripcionServicio(eventoId, usuarioId) {
  const evento = await obtenerEventoPorId(eventoId);
  if (!evento) {
    throw new Error('Evento no encontrado.');
  }
  const fechaActual = new Date();
  const fechaEvento = new Date(evento.start_date);
  if (fechaEvento <= fechaActual) {
    throw new Error('No se puede eliminar inscripción de un evento que ya sucedió o es hoy.');
  }
  const estaInscripto = await estaUsuarioInscripto(eventoId, usuarioId);
  if (!estaInscripto) {
    throw new Error('El usuario no está registrado en el evento.');
  }
  return await eliminarInscripcion(eventoId, usuarioId);
}

async function obtenerParticipantesEventoServicio(eventoId) {
  return await obtenerParticipantesEvento(eventoId);
}

export {
  obtenerTodosLosEventosServicio,
  obtenerEventoPorIdServicio,
  crearEventoServicio,
  actualizarEventoServicio,
  eliminarEventoServicio,
  inscribirUsuarioEventoServicio,
  eliminarInscripcionServicio,
  obtenerParticipantesEventoServicio,
};
