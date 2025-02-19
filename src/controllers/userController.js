const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const connection = require('../config/db');

const register = (req, res) => {
  const { name, lastname, email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 8);

  connection.query(
    'INSERT INTO users (name, lastname, email, password) VALUES (?,?,?, ?)',
    [name,lastname, email, hashedPassword],
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Usuario registrado exitosamente' });
    }
  );
};

const login = (req, res) => {
  const { email, password } = req.body;

  connection.query(
    'SELECT * FROM users WHERE email = ?',
    [email],
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (results.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const user = results[0];
      const passwordIsValid = bcrypt.compareSync(password, user.password);

      if (!passwordIsValid) {
        return res.status(401).json({ error: 'Contraseña incorrecta' });
      }

      const token = jwt.sign({ id: user.id }, 'secretkey', { expiresIn: '1h' });
      res.json({ token });
    }
  );
};

module.exports = { register, login };