import pool from '../../database/database.js';  // IMPORTANTE: importás el pool, NO getClient

async function obtenerTodosLosEventos({ pagina = 1, limite = 10, nombre, fechaInicio, etiqueta }) {
  let filtros = [];
  let valores = [];
  let indice = 1;

  if (nombre) {
    filtros.push(`e.name ILIKE '%' || $${indice} || '%'`);
    valores.push(nombre);
    indice++;
  }
  if (fechaInicio) {
    filtros.push(`DATE(e.start_date) = $${indice}`);
    valores.push(fechaInicio);
    indice++;
  }
  if (etiqueta) {
    filtros.push(`t.name ILIKE '%' || $${indice} || '%'`);
    valores.push(etiqueta);
    indice++;
  }

  const clausulaWhere = filtros.length > 0 ? `WHERE ${filtros.join(' AND ')}` : '';
  const desplazamiento = (pagina - 1) * limite;

  valores.push(limite, desplazamiento);

  const sql = `
    SELECT 
      e.id, e.name, e.description, e.start_date, e.duration_in_minutes, e.price, e.enabled_for_enrollment, e.max_assistance,
      json_build_object(
        'id', u.id,
        'first_name', u.first_name,
        'last_name', u.last_name,
        'username', u.username
      ) AS usuario_creador,
      json_build_object(
        'id', el.id,
        'name', el.name,
        'full_address', el.full_address,
        'max_capacity', el.max_capacity,
        'latitude', el.latitude,
        'longitude', el.longitude,
        'location', json_build_object(
          'id', l.id,
          'name', l.name,
          'id_province', l.id_province,
          'latitude', l.latitude,
          'longitude', l.longitude,
          'province', json_build_object(
            'id', p.id,
            'name', p.name,
            'full_name', p.full_name,
            'latitude', p.latitude,
            'longitude', p.longitude,
            'display_order', p.display_order
          )
        )
      ) AS ubicacion_evento,
      COALESCE(json_agg(DISTINCT jsonb_build_object('id', tg.id, 'name', tg.name)) FILTER (WHERE tg.id IS NOT NULL), '[]') AS etiquetas
    FROM events e
    LEFT JOIN users u ON e.id_creator_user = u.id
    LEFT JOIN event_locations el ON e.id_event_location = el.id
    LEFT JOIN locations l ON el.id_location = l.id
    LEFT JOIN provinces p ON l.id_province = p.id
    LEFT JOIN event_tags et ON e.id = et.id_event
    LEFT JOIN tags tg ON et.id_tag = tg.id
    ${clausulaWhere}
    GROUP BY e.id, u.id, el.id, l.id, p.id
    ORDER BY e.start_date ASC
    LIMIT $${indice} OFFSET $${indice + 1}
  `;

  try {
    const resultado = await pool.query(sql, valores);
    return resultado.rows;
  } catch (error) {
    throw error;
  }
}

async function obtenerEventoPorId(id) {
  const sql = `
    SELECT 
      e.id, e.name, e.description, e.start_date, e.duration_in_minutes, e.price, e.enabled_for_enrollment, e.max_assistance,
      json_build_object(
        'id', u.id,
        'first_name', u.first_name,
        'last_name', u.last_name,
        'username', u.username
      ) AS usuario_creador,
      json_build_object(
        'id', el.id,
        'id_location', el.id_location,
        'name', el.name,
        'full_address', el.full_address,
        'max_capacity', el.max_capacity,
        'latitude', el.latitude,
        'longitude', el.longitude,
        'id_creator_user', el.id_creator_user,
        'location', json_build_object(
          'id', l.id,
          'name', l.name,
          'id_province', l.id_province,
          'latitude', l.latitude,
          'longitude', l.longitude,
          'province', json_build_object(
            'id', p.id,
            'name', p.name,
            'full_name', p.full_name,
            'latitude', p.latitude,
            'longitude', p.longitude,
            'display_order', p.display_order
          )
        ),
        'creator_user', json_build_object(
          'id', cu.id,
          'first_name', cu.first_name,
          'last_name', cu.last_name,
          'username', cu.username,
          'password', '******'
        )
      ) AS ubicacion_evento,
      COALESCE(json_agg(DISTINCT jsonb_build_object('id', tg.id, 'name', tg.name)) FILTER (WHERE tg.id IS NOT NULL), '[]') AS etiquetas,
      json_build_object(
        'id', cu2.id,
        'first_name', cu2.first_name,
        'last_name', cu2.last_name,
        'username', cu2.username,
        'password', '******'
      ) AS usuario_creador
    FROM events e
    LEFT JOIN users u ON e.id_creator_user = u.id
    LEFT JOIN event_locations el ON e.id_event_location = el.id
    LEFT JOIN locations l ON el.id_location = l.id
    LEFT JOIN provinces p ON l.id_province = p.id
    LEFT JOIN users cu ON el.id_creator_user = cu.id
    LEFT JOIN event_tags et ON e.id = et.id_event
    LEFT JOIN tags tg ON et.id_tag = tg.id
    LEFT JOIN users cu2 ON e.id_creator_user = cu2.id
    WHERE e.id = $1
    GROUP BY e.id, u.id, el.id, l.id, p.id, cu.id, cu2.id
  `;

  try {
    const resultado = await pool.query(sql, [id]);
    return resultado.rows[0];
  } catch (error) {
    throw error;
  }
}

