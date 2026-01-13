const express = require('express');
const router = express.Router();
const {
    getStaff,
    createStaff,
    updateStaff,
    deleteStaff
} = require('../controllers/staffController');
const { protect, admin } = require('../middleware/auth');

router.route('/')
    .get(protect, admin, getStaff)
    .post(protect, admin, createStaff);

router.route('/:id')
    .put(protect, admin, updateStaff)
    .delete(protect, admin, deleteStaff);

module.exports = router;