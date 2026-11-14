const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

function issueSession(usuario) {
  const publicUser = {
    id: usuario.id,
    nombre: usuario.nombre,
    correo: usuario.correo,
    rol: usuario.rol,
    estado: usuario.estado
  };
  const token = jwt.sign(
    { id: usuario.id, nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  return { mensaje: 'Sesión iniciada correctamente.', token, usuario: publicUser };
}

router.post('/register', async (req, res, next) => {
  try {
    const { nombre, correo, contrasena, rol = 'ESTUDIANTE', codigoLaboratorista } = req.body;
    const nombreLimpio = typeof nombre === 'string' ? nombre.trim() : '';
    const correoLimpio = typeof correo === 'string' ? correo.trim().toLowerCase() : '';
    const rolLimpio = typeof rol === 'string' ? rol.trim().toUpperCase() : '';

    if (nombreLimpio.length < 2 || nombreLimpio.length > 120) {
      return res.status(400).json({ error: 'El nombre debe tener entre 2 y 120 caracteres.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoLimpio) || correoLimpio.length > 120) {
      return res.status(400).json({ error: 'Ingresa un correo electrónico válido.' });
    }
    if (typeof contrasena !== 'string' || contrasena.length < 8 || contrasena.length > 72) {
      return res.status(400).json({ error: 'La contraseña debe tener entre 8 y 72 caracteres.' });
    }
    if (!['ESTUDIANTE', 'LABORATORISTA'].includes(rolLimpio)) {
      return res.status(400).json({ error: 'Selecciona Estudiante o Laboratorista.' });
    }
    if (rolLimpio === 'LABORATORISTA') {
      const inviteCode = process.env.LABORATORISTA_REGISTRATION_CODE;
      if (!inviteCode) {
        return res.status(503).json({ error: 'El registro de laboratoristas no está habilitado en este servidor.' });
      }
      if (typeof codigoLaboratorista !== 'string' || codigoLaboratorista !== inviteCode) {
        return res.status(403).json({ error: 'El código de invitación de laboratorista no es válido.' });
      }
    }

    const [existing] = await pool.execute('SELECT id FROM usuarios WHERE LOWER(correo) = ?', [correoLimpio]);
    if (existing.length) return res.status(409).json({ error: 'Ya existe una cuenta con ese correo.' });

    const passwordHash = await bcrypt.hash(contrasena, 12);
    const [result] = await pool.execute(
      'INSERT INTO usuarios (nombre, correo, contrasena_hash, rol, estado) VALUES (?, ?, ?, ?, \'ACTIVO\')',
      [nombreLimpio, correoLimpio, passwordHash, rolLimpio]
    );
    const user = { id: result.insertId, nombre: nombreLimpio, correo: correoLimpio, rol: rolLimpio, estado: 'ACTIVO' };
    return res.status(201).json(issueSession(user));
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ya existe una cuenta con ese correo.' });
    return next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { correo, contrasena } = req.body;
    const email = typeof correo === 'string' ? correo.trim().toLowerCase() : '';
    if (!email || typeof contrasena !== 'string' || !contrasena) {
      return res.status(400).json({ error: 'Correo y contraseña son obligatorios.' });
    }
    const [rows] = await pool.execute(
      'SELECT id, nombre, correo, contrasena_hash, rol, estado FROM usuarios WHERE LOWER(correo) = ?', [email]
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(contrasena, user.contrasena_hash))) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
    }
    if (user.estado !== 'ACTIVO') return res.status(403).json({ error: 'La cuenta se encuentra inactiva.' });
    return res.json(issueSession(user));
  } catch (error) { return next(error); }
});

router.get('/me', verifyToken, async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT id, nombre, correo, rol, estado FROM usuarios WHERE id = ?', [req.usuario.id]);
    if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado.' });
    return res.json(rows[0]);
  } catch (error) { return next(error); }
});

module.exports = router;