async function crearEvento(eventoData, usuarioId) {
  const {
    name,
    description,
    start_date,
    duration_in_minutes,
    price,
    enabled_for_enrollment,
    max_assistance,
    id_event_location
  } = eventoData;

  const sql = `
    INSERT INTO events (
      name,
      description,
      start_date,
      duration_in_minutes,
      price,
      enabled_for_enrollment,
      max_assistance,
      id_event_location,
      id_creator_user
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *;
  `;

  const valores = [
    name,
    description,
    start_date,
    duration_in_minutes,
    price,
    enabled_for_enrollment,
    max_assistance,
    id_event_location,
    usuarioId
  ];

  try {
    const resultado = await pool.query(sql, valores);
    return resultado.rows[0];
  } catch (error) {
    throw error;
  }
}

async function actualizarEventoPorId(eventoData, usuarioId) {
  const {
    id,
    name,
    description,
    start_date,
    duration_in_minutes,
    price,
    enabled_for_enrollment,
    max_assistance,
    id_event_location
  } = eventoData;

  const sql = `
    UPDATE events
    SET
      name = $1,
      description = $2,
      start_date = $3,
      duration_in_minutes = $4,
      price = $5,
      enabled_for_enrollment = $6,
      max_assistance = $7,
      id_event_location = $8,
      id_creator_user = $9
    WHERE id = $10
    RETURNING *;
  `;

  const valores = [
    name,
    description,
    start_date,
    duration_in_minutes,
    price,
    enabled_for_enrollment,
    max_assistance,
    id_event_location,
    usuarioId,
    id
  ];

  try {
    const resultado = await pool.query(sql, valores);
    return resultado.rows[0];
  } catch (error) {
    throw error;
  }
}

async function eliminarEvento(eventoId, usuarioId) {
  const sql = `
    DELETE FROM events
    WHERE id = $1 AND id_creator_user = $2
    RETURNING *;
  `;

  try {
    const resultado = await pool.query(sql, [eventoId, usuarioId]);
    return resultado.rows[0];
  } catch (error) {
    throw error;
  }
}

// Y así sucesivamente para las demás funciones...

// Ejemplo con obtenerMaxCapacityEvento:
async function obtenerMaxCapacityEvento(id_event_location) {
  const sql = `
    SELECT max_capacity FROM event_locations WHERE id = $1;
  `;

  try {
    const resultado = await pool.query(sql, [id_event_location]);
    return resultado.rows.length > 0 ? resultado.rows[0].max_capacity : null;
  } catch (error) {
    throw error;
  }
}

// ejemplo para inscribirUsuarioEvento
async function inscribirUsuarioEvento(eventoId, usuarioId) {
  const sql = `
    INSERT INTO event_participants (id_event, id_user)
    VALUES ($1, $2)
    RETURNING *;
  `;

  try {
    const resultado = await pool.query(sql, [eventoId, usuarioId]);
    return resultado.rows[0];
  } catch (error) {
    throw error;
  }
}

export {
  obtenerTodosLosEventos,
  obtenerEventoPorId,
  crearEvento,
  actualizarEventoPorId,
  eliminarEvento,
  obtenerMaxCapacityEvento,
  inscribirUsuarioEvento,
};
