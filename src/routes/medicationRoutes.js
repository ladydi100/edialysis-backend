const express = require('express');
const { addMedication, getMedicationsByDate,updateMedicationTakenStatus  } = require('../controllers/medicationController');

const router = express.Router();

router.post('/medications', addMedication);
router.get('/medications', getMedicationsByDate);
router.put('/medications/taken', updateMedicationTakenStatus);

module.exports = router;