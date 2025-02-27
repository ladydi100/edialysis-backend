const connection = require('../config/db');

const addMedication = (req, res) => {
  const { name, startDate, endDate, dosage, times, color, notes, alarmEnabled } = req.body;

  connection.beginTransaction(err => {
    if (err) { return res.status(500).json({ error: err.message }); }

    connection.query(
      'INSERT INTO medications (name, start_date, end_date, dosage, color, notes, alarm_enabled) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, startDate, endDate, dosage, color, notes, alarmEnabled],
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