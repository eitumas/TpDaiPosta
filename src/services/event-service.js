import EventRepository from '../repositories/event-repository.js';
import { getContext } from '../context/context.js';

const eventRepository = new EventRepository();

async function obtenerTodosLosEventosServicio(parametros) {
  return await eventRepository.obtenerTodosLosEventos(parametros);
}

async function obtenerEventoPorIdServicio(id) {
  return await eventRepository.obtenerEventoPorId(id);
}

async function crearEventoServicio(eventoData) {
  const contexto = getContext();
  const usuarioId = contexto.user?.id;
  if (!usuarioId) {
    throw new Error('No autorizado.');
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
  const maxCapacity = await eventRepository.obtenerMaxCapacityEvento(eventoData.id_event_location);
  if (eventoData.max_assistance > maxCapacity) {
    throw new Error('El max_assistance no puede ser mayor que el max_capacity del id_event_location.');
  }
  return await eventRepository.crearEvento(eventoData, usuarioId);
}

async function actualizarEventoServicio(eventoData) {
  const contexto = getContext();
  const usuarioId = contexto.user?.id;
  if (!usuarioId) {
    throw new Error('No autorizado.');
  }
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
  const maxCapacity = await eventRepository.obtenerMaxCapacityEvento(eventoData.id_event_location);
  if (eventoData.max_assistance > maxCapacity) {
    throw new Error('El max_assistance no puede ser mayor que el max_capacity del id_event_location.');
  }
  return await eventRepository.actualizarEvento(eventoData, usuarioId);
}

async function eliminarEventoServicio(eventoId) {
  const contexto = getContext();
  const usuarioId = contexto.user?.id;
  if (!usuarioId) {
    throw new Error('No autorizado.');
  }
  const inscritos = await eventRepository.obtenerCantidadInscritos(eventoId);
  if (inscritos > 0) {
    throw new Error('No se puede eliminar el evento porque tiene usuarios registrados.');
  }
  return await eventRepository.eliminarEvento(eventoId, usuarioId);
}

async function inscribirUsuarioEventoServicio(eventoId) {
  const contexto = getContext();
  const usuarioId = contexto.user?.id;
  if (!usuarioId) {
    throw new Error('No autorizado.');
  }
  const evento = await eventRepository.obtenerEventoPorId(eventoId);
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
  const inscritos = await eventRepository.obtenerCantidadInscritos(eventoId);
  if (inscritos >= evento.max_assistance) {
    throw new Error('Se excedió la capacidad máxima de inscritos.');
  }
  const yaInscripto = await eventRepository.estaUsuarioInscripto(eventoId, usuarioId);
  if (yaInscripto) {
    throw new Error('El usuario ya está registrado en el evento.');
  }
  return await eventRepository.inscribirUsuarioAEvento(eventoId, usuarioId);
}

async function eliminarInscripcionServicio(eventoId) {
  const contexto = getContext();
  const usuarioId = contexto.user?.id;
  if (!usuarioId) {
    throw new Error('No autorizado.');
  }
  const evento = await eventRepository.obtenerEventoPorId(eventoId);
  if (!evento) {
    throw new Error('Evento no encontrado.');
  }
  const fechaActual = new Date();
  const fechaEvento = new Date(evento.start_date);
  if (fechaEvento <= fechaActual) {
    throw new Error('No se puede eliminar inscripción de un evento que ya sucedió o es hoy.');
  }
  const estaInscripto = await eventRepository.estaUsuarioInscripto(eventoId, usuarioId);
  if (!estaInscripto) {
    throw new Error('El usuario no está registrado en el evento.');
  }
  return await eventRepository.desinscribirUsuarioDeEvento(eventoId, usuarioId);
}

async function obtenerParticipantesEventoServicio(eventoId) {
  return await eventRepository.obtenerParticipantesEvento(eventoId);
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
