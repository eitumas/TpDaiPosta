import { Router } from 'express';
import { obtenerTodosLosEventosServicio, obtenerEventoPorIdServicio, crearEventoServicio, actualizarEventoServicio, eliminarEventoServicio, inscribirUsuarioEventoServicio, eliminarInscripcionServicio, obtenerParticipantesEventoServicio } from '../services/event-service.js';
import autenticarToken from '../middlewares/autentication-middleware.js';

const router = Router();

// Listado de eventos con paginación y filtros
router.get('/', async (req, res) => {
  try {
    const { pagina, limite, nombre, fechaInicio, etiqueta } = req.query;
    const parametros = {
      pagina: pagina ? parseInt(pagina) : 1,
      limite: limite ? parseInt(limite) : 10,
      nombre,
      fechaInicio,
      etiqueta,
    };
    const eventos = await obtenerTodosLosEventosServicio(parametros);
    res.status(200).json({ coleccion: eventos });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener eventos', error: error.message });
  }
});

// Detalle de un evento por id
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const evento = await obtenerEventoPorIdServicio(id);

    if (evento) {
      res.status(200).json(evento);
    } else {
      res.status(404).send('Evento no encontrado');
    }
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener el evento', error: error.message });
  }
});

// Crear un nuevo evento (requiere autenticación)
router.post('/', autenticarToken, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const eventoData = req.body;
    const nuevoEvento = await crearEventoServicio(eventoData, usuarioId);
    res.status(201).json(nuevoEvento);
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
});

// Actualizar un evento existente (requiere autenticación)
router.put('/', autenticarToken, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const eventoData = req.body;
    const eventoActualizado = await actualizarEventoServicio(eventoData, usuarioId);
    if (eventoActualizado) {
      res.status(200).json(eventoActualizado);
    } else {
      res.status(404).json({ mensaje: 'Evento no encontrado o no autorizado' });
    }
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
});

// Eliminar un evento (requiere autenticación)
router.delete('/:id', autenticarToken, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const eventoId = parseInt(req.params.id);
    const eliminado = await eliminarEventoServicio(eventoId, usuarioId);
    if (eliminado) {
      res.status(200).json({ mensaje: 'Evento eliminado correctamente' });
    } else {
      res.status(404).json({ mensaje: 'Evento no encontrado o no autorizado' });
    }
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
});

// Inscripción a un evento (requiere autenticación)
router.post('/:id/enrollment', autenticarToken, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const eventoId = parseInt(req.params.id);
    const inscrito = await inscribirUsuarioEventoServicio(eventoId, usuarioId);
    if (inscrito) {
      res.status(201).json({ mensaje: 'Usuario inscrito correctamente' });
    } else {
      res.status(400).json({ mensaje: 'No se pudo inscribir al usuario' });
    }
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
});

// Eliminar inscripción a un evento (requiere autenticación)
router.delete('/:id/enrollment', autenticarToken, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const eventoId = parseInt(req.params.id);
    const eliminado = await eliminarInscripcionServicio(eventoId, usuarioId);
    if (eliminado) {
      res.status(200).json({ mensaje: 'Inscripción eliminada correctamente' });
    } else {
      res.status(400).json({ mensaje: 'No se pudo eliminar la inscripción' });
    }
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
});

// Listar participantes de un evento (requiere autenticación)
router.get('/:id/participants', autenticarToken, async (req, res) => {
  try {
    const eventoId = parseInt(req.params.id);
    const participantes = await obtenerParticipantesEventoServicio(eventoId);
    res.status(200).json({ coleccion: participantes });
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
});

export default router;
  