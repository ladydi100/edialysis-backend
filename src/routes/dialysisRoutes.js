const express = require('express');
const { saveDialysisTreatment, getDialysisTreatments,  updateDialysisTreatment } = require('../controllers/dialysisController');

const router = express.Router();

router.post('/dialysis', saveDialysisTreatment);
router.get('/dialysis', getDialysisTreatments);
router.put('/dialysis', updateDialysisTreatment);

module.exports = router;