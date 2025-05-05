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

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token.replace('Bearer ', ''), SECRET_KEY, { algorithms: ['HS256'] }, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = decoded.id;
    const queryDate = new Date(date);
    //const dayOfWeek = queryDate.toLocaleString('en-US', { weekday: 'long' });
    // Asegurarnos que la fecha se interpreta correctamente
    const adjustedDate = new Date(queryDate.getTime() + queryDate.getTimezoneOffset() * 60000);
    
    // Obtener el día de la semana en inglés (como está guardado en la BD)
    const dayOfWeek = adjustedDate.toLocaleString('en-US', { weekday: 'long', timeZone: 'UTC' });

    console.log(`Buscando medicamentos para ${date} (día: ${dayOfWeek})`);

 const query = `
  SELECT 
    m.id AS medication_id,
    mt.id AS time_id,
    m.name,
    m.dosage,
    TIME(mt.time) AS time,
    m.color,
    m.notes,
    COALESCE(mi.taken, 0) AS taken,
    mt.active,
    m.alarm_enabled
  FROM medications m
  JOIN medication_times mt ON m.id = mt.medication_id
  LEFT JOIN medication_intakes mi ON mt.id = mi.time_id AND mi.date = ?
  WHERE m.user_id = ?
    AND (
      (mt.active = 1 AND JSON_CONTAINS(m.days, ?)) OR  -- Solo activos
      (mi.taken = 1)  -- O tomados (aunque inactivos)
    )
    AND ? >= DATE(m.created_at)
`;


console.log('Ejecutando query:', query.replace(/\n/g, ' '));
console.log('Parámetros:', [date, userId, `"${dayOfWeek}"`, date]);

    connection.query(query, [date, userId, `"${dayOfWeek}"`, date], (err, results) => {
      if (err) {
        console.error('Error en la consulta SQL:', err);
        return res.status(500).json({ error: err.message });
      }

      console.log(`Medicamentos encontrados: ${results.length}`);
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




// Agrega esta función al medicationController.js
const recordMedicationTaken = async (req, res) => {
  const token = req.headers['authorization'];
  const { time_id, date, taken } = req.body;

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token.replace('Bearer ', ''), SECRET_KEY, { algorithms: ['HS256'] }, async (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = decoded.id;

    try {

    console.log("Fecha recibida:", date); // Para depuración

      // Verificar que el medicamento pertenece al usuario
      const verificationQuery = `
        SELECT mt.id 
        FROM medication_times mt
        JOIN medications m ON mt.medication_id = m.id
        WHERE mt.id = ? AND m.user_id = ?
      `;
      const [results] = await connection.promise().query(verificationQuery, [time_id, userId]);

      if (results.length === 0) {
        return res.status(404).json({ error: 'Medication time not found' });
      }


      // Validar formato de fecha (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Formato de fecha inválido' });
    }


      // Insertar o actualizar el registro de toma
       const upsertQuery = `
      INSERT INTO medication_intakes (time_id, date, taken)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE taken = ?
    `;
      
      await connection.promise().query(upsertQuery, [time_id, date, taken, taken]);

      res.json({ message: 'Medication intake recorded successfully' });
    } catch (error) {
      console.error('Error recording medication intake:', error);
      res.status(500).json({ error: 'Error recording medication intake' });
    }
  });
};



const updateMedication = (req, res) => {
  const token = req.headers['authorization'];
  const { time_id } = req.params;
  const { name, dosage, time, notes } = req.body;

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token.replace('Bearer ', ''), SECRET_KEY, { algorithms: ['HS256'] }, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = decoded.id;

    // Primero verificar que el medicamento pertenece al usuario
    const verifyQuery = `
      SELECT mt.id 
      FROM medication_times mt
      JOIN medications m ON mt.medication_id = m.id
      WHERE mt.id = ? AND m.user_id = ?
    `;

    connection.query(verifyQuery, [time_id, userId], (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'Medication time not found' });
      }

      // Actualizar el horario de medicación
      const updateTimeQuery = 'UPDATE medication_times SET time = ? WHERE id = ?';
      connection.query(updateTimeQuery, [time, time_id], (err, results) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        // Actualizar la información general del medicamento
        const updateMedQuery = `
          UPDATE medications m
          JOIN medication_times mt ON m.id = mt.medication_id
          SET m.name = ?, m.dosage = ?, m.notes = ?
          WHERE mt.id = ?
        `;

        connection.query(updateMedQuery, [name, dosage, notes, time_id], (err, results) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          res.json({ message: 'Medicamento actualizado exitosamente' });
        });
      });
    });
  });
};


