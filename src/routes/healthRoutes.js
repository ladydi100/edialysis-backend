const express = require('express');
const {
  saveBloodPressure,
  saveWeight,
  saveHeartRate,
  getLatestBloodPressure,
  getLatestWeight,
  getLatestHeartRate,
} = require('../controllers/healthController');


const router = express.Router();

router.post('/blood-pressure', saveBloodPressure);
router.post('/weight', saveWeight);
router.post('/heart-rate', saveHeartRate);


router.get('/blood-pressure/latest', getLatestBloodPressure);
router.get('/weight/latest', getLatestWeight);
router.get('/heart-rate/latest', getLatestHeartRate);

module.exports = router;