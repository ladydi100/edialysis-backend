const connection = require('../config/db');
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../config/auth');

const saveBloodPressure = (req, res) => {
  const token = req.headers['authorization'];
  const { systolic, diastolic } = req.body;

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token.replace('Bearer ', ''), SECRET_KEY, { algorithms: ['HS256'] }, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = decoded.id;

    const query = 'INSERT INTO blood_pressure (user_id, systolic, diastolic) VALUES (?, ?, ?)';
    connection.query(query, [userId, systolic, diastolic], (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Blood pressure saved successfully' });
    });
  });
};

const saveWeight = (req, res) => {
  const token = req.headers['authorization'];
  const { weight } = req.body;

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token.replace('Bearer ', ''), SECRET_KEY, { algorithms: ['HS256'] }, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = decoded.id;

    const query = 'INSERT INTO weight (user_id, weight) VALUES (?, ?)';
    connection.query(query, [userId, weight], (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Weight saved successfully' });
    });
  });
};

const saveHeartRate = (req, res) => {
  const token = req.headers['authorization'];
  const { heartRate } = req.body;

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token.replace('Bearer ', ''), SECRET_KEY, { algorithms: ['HS256'] }, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = decoded.id;

    const query = 'INSERT INTO heart_rate (user_id, heart_rate) VALUES (?, ?)';
    connection.query(query, [userId, heartRate], (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Heart rate saved successfully' });
    });
  });
};

const getLatestBloodPressure = (req, res) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token.replace('Bearer ', ''), SECRET_KEY, { algorithms: ['HS256'] }, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = decoded.id;

    const query = 'SELECT systolic, diastolic FROM blood_pressure WHERE user_id = ? ORDER BY created_at DESC LIMIT 1';
    connection.query(query, [userId], (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(results[0] || {});
    });
  });
};

const getLatestWeight = (req, res) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token.replace('Bearer ', ''), SECRET_KEY, { algorithms: ['HS256'] }, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = decoded.id;

    const query = 'SELECT weight FROM weight WHERE user_id = ? ORDER BY created_at DESC LIMIT 1';
    connection.query(query, [userId], (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(results[0] || {});
    });
  });
};

const getLatestHeartRate = (req, res) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token.replace('Bearer ', ''), SECRET_KEY, { algorithms: ['HS256'] }, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = decoded.id;

    const query = 'SELECT heart_rate FROM heart_rate WHERE user_id = ? ORDER BY created_at DESC LIMIT 1';
    connection.query(query, [userId], (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(results[0] || {});
    });
  });
};


module.exports = {
  saveBloodPressure,
  saveWeight,
  saveHeartRate,
  getLatestBloodPressure,
  getLatestWeight,
  getLatestHeartRate,
};