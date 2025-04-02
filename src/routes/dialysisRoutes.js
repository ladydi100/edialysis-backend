const express = require('express');
const { saveDialysisTreatment, getDialysisTreatments } = require('../controllers/dialysisController');

const router = express.Router();

router.post('/dialysis', saveDialysisTreatment);
router.get('/dialysis', getDialysisTreatments);

module.exports = router;