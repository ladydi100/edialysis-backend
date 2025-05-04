const express = require('express');
const { addMedication, getMedicationsByDate,updateMedicationTakenStatus, recordMedicationTaken , updateMedication, softDeleteMedication} = require('../controllers/medicationController');

const router = express.Router();

router.post('/medications', addMedication);
router.get('/medications', getMedicationsByDate);
router.put('/medications/taken', updateMedicationTakenStatus);
router.put('/medications/intake', recordMedicationTaken);
router.put('/medications/:time_id', updateMedication);
router.put('/medications/soft-delete/:time_id', softDeleteMedication);



module.exports = router;