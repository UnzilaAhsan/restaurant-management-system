const express = require('express');
const router = express.Router();
const {
    getReservations,
    createReservation,
    updateReservationStatus,
    cancelReservation
} = require('../controllers/reservationController');

// Public routes
router.post('/', createReservation);

// Protected routes
router.get('/', getReservations);
router.put('/:id/status', updateReservationStatus);
router.put('/:id/cancel', cancelReservation);

module.exports = router;