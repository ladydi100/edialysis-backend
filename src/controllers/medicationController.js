const connection = require('../config/db');

/*
const addMedication = (req, res) => {
  const { name, dosage, times, color, notes, alarmEnabled, days } = req.body;

  connection.query(
    'INSERT INTO medications (name, dosage, time, color, notes, alarm_enabled, days) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [name, dosage, JSON.stringify(times), color, notes, alarmEnabled, JSON.stringify(days)],
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Medicamento añadido exitosamente' });
    }
  );
};
*/


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
};



module.exports = { addMedication };