const connection = require('../config/db');

const addMedication = (req, res) => {
  const { name, frequency, dosage, time, color, notes, alarmEnabled } = req.body;

  connection.query(
    'INSERT INTO medications (name, frequency, dosage, time, color, notes, alarm_enabled) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [name, frequency, dosage, time, color, notes, alarmEnabled],
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Medicamento añadido exitosamente' });
    }
  );
};

module.exports = { addMedication };