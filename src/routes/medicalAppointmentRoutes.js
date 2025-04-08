const express = require('express');
const { saveAppointment, getAppointments,updateAppointment, deleteAppointment} = require('../controllers/medicalAppointmentController');

const router = express.Router();

router.post('/medical-appointments', saveAppointment);
router.get('/medical-appointments', getAppointments);
router.put('/medical-appointments', updateAppointment);
router.delete('/medical-appointments', deleteAppointment);

module.exports = router;