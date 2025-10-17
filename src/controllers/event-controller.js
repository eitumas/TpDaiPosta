import { Router } from 'express';
import {
  obtenerTodosLosEventosServicio,
  obtenerEventoPorIdServicio,
  crearEventoServicio,
  actualizarEventoServicio,
  eliminarEventoServicio,
  inscribirUsuarioEventoServicio,
  eliminarInscripcionServicio,
  obtenerParticipantesEventoServicio
} from '../services/event-service.js';
import autenticarToken from '../middlewares/autentication-middleware.js';

const router = Router();

// Mapea una fila de la BD al formato pedido en la consigna (claves en español)
function mapEventoBDaRespuesta(row) {
  return {
    id: row.id,
    nombre: row.name,
    descripcion: row.description,
    fecha_evento: row.start_date, // formatea aquí si querés otra representación
    duracion_en_minutos: row.duration_in_minutes,
    precio: row.price !== null ? Number(row.price) : null,
    habilitado_para_inscripcion: row.enabled_for_enrollment,
    capacidad: row.max_assistance,
    usuario_creador: row.creator_user || null,
    ubicacion: row.event_location || null,
    tags: row.tags || []
  };
}

router.get('/', async (req, res) => {
  try {
    const { pagina, limite } = req.query;

    // Aceptar tanto parámetros en inglés como en español y normalizar fecha
    const name = req.query.name ?? req.query.nombre ?? undefined;
    const rawStartdate = req.query.startdate ?? req.query.startDate ?? req.query.start_date ?? req.query.fechaInicio ?? undefined;
    const startdate = rawStartdate ? rawStartdate.toString().trim().split('T')[0].slice(0, 10) : undefined;
    const tag = req.query.tag ?? req.query.etiqueta ?? undefined;

    const parametros = {
      pagina: pagina ? parseInt(pagina, 10) : 1,
      limite: limite ? parseInt(limite, 10) : 10,
      name,
      startdate,
      tag
    };

    const eventos = await obtenerTodosLosEventosServicio(parametros);
    const coleccion = eventos.map(mapEventoBDaRespuesta);
    res.status(200).json({ coleccion });
  } catch (error) {
    console.error('Error en GET /api/event', error);
    res.status(500).json({ mensaje: 'Error al obtener eventos', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ mensaje: 'Id inválido. Debe ser numérico.' });
    }

    const evento = await obtenerEventoPorIdServicio(id);

    if (!evento) {
      return res.status(404).json({ mensaje: 'Evento no encontrado' });
    }

    return res.status(200).json(mapEventoBDaRespuesta(evento));
  } catch (error) {
    console.error('Error en GET /api/event/:id', error);
    return res.status(500).json({ mensaje: 'Error al obtener el evento', error: error.message });
  }
});

router.post('/', autenticarToken, async (req, res) => {
  try {
    const eventoData = req.body;
    const nuevoEvento = await crearEventoServicio(eventoData);
    res.status(201).json(nuevoEvento);
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
});

router.put('/', autenticarToken, async (req, res) => {
  try {
    const eventoData = req.body;
    const eventoActualizado = await actualizarEventoServicio(eventoData);
    if (eventoActualizado) {
      res.status(200).json(eventoActualizado);
    } else {
      res.status(404).json({ mensaje: 'Evento no encontrado o no autorizado' });
    }
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
});

router.delete('/:id', autenticarToken, async (req, res) => {
  try {
    const eventoId = parseInt(req.params.id, 10);
    const eliminado = await eliminarEventoServicio(eventoId);
    if (eliminado) {
      res.status(200).json({ mensaje: 'Evento eliminado correctamente' });
    } else {
      res.status(404).json({ mensaje: 'Evento no encontrado o no autorizado' });
    }
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
});

router.post('/:id/enrollment', autenticarToken, async (req, res) => {
  try {
    const eventoId = parseInt(req.params.id, 10);
    const inscrito = await inscribirUsuarioEventoServicio(eventoId);
    if (inscrito) {
      res.status(201).json({ mensaje: 'Usuario inscrito correctamente' });
    } else {
      res.status(400).json({ mensaje: 'No se pudo inscribir al usuario' });
    }
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
});

router.delete('/:id/enrollment', autenticarToken, async (req, res) => {
  try {
    const eventoId = parseInt(req.params.id, 10);
    const eliminado = await eliminarInscripcionServicio(eventoId);
    if (eliminado) {
      res.status(200).json({ mensaje: 'Inscripción eliminada correctamente' });
    } else {
      res.status(400).json({ mensaje: 'No se pudo eliminar la inscripción' });
    }
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
});

router.get('/:id/participants', autenticarToken, async (req, res) => {
  try {
    const eventoId = parseInt(req.params.id, 10);
    const participantes = await obtenerParticipantesEventoServicio(eventoId);
    res.status(200).json({ coleccion: participantes });
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
});

export default router;