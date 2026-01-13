const Table = require('../models/Table');
const Reservation = require('../models/Reservation');

exports.getDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Total tables
        const totalTables = await Table.countDocuments();
        
        // Available tables
        const availableTables = await Table.countDocuments({ status: 'available' });
        
        // Today's reservations
        const todayReservations = await Reservation.countDocuments({
            reservationDate: { $gte: today, $lt: tomorrow }
        });
        
        // Today's confirmed reservations
        const todayConfirmedReservations = await Reservation.find({
            reservationDate: { $gte: today, $lt: tomorrow },
            status: { $in: ['confirmed', 'seated'] }
        }).countDocuments();
        
        // Recent reservations
        const recentReservations = await Reservation.find()
            .populate('tableId', 'tableNumber')
            .sort({ createdAt: -1 })
            .limit(10);
        
        res.json({
            totalTables,
            availableTables,
            todayReservations,
            todayConfirmedReservations,
            recentReservations,
            occupancyRate: totalTables > 0 ? 
                ((totalTables - availableTables) / totalTables * 100).toFixed(2) : 0
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};