const Table = require('../models/Table');

// Get all tables
exports.getTables = async (req, res) => {
    try {
        const tables = await Table.find().sort({ tableNumber: 1 });
        res.json(tables);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get single table
exports.getTable = async (req, res) => {
    try {
        const table = await Table.findById(req.params.id);
        if (!table) {
            return res.status(404).json({ message: 'Table not found' });
        }
        res.json(table);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create table (Admin only)
exports.createTable = async (req, res) => {
    try {
        const { tableNumber, capacity, location, description } = req.body;
        
        const table = await Table.create({
            tableNumber,
            capacity,
            location,
            description
        });
        
        res.status(201).json(table);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update table (Admin only)
exports.updateTable = async (req, res) => {
    try {
        const table = await Table.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!table) {
            return res.status(404).json({ message: 'Table not found' });
        }
        
        res.json(table);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete table (Admin only)
exports.deleteTable = async (req, res) => {
    try {
        const table = await Table.findByIdAndDelete(req.params.id);
        
        if (!table) {
            return res.status(404).json({ message: 'Table not found' });
        }
        
        res.json({ message: 'Table deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};