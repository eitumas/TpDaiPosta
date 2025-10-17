import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { establecerValorEnContexto } from '../context/context.js';

dotenv.config();

const autenticarToken = (req, res, next) => {
  const encabezadoAutorizacion = req.headers['authorization'];
  const token = encabezadoAutorizacion && encabezadoAutorizacion.split(' ')[1]; 

  if (!token) {
    return res.status(401).json({ exito: false, mensaje: 'Token no proporcionado' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (error, usuario) => {
    if (error) {
      return res.status(401).json({ exito: false, mensaje: 'Token inválido' });
    }
    // mantener en req para compatibilidad con middlewares/handlers que lean req.usuario
    req.usuario = usuario;

    // guardar en el contexto con la clave 'user' (que usan los servicios) y también 'usuario' por compatibilidad
    establecerValorEnContexto('user', usuario);
    establecerValorEnContexto('usuario', usuario);

    next();
  });
};

export default autenticarToken;