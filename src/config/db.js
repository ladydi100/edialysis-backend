const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',      // Usuario de MySQL
  password: '',      // Contraseña de MySQL (vacía por defecto en XAMPP)
  database: 'edialysis'
});

connection.connect((err) => {
  if (err) {
    console.error('Error conectando a MySQL:', err);
    return;
  }
  console.log('Conectado a MySQL');
});

module.exports = connection;