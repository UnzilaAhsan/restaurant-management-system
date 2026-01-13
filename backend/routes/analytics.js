const express = require('express');
const router = express.Router();
const { getAnalytics } = require('../controllers/analyticsController');
const { protect, admin } = require('../middleware/auth');

router.get('/', protect, admin, getAnalytics);

module.exports = router;