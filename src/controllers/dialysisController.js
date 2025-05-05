const jwt = require('jsonwebtoken');
const connection = require('../config/db');
const { SECRET_KEY } = require('../config/auth');

const saveDialysisTreatment = (req, res) => {
  const token = req.headers['authorization'];
  const { treatment_type, start_date, dry_weight, days } = req.body;
 console.log('Datos recibidos en backend:', {
    treatment_type,
    start_date,
    dry_weight,
    days
  });


 ///console.log('Token:', token);
//console.log('Datos enviados:', treatmentData);

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

    if (!treatment_type || !start_date || !days) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }


  jwt.verify(token.replace('Bearer ', ''), SECRET_KEY, { algorithms: ['HS256'] }, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = decoded.id;

    connection.beginTransaction(err => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }


      // 1. Guardar el tratamiento principal
      connection.query(
        'INSERT INTO dialysis_treatments (user_id, treatment_type, start_date, dry_weight) VALUES (?, ?, ?, ?)',
        [userId, treatment_type, start_date, dry_weight],
        (err, results) => {
          if (err) {
            return connection.rollback(() => {
              res.status(500).json({ error: err.message });
            });
          }

          const treatmentId = results.insertId;
          
          // 2. Guardar los días de tratamiento
          const daysValues = days.map(day => [treatmentId, day.day, day.reminder_time || null]);
          
          connection.query(
            'INSERT INTO dialysis_treatment_days (treatment_id, day_of_week, reminder_time) VALUES ?',
            [daysValues],
            (err, results) => {
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

                res.json({ 
                  message: 'Tratamiento de diálisis guardado exitosamente',
                  treatmentId 
                });
              });
            }
          );
        }
      );
    });
  });
};



const getDialysisTreatments = (req, res) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token.replace('Bearer ', ''), SECRET_KEY, { algorithms: ['HS256'] }, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = decoded.id;

    // Consulta SQL corregida (versión que funciona en phpMyAdmin)
    const query = `
      SELECT dt.*, 
      GROUP_CONCAT(CONCAT_WS('|', dtd.day_of_week, TIME_FORMAT(dtd.reminder_time, '%H:%i'))) AS days
      FROM dialysis_treatments dt
      LEFT JOIN dialysis_treatment_days dtd ON dt.id = dtd.treatment_id
      WHERE dt.user_id = ?
      GROUP BY dt.id
      ORDER BY dt.created_at DESC
      LIMIT 1
    `;

    connection.query(query, [userId], (err, results) => {
      if (err) {
        console.error('Error en la consulta SQL:', {
          message: err.message,
          sql: err.sql,
          sqlMessage: err.sqlMessage
        });
        return res.status(500).json({ error: 'Error al obtener el tratamiento de diálisis' });
      }

      if (results.length === 0) {
        return res.json(null);
      }

      const treatment = results[0];
      
      // Parsear los días del tratamiento
      const days = treatment.days ? treatment.days.split(',').map(dayStr => {
        const [day_of_week, reminder_time] = dayStr.split('|');
        return { 
          day_of_week, 
          reminder_time: reminder_time === 'NULL' ? null : reminder_time 
        };
      }) : [];

      res.json({
        treatment_type: treatment.treatment_type,
        start_date: treatment.start_date,
        dry_weight: treatment.dry_weight,
        days: days
      });
    });
  });
};


// Actualizar el tratamiento existente
const updateDialysisTreatment = (req, res) => {
  const token = req.headers['authorization'];
  const { treatment_type, start_date, dry_weight, days } = req.body;

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token.replace('Bearer ', ''), SECRET_KEY, { algorithms: ['HS256'] }, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = decoded.id;

    connection.beginTransaction(err => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // 1. Actualizar el tratamiento principal
      connection.query(
        `UPDATE dialysis_treatments 
         SET treatment_type = ?, start_date = ?, dry_weight = ?
         WHERE user_id = ?
         ORDER BY created_at DESC LIMIT 1`,
        [treatment_type, start_date, dry_weight, userId],
        (err, results) => {
          if (err) {
            return connection.rollback(() => {
              res.status(500).json({ error: err.message });
            });
          }

          // 2. Eliminar los días existentes
          connection.query(
            `DELETE dtd FROM dialysis_treatment_days dtd
             JOIN dialysis_treatments dt ON dtd.treatment_id = dt.id
             WHERE dt.user_id = ?`,
            [userId],
            (err, results) => {
              if (err) {
                return connection.rollback(() => {
                  res.status(500).json({ error: err.message });
                });
              }

              // 3. Insertar los nuevos días si existen
              if (days && days.length > 0) {
                // Obtener el ID del tratamiento actualizado
                connection.query(
                  'SELECT id FROM dialysis_treatments WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
                  [userId],
                  (err, results) => {
                    if (err || results.length === 0) {
                      return connection.rollback(() => {
                        res.status(500).json({ error: 'Error al obtener el tratamiento actualizado' });
                      });
                    }

                    const treatmentId = results[0].id;
                    const daysValues = days.map(day => [treatmentId, day.day_of_week, day.reminder_time || null]);
                    
                    connection.query(
                      'INSERT INTO dialysis_treatment_days (treatment_id, day_of_week, reminder_time) VALUES ?',
                      [daysValues],
                      (err, results) => {
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

                          res.json({ 
                            message: 'Tratamiento actualizado exitosamente',
                            treatment_type,
                            start_date,
                            dry_weight,
                            days
                          });
                        });
                      }
                    );
                  }
                );
              } else {
                connection.commit(err => {
                  if (err) {
                    return connection.rollback(() => {
                      res.status(500).json({ error: err.message });
                    });
                  }

                  res.json({ 
                    message: 'Tratamiento actualizado exitosamente',
                    treatment_type,
                    start_date,
                    dry_weight,
                    days: []
                  });
                });
              }
            }
          );
        }
      );
    });
  });
};





module.exports = {
  saveDialysisTreatment,
  getDialysisTreatments,
  updateDialysisTreatment
};