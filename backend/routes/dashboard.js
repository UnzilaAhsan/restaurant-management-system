const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const { protect, staff } = require('../middleware/auth');

router.get('/stats', protect, staff, getDashboardStats);

module.exports = router;