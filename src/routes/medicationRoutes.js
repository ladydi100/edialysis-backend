const express = require('express');
const { addMedication } = require('../controllers/medicationController');

const router = express.Router();

router.post('/medications', addMedication);

module.exports = router;