import pool from '../../database/database.js';

export default class EventRepository {
  async obtenerTodosLosEventos(params = {}) {
    // aceptar ambos nombres de parámetros (español / inglés)
    const { pagina = 1, limite = 10 } = params;
    const nombre = params.nombre ?? params.name;
    const fechaInicio = params.fechaInicio ?? params.startdate ?? params.startDate;
    const etiqueta = params.etiqueta ?? params.tag;

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
      // usar el alias tg (tags) que figura en los JOINs
      filtros.push(`tg.name ILIKE '%' || $${indice} || '%'`);
      valores.push(etiqueta);
      indice++;
    }

    const whereClause = filtros.length > 0 ? `WHERE ${filtros.join(' AND ')}` : '';
    const offset = (pagina - 1) * limite;
    valores.push(limite, offset);

    const sql = `
      SELECT 
        e.id, e.name, e.description, e.start_date, e.duration_in_minutes, e.price, e.enabled_for_enrollment, e.max_assistance,
        json_build_object(
          'id', u.id,
          'first_name', u.first_name,
          'last_name', u.last_name,
          'username', u.username
        ) AS creator_user,
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
        ) AS event_location,
        COALESCE(json_agg(DISTINCT jsonb_build_object('id', tg.id, 'name', tg.name)) FILTER (WHERE tg.id IS NOT NULL), '[]') AS tags
      FROM events e
      LEFT JOIN users u ON e.id_creator_user = u.id
      LEFT JOIN event_locations el ON e.id_event_location = el.id
      LEFT JOIN locations l ON el.id_location = l.id
      LEFT JOIN provinces p ON l.id_province = p.id
      LEFT JOIN event_tags et ON e.id = et.id_event
      LEFT JOIN tags tg ON et.id_tag = tg.id
      ${whereClause}
      GROUP BY e.id, u.id, el.id, l.id, p.id
      ORDER BY e.start_date ASC
      LIMIT $${indice} OFFSET $${indice + 1}
    `;

    const result = await pool.query(sql, valores);
    return result.rows;
  }

  async obtenerEventoPorId(id) {
    const sql = `
      SELECT 
        e.id, e.name, e.description, e.start_date, e.duration_in_minutes, e.price, e.enabled_for_enrollment, e.max_assistance,
        json_build_object(
          'id', u.id,
          'first_name', u.first_name,
          'last_name', u.last_name,
          'username', u.username
        ) AS creator_user,
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
        ) AS event_location,
        COALESCE(json_agg(DISTINCT jsonb_build_object('id', tg.id, 'name', tg.name)) FILTER (WHERE tg.id IS NOT NULL), '[]') AS tags
      FROM events e
      LEFT JOIN users u ON e.id_creator_user = u.id
      LEFT JOIN event_locations el ON e.id_event_location = el.id
      LEFT JOIN locations l ON el.id_location = l.id
      LEFT JOIN provinces p ON l.id_province = p.id
      LEFT JOIN users cu ON el.id_creator_user = cu.id
      LEFT JOIN event_tags et ON e.id = et.id_event
      LEFT JOIN tags tg ON et.id_tag = tg.id
      WHERE e.id = $1
      GROUP BY e.id, u.id, el.id, l.id, p.id, cu.id
    `;
    const result = await pool.query(sql, [id]);
    return result.rows[0];
  }

  async crearEvento(eventoData, usuarioId) {
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
        name, description, start_date, duration_in_minutes,
        price, enabled_for_enrollment, max_assistance, id_event_location, id_creator_user
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *;
    `;

    const values = [
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

    const result = await pool.query(sql, values);
    return result.rows[0];
  }

  async actualizarEvento(eventoData, usuarioId) {
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
      SET name = $1, description = $2, start_date = $3, duration_in_minutes = $4,
          price = $5, enabled_for_enrollment = $6, max_assistance = $7, id_event_location = $8
      WHERE id = $9 AND id_creator_user = $10
      RETURNING *;
    `;

    const values = [
      name,
      description,
      start_date,
      duration_in_minutes,
      price,
      enabled_for_enrollment,
      max_assistance,
      id_event_location,
      id,
      usuarioId
    ];

    const result = await pool.query(sql, values);
    return result.rows[0];
  }

  async eliminarEvento(idEvento, usuarioId) {
    const sql = `
      DELETE FROM events
      WHERE id = $1 AND id_creator_user = $2
      RETURNING *;
    `;
    const result = await pool.query(sql, [idEvento, usuarioId]);
    return result.rows[0];
  }

  async obtenerMaxCapacityEvento(id_event_location) {
    const sql = `SELECT max_capacity FROM event_locations WHERE id = $1;`;
    const result = await pool.query(sql, [id_event_location]);
    return result.rows.length > 0 ? result.rows[0].max_capacity : null;
  }

  async inscribirUsuarioAEvento(eventoId, usuarioId) {
    const sql = `
      INSERT INTO event_enrollments (
        id, id_event, id_user, description, registration_date_time, attended, rating, observations
      ) VALUES (
        (SELECT COALESCE(MAX(id), 0) + 1 FROM event_enrollments),
        $1, $2, '', NOW(), false, NULL, ''
      ) RETURNING *;
    `;
    const result = await pool.query(sql, [eventoId, usuarioId]);
    return result.rows[0];
  }

  async desinscribirUsuarioDeEvento(eventoId, usuarioId) {
    const sql = `
      DELETE FROM event_enrollments
      WHERE id_event = $1 AND id_user = $2
      RETURNING *;
    `;
    const result = await pool.query(sql, [eventoId, usuarioId]);
    return result.rows[0];
  }

  async obtenerInscripcionPorUsuarioYEvento(eventoId, usuarioId) {
    const sql = `
      SELECT * FROM event_enrollments
      WHERE id_event = $1 AND id_user = $2;
    `;
    const result = await pool.query(sql, [eventoId, usuarioId]);
    return result.rows[0];
  }

  async contarInscripcionesEnEvento(eventoId) {
    const sql = `
      SELECT COUNT(*) FROM event_enrollments
      WHERE id_event = $1;
    `;
    const result = await pool.query(sql, [eventoId]);
    return parseInt(result.rows[0].count, 10);
  }

  async obtenerCantidadInscritos(eventoId) {
    const sql = `SELECT COUNT(*)::int AS c FROM event_enrollments WHERE id_event = $1;`;
    const r = await pool.query(sql, [eventoId]);
    return r.rows[0]?.c ?? 0;
  }

  async estaUsuarioInscripto(eventoId, usuarioId) {
    const sql = `SELECT 1 FROM event_enrollments WHERE id_event = $1 AND id_user = $2 LIMIT 1;`;
    const r = await pool.query(sql, [eventoId, usuarioId]);
    return r.rowCount > 0;
  }

  async obtenerParticipantesEvento(eventoId) {
    const sql = `
      SELECT u.id, u.first_name, u.last_name, u.username, ee.registration_date_time, ee.attended, ee.rating
      FROM event_enrollments ee
      JOIN users u ON u.id = ee.id_user
      WHERE ee.id_event = $1
      ORDER BY ee.registration_date_time DESC;
    `;
    const r = await pool.query(sql, [eventoId]);
    return r.rows;
  }
}