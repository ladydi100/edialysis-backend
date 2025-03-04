const jwt = require('jsonwebtoken');
const connection = require('../config/db');
const { SECRET_KEY } = require('../config/auth'); // Importar la clave secreta

const addMedication = (req, res) => {
  const token = req.headers['authorization'];

  console.log('Token recibido:', token);


  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token.replace('Bearer ', ''), SECRET_KEY, { algorithms: ['HS256'] }, (err, decoded) => {
    if (err) {
      console.error('Error al verificar el token:', err);
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = decoded.id;
    const { name, dosage, times, color, notes, alarmEnabled, days } = req.body;

    connection.beginTransaction(err => {
      if (err) { return res.status(500).json({ error: err.message }); }

      connection.query(
        'INSERT INTO medications (name, dosage, color, notes, alarm_enabled, days, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, dosage, color, notes, alarmEnabled, JSON.stringify(days), userId],
        (err, results) => {
          if (err) {
            return connection.rollback(() => {
              res.status(500).json({ error: err.message });
            });
          }

          const medicationId = results.insertId;
          const timesQuery = 'INSERT INTO medication_times (medication_id, time) VALUES ?';
          const timesValues = times.map(time => [medicationId, time]);

          connection.query(timesQuery, [timesValues], (err, results) => {
            if (err) {
              return connection.rollback(() => {
                res.status(500).json({ error: err.message });
              });
            }

            connection.commit(err => {
              if (err) {
                return connection.rollback(() => {
                  res.status(500).json({ error: err.message });
                });
              }

              res.json({ message: 'Medicamento añadido exitosamente' });
            });
          });
        }
      );
    });
  });
};



const moment = require('moment-timezone');
const getMedicationsByDate = (req, res) => {
  const token = req.headers['authorization'];
  const { date } = req.query;

  console.log('Fecha recibida:', date); // Agrega este log

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token.replace('Bearer ', ''), SECRET_KEY, { algorithms: ['HS256'] }, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = decoded.id;

    const localDate = moment.tz(date, 'YYYY-MM-DD', 'UTC'); // Interpretar la fecha en UTC
    const dayOfWeek = localDate.format('dddd'); // Obtener el día de la semana en inglés

    console.log ('localDate',localDate);
    //const dayOfWeek = new Date(date).toLocaleString('en-US', { weekday: 'long' });
    console.log('Día de la semana calculado:', dayOfWeek); // Agrega este log

    const query = `
      SELECT 
      m.id AS medication_id, 
      mt.id AS time_id, 
      m.name, 
      m.dosage, 
      mt.time, 
      mt.taken,
      m.color, 
      m.notes
      FROM medications m
      JOIN medication_times mt ON m.id = mt.medication_id
      WHERE m.user_id = ? AND JSON_CONTAINS(m.days, ?)
    `;

    connection.query(query, [userId, `"${dayOfWeek}"`], (err, results) => {
      if (err) {
        console.error('Error en la consulta SQL:', err); // Agrega este log
        return res.status(500).json({ error: err.message });
      }

      console.log('Resultados de la consulta:', results); // Agrega este log
      res.json(results);
    });
  });
};

const updateMedicationTakenStatus = (req, res) => {
  const token = req.headers['authorization'];
  const { time_id, taken } = req.body;

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token.replace('Bearer ', ''), SECRET_KEY, { algorithms: ['HS256'] }, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = decoded.id;

    // Actualiza el estado `taken` en la base de datos
    const query = 'UPDATE medication_times SET taken = ? WHERE id = ? AND medication_id IN (SELECT id FROM medications WHERE user_id = ?)';
    connection.query(query, [taken, time_id, userId], (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({ error: 'Medication time not found' });
      }

      res.json({ message: 'Medication status updated successfully' });
    });
  });
};






module.exports = { addMedication, getMedicationsByDate, updateMedicationTakenStatus };