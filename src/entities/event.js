
export default function Evento(datos) {
  return {
    id: datos.id,
    nombre: datos.name,
    descripcion: datos.description,
    id_categoria_evento: datos.id_event_category,
    id_ubicacion_evento: datos.id_event_location,
    fecha_inicio: datos.start_date,
    duracion_en_minutos: datos.duration_in_minutes,
    precio: datos.price,
    habilitado_para_inscripcion: datos.enabled_for_enrollment,
    maximo_asistencia: datos.max_assistance,
    id_usuario_creador: datos.id_creator_user,
  };
}