const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',      // Usuario de MySQL
  password: '',      // Contraseña de MySQL (vacía por defecto en XAMPP)
  database: 'edialysis',
//  debug: true // <-- Habilita el modo debug
});

connection.connect((err) => {
  if (err) {
    console.error('Error conectando a MySQL:', err);
    return;
  }
  console.log('Conectado a MySQL');
});



// Loggear todas las consultas SQL
/*
connection.on('query', (query) => {
  console.log('[SQL]', query.sql);
  console.log('[PARAMS]', query.values);
});

connection.on('error', (err) => {
  console.error('[MySQL ERROR]', err.code, err.message);
});
*/

module.exports = connection;