const jwt = require('jsonwebtoken');
const connection = require('../config/db');
const { SECRET_KEY } = require('../config/auth');

const saveAppointment = (req, res) => {
  const token = req.headers['authorization'];
  const { specialty, appointment_date, appointment_time } = req.body;

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token.replace('Bearer ', ''), SECRET_KEY, { algorithms: ['HS256'] }, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = decoded.id;

    connection.query(
      'INSERT INTO medical_appointments (user_id, specialty, appointment_date, appointment_time) VALUES (?, ?, ?, ?)',
      [userId, specialty, appointment_date, appointment_time],
      (err, results) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Cita médica guardada exitosamente' });
      }
    );
  });
};

const getAppointments = (req, res) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token.replace('Bearer ', ''), SECRET_KEY, { algorithms: ['HS256'] }, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = decoded.id;

    connection.query(
      'SELECT id, specialty, appointment_date, appointment_time FROM medical_appointments WHERE user_id = ? ORDER BY appointment_date, appointment_time',
      [userId],
      (err, results) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json(results);
      }
    );
  });
};


const updateAppointment = (req, res) => {
  const token = req.headers['authorization'];
  const { id, specialty, appointment_date, appointment_time } = req.body;

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token.replace('Bearer ', ''), SECRET_KEY, { algorithms: ['HS256'] }, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = decoded.id;

    connection.query(
      'UPDATE medical_appointments SET specialty = ?, appointment_date = ?, appointment_time = ? WHERE id = ? AND user_id = ?',
      [specialty, appointment_date, appointment_time, id, userId],
      (err, results) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        if (results.affectedRows === 0) {
          return res.status(404).json({ error: 'Cita no encontrada o no autorizada' });
        }
        res.json({ message: 'Cita actualizada exitosamente' });
      }
    );
  });
};

const deleteAppointment = (req, res) => {
  const token = req.headers['authorization'];
  const { id } = req.body;

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token.replace('Bearer ', ''), SECRET_KEY, { algorithms: ['HS256'] }, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = decoded.id;

    connection.query(
      'DELETE FROM medical_appointments WHERE id = ? AND user_id = ?',
      [id, userId],
      (err, results) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        if (results.affectedRows === 0) {
          return res.status(404).json({ error: 'Cita no encontrada o no autorizada' });
        }
        res.json({ message: 'Cita eliminada exitosamente' });
      }
    );
  });
};



module.exports = {
  saveAppointment,
  getAppointments,
   updateAppointment,
  deleteAppointment
};