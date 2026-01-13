const Reservation = require('../models/Reservation');
const Table = require('../models/Table');

// Get all reservations
exports.getReservations = async (req, res) => {
    try {
        const { date, status, email } = req.query;
        let filter = {};
        
        // If user is customer, only show their reservations
        if (req.user.role === 'customer') {
            filter.customerEmail = req.user.email;
        } else if (email) {
            // For staff/admin, filter by email if provided
            filter.customerEmail = email;
        }
        
        if (date) {
            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setDate(endDate.getDate() + 1);
            filter.reservationDate = { $gte: startDate, $lt: endDate };
        }
        
        if (status && status !== 'all') {
            filter.status = status;
        }
        
        const reservations = await Reservation.find(filter)
            .populate('tableId', 'tableNumber capacity location')
            .populate('createdBy', 'username email')
            .sort({ reservationDate: -1, reservationTime: -1 });
        
        res.json(reservations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create reservation
exports.createReservation = async (req, res) => {
    try {
        const {
            customerName,
            customerEmail,
            customerPhone,
            tableId,
            reservationDate,
            reservationTime,
            partySize,
            specialRequests
        } = req.body;
        
        // Check table availability
        const table = await Table.findById(tableId);
        if (!table) {
            return res.status(404).json({ message: 'Table not found' });
        }
        
        if (table.capacity < partySize) {
            return res.status(400).json({ message: 'Table capacity exceeded' });
        }
        
        // Check for existing reservation at same time
        const existingReservation = await Reservation.findOne({
            tableId,
            reservationDate: new Date(reservationDate),
            reservationTime,
            status: { $in: ['pending', 'confirmed'] }
        });
        
        if (existingReservation) {
            return res.status(400).json({ message: 'Table already reserved at this time' });
        }
        
        const reservation = await Reservation.create({
            customerName,
            customerEmail,
            customerPhone,
            tableId,
            tableNumber: table.tableNumber,
            reservationDate,
            reservationTime,
            partySize,
            specialRequests,
            createdBy: req.user?.id
        });
        
        // Update table status
        table.status = 'reserved';
        await table.save();
        
        res.status(201).json(reservation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update reservation status
exports.updateReservationStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const reservation = await Reservation.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        ).populate('tableId', 'tableNumber capacity location');
        
        if (!reservation) {
            return res.status(404).json({ message: 'Reservation not found' });
        }
        
        // Update table status based on reservation status
        if (status === 'cancelled' || status === 'completed') {
            await Table.findByIdAndUpdate(reservation.tableId, { status: 'available' });
        } else if (status === 'seated') {
            await Table.findByIdAndUpdate(reservation.tableId, { status: 'occupied' });
        }
        
        res.json(reservation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Cancel reservation
exports.cancelReservation = async (req, res) => {
    try {
        const reservation = await Reservation.findByIdAndUpdate(
            req.params.id,
            { status: 'cancelled' },
            { new: true }
        );
        
        if (!reservation) {
            return res.status(404).json({ message: 'Reservation not found' });
        }
        
        // Make table available again
        await Table.findByIdAndUpdate(reservation.tableId, { status: 'available' });
        
        res.json({ message: 'Reservation cancelled successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};