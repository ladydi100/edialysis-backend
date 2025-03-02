//const connection = require('../config/db');

/*
const addMedication = (req, res) => {
  const { name, dosage, times, color, notes, alarmEnabled, days } = req.body;

  connection.beginTransaction(err => {
    if (err) { return res.status(500).json({ error: err.message }); }

    connection.query(
      'INSERT INTO medications (name, dosage, color, notes, alarm_enabled, days) VALUES (?, ?, ?, ?, ?, ?)',
      [name, dosage, color, notes, alarmEnabled, JSON.stringify(days)],
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
};*/


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





module.exports = { addMedication };