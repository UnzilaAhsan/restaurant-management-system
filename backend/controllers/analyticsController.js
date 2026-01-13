const Reservation = require('../models/Reservation');
const Table = require('../models/Table');
const User = require('../models/User');

exports.getAnalytics = async (req, res) => {
    try {
        // Date range (last 30 days)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        
        // 1. Revenue Analytics
        const reservations = await Reservation.find({
            reservationDate: { $gte: startDate, $lte: endDate },
            status: { $in: ['completed', 'seated'] }
        });
        
        const dailyRevenue = {};
        reservations.forEach(res => {
            const date = res.reservationDate.toISOString().split('T')[0];
            const revenue = res.partySize * 50; // Assuming $50 per person
            dailyRevenue[date] = (dailyRevenue[date] || 0) + revenue;
        });
        
        // 2. Table Performance
        const tableStats = await Reservation.aggregate([
            {
                $match: {
                    reservationDate: { $gte: startDate, $lte: endDate },
                    status: { $in: ['completed', 'seated'] }
                }
            },
            {
                $group: {
                    _id: '$tableNumber',
                    totalReservations: { $sum: 1 },
                    averagePartySize: { $avg: '$partySize' },
                    totalRevenue: { $sum: { $multiply: ['$partySize', 50] } }
                }
            },
            { $sort: { totalRevenue: -1 } }
        ]);
        
        // 3. Peak Hours
        const peakHours = await Reservation.aggregate([
            {
                $match: {
                    reservationDate: { $gte: startDate, $lte: endDate },
                    status: { $in: ['completed', 'seated'] }
                }
            },
            {
                $group: {
                    _id: '$reservationTime',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);
        
        // 4. Customer Demographics
        const customerStats = await Reservation.aggregate([
            {
                $match: {
                    reservationDate: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: '$customerEmail',
                    totalVisits: { $sum: 1 },
                    totalSpent: { $sum: { $multiply: ['$partySize', 50] } }
                }
            },
            { $sort: { totalVisits: -1 } },
            { $limit: 10 }
        ]);
        
        // 5. Staff Performance
        const staffPerformance = await Reservation.aggregate([
            {
                $match: {
                    reservationDate: { $gte: startDate, $lte: endDate },
                    createdBy: { $ne: null }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'createdBy',
                    foreignField: '_id',
                    as: 'staff'
                }
            },
            { $unwind: '$staff' },
            {
                $group: {
                    _id: '$staff._id',
                    staffName: { $first: '$staff.username' },
                    totalReservations: { $sum: 1 },
                    totalRevenue: { $sum: { $multiply: ['$partySize', 50] } }
                }
            },
            { $sort: { totalRevenue: -1 } }
        ]);
        
        res.json({
            dailyRevenue,
            tableStats,
            peakHours,
            customerStats,
            staffPerformance,
            summary: {
                totalRevenue: Object.values(dailyRevenue).reduce((a, b) => a + b, 0),
                totalReservations: reservations.length,
                averagePartySize: reservations.reduce((sum, res) => sum + res.partySize, 0) / reservations.length,
                bestTable: tableStats[0] || null
            }
        });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ message: error.message });
    }
};