const softDeleteMedication = async (req, res) => {
  
  const { time_id } = req.params;
  console.log(`[SOFT DELETE] ID recibido: ${time_id}, Tipo: ${typeof time_id}`);

   if (!time_id || isNaN(time_id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  const token = req.headers.authorization?.replace('Bearer ', '');

  try {
    // Verificación detallada del token
    console.log('[AUTH] Verificando token...');
    const decoded = jwt.verify(token, SECRET_KEY, { algorithms: ['HS256'] });
    const userId = decoded.id;
    console.log(`[AUTH] Usuario autenticado ID: ${userId}`);

    // Consulta de verificación con logging
    const verifyQuery = `
      SELECT mt.id, mt.active, m.user_id, m.name 
      FROM medication_times mt
      JOIN medications m ON mt.medication_id = m.id
      WHERE mt.id = ? AND m.user_id = ?
    `;
    
    console.log('[VERIFY] Ejecutando consulta:', verifyQuery);
    const [verification] = await connection.promise().query(verifyQuery, [time_id, userId]);
    
    console.log('[VERIFY] Resultado:', verification);

    if (!verification.length) {
      console.error('[ERROR] No se encontró el registro o no coincide el usuario');
      return res.status(404).json({ error: 'Medication time not found' });
    }

    // Consulta de actualización
    const updateQuery = `
      UPDATE medication_times mt
      JOIN medications m ON mt.medication_id = m.id
      SET mt.active = 0
      WHERE mt.id = ? AND m.user_id = ?
    `;
    
    console.log('[UPDATE] Ejecutando:', updateQuery);
    const [result] = await connection.promise().query(updateQuery, [time_id, userId]);
    
    console.log('[UPDATE] Resultado:', {
      affectedRows: result.affectedRows,
      changedRows: result.changedRows
    });

    if (result.affectedRows === 0) {
      throw new Error('No se afectaron filas');
    }

    console.log('[SUCCESS] Soft delete completado');
    return res.json({ 
      success: true,
      message: 'Medicamento desactivado correctamente'
    });

  } catch (error) {
    console.error('[FAILURE] Error en softDeleteMedication:', {
      message: error.message,
      stack: error.stack,
      sqlMessage: error.sqlMessage
    });
    
    return res.status(500).json({ 
      error: 'Error en el servidor',
      details: error.message 
    });
  }
};


const updateMedicationAlarmStatus = (req, res) => {
  const token = req.headers['authorization'];
  const { time_id } = req.params;
  const { alarmEnabled } = req.body;

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token.replace('Bearer ', ''), SECRET_KEY, { algorithms: ['HS256'] }, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = decoded.id;

    // Actualizar el campo alarm_enabled en la tabla medications
    const query = `
      UPDATE medications m
      JOIN medication_times mt ON m.id = mt.medication_id
      SET m.alarm_enabled = ?
      WHERE mt.id = ? AND m.user_id = ?
    `;

    connection.query(query, [alarmEnabled ? 1 : 0, time_id, userId], (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Medicamento no encontrado o no autorizado' });
      }

      res.json({ message: 'Estado de alarma actualizado correctamente' });
    });
  });
};




module.exports = { addMedication, getMedicationsByDate, updateMedicationTakenStatus, recordMedicationTaken, updateMedication , softDeleteMedication, updateMedicationAlarmStatus  };
