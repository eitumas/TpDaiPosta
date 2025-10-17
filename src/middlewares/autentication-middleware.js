import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { establecerValorEnContexto } from '../context/context.js';

dotenv.config();

const autenticarToken = (req, res, next) => {
  const encabezado = (req.headers['authorization'] || '').trim();
  let token = null;

  // Leer header Authorization: "Bearer <token>" (case-insensitive)
  if (encabezado) {
    const parts = encabezado.split(' ');
    if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
      token = parts[1];
    }
  }

  // Opcional (solo para pruebas): permitir token por query string
  if (!token && req.query && (req.query.token || req.query.access_token)) {
    token = req.query.token || req.query.access_token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token no proporcionado', token: '' });
  }

  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET no definido en .env');
    return res.status(500).json({ success: false, message: 'Configuración de servidor inválida', token: '' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload;
    // mantener en el contexto para los servicios
    establecerValorEnContexto('user', payload);
    establecerValorEnContexto('usuario', payload);

    return next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token inválido', token: '' });
  }
};

export default autenticarToken;