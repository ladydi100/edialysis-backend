const express = require('express');
const { addMedication  } = require('../controllers/medicationController');

const router = express.Router();

router.post('/medications', addMedication);
//router.get('/medications', getMedications);

module.exports = router;