const express = require('express');
const router = express.Router();
const {
    getTables,
    getTable,
    createTable,
    updateTable,
    deleteTable
} = require('../controllers/tableController');
const { protect, admin } = require('../middleware/auth');

router.route('/')
    .get(protect, getTables)
    .post(protect, admin, createTable);

router.route('/:id')
    .get(protect, getTable)
    .put(protect, admin, updateTable)
    .delete(protect, admin, deleteTable);

module.exports = router;