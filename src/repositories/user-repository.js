import pool from '../../database/database.js';

async function obtenerUsuarioPorNombreDeUsuario(nombreUsuario) {
  const sql = 'SELECT * FROM users WHERE username = $1';
  const valores = [nombreUsuario];
  try {
    const resultado = await pool.query(sql, valores);
    return resultado.rows[0];
  } catch (error) {
    throw error;
  }
}

async function crearUsuario(usuario) {
  const sql = `
    INSERT INTO users (first_name, last_name, username, password)
    VALUES ($1, $2, $3, $4)
    RETURNING id, first_name, last_name, username
  `;
  const valores = [usuario.first_name, usuario.last_name, usuario.username, usuario.password];

  try {
    const resultado = await pool.query(sql, valores);
    return resultado.rows[0];
  } catch (error) {
    throw error;
  }
}

export { obtenerUsuarioPorNombreDeUsuario, crearUsuario };
