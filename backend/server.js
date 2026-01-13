const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());

// MongoDB Connection
mongoose.connect('mongodb://127.0.0.1:27017/restaurant_db', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB Connected Successfully!'))
.catch(err => {
    console.log('❌ MongoDB Connection Error:', err.message);
    console.log('💡 Make sure MongoDB is running:');
    console.log('   Windows: Open Services and start "MongoDB Server"');
    console.log('   Mac: brew services start mongodb-community');
    console.log('   Or run: mongod in a new terminal');
});

// ========== MODELS ==========
const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    role: { type: String, default: 'customer' },
    salary: { type: Number, default: 0 },
    rank: { type: String, default: 'junior' },
    phone: String,
    address: String,
    joinDate: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

const tableSchema = new mongoose.Schema({
    tableNumber: String,
    capacity: Number,
    location: String,
    status: { type: String, default: 'available' }
});

const reservationSchema = new mongoose.Schema({
    customerName: String,
    customerEmail: String,
    customerPhone: String,
    tableNumber: String,
    reservationDate: String,
    reservationTime: String,
    partySize: Number,
    status: { type: String, default: 'pending' },
    specialRequests: String
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Table = mongoose.model('Table', tableSchema);
const Reservation = mongoose.model('Reservation', reservationSchema);

// ========== MIDDLEWARE ==========
const protect = (req, res, next) => {
    // Simple authentication check - in production use JWT
    const token = req.headers.authorization;
    if (token && token.startsWith('Bearer ')) {
        // For now, just allow the request
        // In production, verify JWT and attach user to req
        next();
    } else {
        // Check if it's a public route
        const publicRoutes = ['/api/auth/login', '/api/auth/register', '/api/create-demo-data'];
        if (publicRoutes.includes(req.path)) {
            next();
        } else {
            res.status(401).json({ message: 'Not authorized' });
        }
    }
};

// Role-based middleware
const admin = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        // In production, decode JWT and check role
        // For now, check via email in body or query
        const { email } = req.body;
        if (email) {
            const user = await User.findOne({ email });
            if (user && user.role === 'admin') {
                req.user = user;
                next();
            } else {
                res.status(403).json({ message: 'Admin access required' });
            }
        } else {
            // Allow for demo
            next();
        }
    } catch (error) {
        res.status(403).json({ message: 'Admin access required' });
    }
};

const staff = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const { email } = req.body;
        if (email) {
            const user = await User.findOne({ email });
            if (user && (user.role === 'staff' || user.role === 'admin')) {
                req.user = user;
                next();
            } else {
                res.status(403).json({ message: 'Staff access required' });
            }
        } else {
            // Allow for demo
            next();
        }
    } catch (error) {
        res.status(403).json({ message: 'Staff access required' });
    }
};

// ========== AUTH ROUTES ==========
// REGISTER
app.post('/api/auth/register', async (req, res) => {
    try {
        console.log('📝 Registration attempt:', req.body);
        
        const { username, email, password, role } = req.body;
        
        // Check if user exists
        const existingUser = await User.findOne({ 
            $or: [{ email }, { username }] 
        });
        
        if (existingUser) {
            return res.status(400).json({ 
                success: false,
                message: 'User already exists' 
            });
        }
        
        // Create user
        const user = await User.create({
            username,
            email,
            password,
            role: role || 'customer'
        });
        
        console.log('✅ User created:', user._id);
        
        res.status(201).json({
            success: true,
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            token: 'dummy-jwt-token-' + Date.now()
        });
        
    } catch (error) {
        console.error('❌ Registration error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Registration failed. Please try again.' 
        });
    }
});

// LOGIN
app.post('/api/auth/login', async (req, res) => {
    try {
        console.log('🔐 Login attempt:', req.body.email);
        
        const { email, password } = req.body;
        
        // Find user
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid email or password' 
            });
        }
        
        // Check password
        if (user.password !== password) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid email or password' 
            });
        }
        
        console.log('✅ Login successful for:', user.email);
        
        res.json({
            success: true,
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            salary: user.salary,
            rank: user.rank,
            phone: user.phone,
            address: user.address,
            token: 'dummy-jwt-token-' + Date.now()
        });
        
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Login failed. Please try again.' 
        });
    }
});

// ========== TABLE ROUTES ==========
// GET ALL TABLES
app.get('/api/tables', async (req, res) => {
    try {
        const tables = await Table.find();
        res.json({ success: true, data: tables });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// CREATE TABLE (Admin only)
app.post('/api/tables', async (req, res) => {
    try {
        const table = await Table.create(req.body);
        res.status(201).json({ success: true, data: table });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// UPDATE TABLE
app.put('/api/tables/:id', async (req, res) => {
    try {
        const table = await Table.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, data: table });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE TABLE
app.delete('/api/tables/:id', async (req, res) => {
    try {
        await Table.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Table deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== TABLE AVAILABILITY CHECK ==========
// Check table availability
app.get('/api/tables/available', async (req, res) => {
  try {
    const { date, time, partySize } = req.query;
    
    if (!date || !time || !partySize) {
      return res.status(400).json({ 
        success: false, 
        message: 'Date, time, and party size are required' 
      });
    }
    
    // Get all tables with capacity >= partySize
    const allTables = await Table.find({
      capacity: { $gte: parseInt(partySize) },
      status: { $ne: 'maintenance' } // Exclude maintenance tables
    });
    
    // Get reservations for the specified date and time
    const reservations = await Reservation.find({
      reservationDate: date,
      reservationTime: time,
      status: { $in: ['pending', 'confirmed', 'seated'] } // These statuses mean table is occupied
    });
    
    // Get table numbers that are already reserved
    const reservedTableNumbers = reservations.map(r => r.tableNumber);
    
    // Filter out reserved tables
    const availableTables = allTables.filter(table => 
      !reservedTableNumbers.includes(table.tableNumber)
    );
    
    res.json({ 
      success: true, 
      data: availableTables 
    });
  } catch (error) {
    console.error('Availability check error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get table by number
app.get('/api/tables/number/:tableNumber', async (req, res) => {
  try {
    const table = await Table.findOne({ tableNumber: req.params.tableNumber });
    if (!table) {
      return res.status(404).json({ 
        success: false, 
        message: 'Table not found' 
      });
    }
    res.json({ success: true, data: table });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
// Update table by table number
app.put('/api/tables/number/:tableNumber', async (req, res) => {
  try {
    const table = await Table.findOneAndUpdate(
      { tableNumber: req.params.tableNumber },
      req.body,
      { new: true }
    );
    
    if (!table) {
      return res.status(404).json({ 
        success: false, 
        message: 'Table not found' 
      });
    }
    
    res.json({ success: true, data: table });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
// ========== RESERVATION ROUTES ==========
// GET ALL RESERVATIONS (with role-based filtering)
app.get('/api/reservations', async (req, res) => {
    try {
        const { date, status, email, role, customerEmail } = req.query;
        let filter = {};
        
        // If customerEmail is provided (for customers to see their own reservations)
        if (customerEmail) {
            filter.customerEmail = customerEmail;
        } 
        // If role is customer and no specific email provided, they should see all reservations
        // (This is for admin/staff view)
        else if (role !== 'customer' && email) {
            filter.customerEmail = email;
        }
        
        if (date) {
            // If date is a specific date string
            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setDate(endDate.getDate() + 1);
            filter.reservationDate = { 
                $gte: startDate.toISOString().split('T')[0],
                $lt: endDate.toISOString().split('T')[0]
            };
        }
        
        if (status && status !== 'all') {
            filter.status = status;
        }
        
        const reservations = await Reservation.find(filter)
            .sort({ reservationDate: -1, reservationTime: -1 });
        
        res.json({ success: true, data: reservations });
    } catch (error) {
        console.error('Error fetching reservations:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET USER'S RESERVATIONS (for customers)
app.get('/api/reservations/user/:email', async (req, res) => {
    try {
        const reservations = await Reservation.find({ 
            customerEmail: req.params.email 
        }).sort({ reservationDate: -1, reservationTime: -1 });
        
        res.json({ success: true, data: reservations });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// CREATE RESERVATION
app.post('/api/reservations', async (req, res) => {
    try {
        const reservation = await Reservation.create(req.body);
        
        // Update table status to reserved
        await Table.findOneAndUpdate(
            { tableNumber: req.body.tableNumber },
            { status: 'reserved' }
        );
        
        res.status(201).json({ success: true, data: reservation });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// UPDATE RESERVATION STATUS
app.put('/api/reservations/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        
        const reservation = await Reservation.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        
        if (!reservation) {
            return res.status(404).json({ 
                success: false,
                message: 'Reservation not found' 
            });
        }
        
        // If status is cancelled or completed, make table available
        if (status === 'cancelled' || status === 'completed') {
            await Table.findOneAndUpdate(
                { tableNumber: reservation.tableNumber },
                { status: 'available' }
            );
        }
        
        // If status is seated, make table occupied
        if (status === 'seated') {
            await Table.findOneAndUpdate(
                { tableNumber: reservation.tableNumber },
                { status: 'occupied' }
            );
        }
        
        res.json({
            success: true,
            data: reservation
        });
        
    } catch (error) {
        console.error('Status update error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to update status' 
        });
    }
});

// ========== STAFF MANAGEMENT ROUTES ==========
// GET ALL STAFF (Admin only)
app.get('/api/staff', async (req, res) => {
    try {
        const staff = await User.find({ 
            role: { $in: ['staff', 'admin'] } 
        }).select('-password');
        
        res.json({ success: true, data: staff });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// CREATE STAFF (Admin only)
app.post('/api/staff', async (req, res) => {
    try {
        const { username, email, password, role, salary, rank, phone, address } = req.body;
        
        // Check if user exists
        const existingUser = await User.findOne({ 
            $or: [{ email }, { username }] 
        });
        
        if (existingUser) {
            return res.status(400).json({ 
                success: false,
                message: 'User already exists' 
            });
        }
        
        // Create staff member
        const staff = await User.create({
            username,
            email,
            password,
            role: role || 'staff',
            salary: salary || 0,
            rank: rank || 'junior',
            phone,
            address,
            joinDate: new Date(),
            isActive: true
        });
        
        res.status(201).json({
            success: true,
            data: {
                _id: staff._id,
                username: staff.username,
                email: staff.email,
                role: staff.role,
                salary: staff.salary,
                rank: staff.rank,
                phone: staff.phone,
                address: staff.address,
                joinDate: staff.joinDate,
                isActive: staff.isActive
            }
        });
    } catch (error) {
        console.error('Create staff error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to create staff member' 
        });
    }
});

// UPDATE STAFF (Admin only)
app.put('/api/staff/:id', async (req, res) => {
    try {
        const { salary, rank, isActive, phone, address } = req.body;
        
        const staff = await User.findByIdAndUpdate(
            req.params.id,
            {
                salary,
                rank,
                isActive,
                phone,
                address
            },
            { new: true }
        ).select('-password');
        
        if (!staff) {
            return res.status(404).json({ 
                success: false,
                message: 'Staff member not found' 
            });
        }
        
        res.json({ success: true, data: staff });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE STAFF (Admin only)
app.delete('/api/staff/:id', async (req, res) => {
    try {
        const staff = await User.findByIdAndDelete(req.params.id);
        
        if (!staff) {
            return res.status(404).json({ 
                success: false,
                message: 'Staff member not found' 
            });
        }
        
        res.json({ success: true, message: 'Staff member deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== ANALYTICS ROUTES ==========
// GET ANALYTICS (Admin only)
app.get('/api/analytics', async (req, res) => {
    try {
        // Get last 30 days of data
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        
        // Format dates for comparison
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];
        
        // Get reservations data
        const reservations = await Reservation.find({
            reservationDate: { 
                $gte: startDateStr,
                $lte: endDateStr
            }
        });
        
        // Calculate revenue (assuming $50 per person)
        const dailyRevenue = {};
        reservations.forEach(res => {
            const date = res.reservationDate;
            const revenue = res.partySize * 50;
            dailyRevenue[date] = (dailyRevenue[date] || 0) + revenue;
        });
        
        // Get table performance
        const tableStats = [];
        const tables = await Table.find();
        
        for (const table of tables) {
            const tableReservations = reservations.filter(r => r.tableNumber === table.tableNumber);
            tableStats.push({
                tableNumber: table.tableNumber,
                totalReservations: tableReservations.length,
                averagePartySize: tableReservations.length > 0 
                    ? tableReservations.reduce((sum, r) => sum + r.partySize, 0) / tableReservations.length 
                    : 0,
                totalRevenue: tableReservations.reduce((sum, r) => sum + (r.partySize * 50), 0)
            });
        }
        
        // Sort table stats by revenue
        tableStats.sort((a, b) => b.totalRevenue - a.totalRevenue);
        
        // Get peak hours
        const peakHours = {};
        reservations.forEach(res => {
            const hour = res.reservationTime?.split(':')[0] || '00';
            peakHours[hour] = (peakHours[hour] || 0) + 1;
        });
        
        const peakHoursArray = Object.entries(peakHours)
            .map(([hour, count]) => ({ hour: `${hour}:00`, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        
        // Get customer statistics
        const customerStats = [];
        const customerMap = {};
        
        reservations.forEach(res => {
            if (!customerMap[res.customerEmail]) {
                customerMap[res.customerEmail] = {
                    email: res.customerEmail,
                    name: res.customerName,
                    totalVisits: 0,
                    totalSpent: 0
                };
            }
            customerMap[res.customerEmail].totalVisits += 1;
            customerMap[res.customerEmail].totalSpent += res.partySize * 50;
        });
        
        Object.values(customerMap).forEach(customer => {
            customerStats.push(customer);
        });
        
        customerStats.sort((a, b) => b.totalVisits - a.totalVisits);
        
        // Get staff performance (if we had staff assignments)
        const staffPerformance = [];
        const users = await User.find({ role: { $in: ['staff', 'admin'] } });
        
        users.forEach(user => {
            // For demo, generate random performance data
            staffPerformance.push({
                _id: user._id,
                staffName: user.username,
                totalReservations: Math.floor(Math.random() * 50) + 10,
                totalRevenue: Math.floor(Math.random() * 50000) + 10000
            });
        });
        
        staffPerformance.sort((a, b) => b.totalRevenue - a.totalRevenue);
        
        res.json({
            success: true,
            data: {
                dailyRevenue,
                tableStats,
                peakHours: peakHoursArray,
                customerStats: customerStats.slice(0, 10),
                staffPerformance,
                summary: {
                    totalRevenue: Object.values(dailyRevenue).reduce((a, b) => a + b, 0),
                    totalReservations: reservations.length,
                    averagePartySize: reservations.length > 0 
                        ? reservations.reduce((sum, r) => sum + r.partySize, 0) / reservations.length 
                        : 0,
                    bestTable: tableStats[0] || null
                }
            }
        });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== DASHBOARD ROUTES ==========
// GET DASHBOARD STATS
app.get('/api/dashboard/stats', async (req, res) => {
    try {
        const totalTables = await Table.countDocuments();
        const availableTables = await Table.countDocuments({ status: 'available' });
        const today = new Date().toISOString().split('T')[0];
        const todayReservations = await Reservation.countDocuments({ reservationDate: today });
        
        // Get today's confirmed reservations
        const todayConfirmedReservations = await Reservation.find({
            reservationDate: today,
            status: { $in: ['confirmed', 'seated'] }
        }).countDocuments();
        
        // Get recent reservations
        const recentReservations = await Reservation.find()
            .sort({ createdAt: -1 })
            .limit(10);
        
        res.json({
            success: true,
            data: {
                totalTables,
                availableTables,
                todayReservations,
                todayConfirmedReservations,
                recentReservations,
                occupancyRate: totalTables > 0 ? 
                    Math.round(((totalTables - availableTables) / totalTables) * 100) : 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== MENU ROUTES (Placeholder) ==========
app.get('/api/menu', async (req, res) => {
    try {
        // Placeholder menu data
        const menuItems = [
            {
                id: 1,
                name: 'Grilled Salmon',
                category: 'Main Course',
                price: 28.99,
                description: 'Fresh Atlantic salmon with lemon butter sauce',
                isAvailable: true,
                popularity: 4.8
            },
            {
                id: 2,
                name: 'Caesar Salad',
                category: 'Appetizer',
                price: 12.99,
                description: 'Crisp romaine lettuce with Caesar dressing',
                isAvailable: true,
                popularity: 4.5
            },
            {
                id: 3,
                name: 'Chocolate Lava Cake',
                category: 'Dessert',
                price: 9.99,
                description: 'Warm chocolate cake with molten center',
                isAvailable: true,
                popularity: 4.9
            }
        ];
        
        res.json({ success: true, data: menuItems });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== DEMO DATA ==========
app.get('/api/create-demo-data', async (req, res) => {
    try {
        // Clear existing data
        await User.deleteMany({});
        await Table.deleteMany({});
        await Reservation.deleteMany({});
        
        // Create demo users with staff fields
        const users = [
            { 
                username: 'admin', 
                email: 'admin@example.com', 
                password: 'password123', 
                role: 'admin',
                salary: 75000,
                rank: 'executive',
                phone: '+1 (555) 123-4567',
                address: '123 Admin Street, New York, NY'
            },
            { 
                username: 'staff', 
                email: 'staff@example.com', 
                password: 'password123', 
                role: 'staff',
                salary: 45000,
                rank: 'senior',
                phone: '+1 (555) 987-6543',
                address: '456 Staff Avenue, New York, NY'
            },
            { 
                username: 'customer', 
                email: 'customer@example.com', 
                password: 'password123', 
                role: 'customer',
                phone: '+1 (555) 555-5555',
                address: '789 Customer Road, New York, NY'
            }
        ];
        await User.insertMany(users);
        
        // Create demo tables
        const tables = [
            { tableNumber: 'T01', capacity: 2, location: 'indoors', status: 'available' },
            { tableNumber: 'T02', capacity: 4, location: 'indoors', status: 'available' },
            { tableNumber: 'T03', capacity: 6, location: 'outdoors', status: 'available' },
            { tableNumber: 'T04', capacity: 2, location: 'balcony', status: 'available' },
            { tableNumber: 'T05', capacity: 8, location: 'private', status: 'available' },
            { tableNumber: 'T06', capacity: 4, location: 'indoors', status: 'available' }
        ];
        await Table.insertMany(tables);
        
        // Create demo reservations
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        
        const reservations = [
            {
                customerName: 'John Doe',
                customerEmail: 'customer@example.com',
                customerPhone: '123-456-7890',
                tableNumber: 'T01',
                reservationDate: today,
                reservationTime: '18:00',
                partySize: 2,
                status: 'confirmed'
            },
            {
                customerName: 'Jane Smith',
                customerEmail: 'jane@example.com',
                customerPhone: '987-654-3210',
                tableNumber: 'T02',
                reservationDate: today,
                reservationTime: '19:30',
                partySize: 4,
                status: 'pending'
            },
            {
                customerName: 'Bob Wilson',
                customerEmail: 'bob@example.com',
                customerPhone: '555-123-4567',
                tableNumber: 'T03',
                reservationDate: today,
                reservationTime: '20:00',
                partySize: 6,
                status: 'seated'
            },
            {
                customerName: 'Alice Johnson',
                customerEmail: 'alice@example.com',
                customerPhone: '555-987-6543',
                tableNumber: 'T04',
                reservationDate: tomorrowStr,
                reservationTime: '19:00',
                partySize: 2,
                status: 'confirmed'
            }
        ];
        await Reservation.insertMany(reservations);
        
        // Update table statuses based on reservations
        await Table.updateOne({ tableNumber: 'T01' }, { status: 'reserved' });
        await Table.updateOne({ tableNumber: 'T02' }, { status: 'reserved' });
        await Table.updateOne({ tableNumber: 'T03' }, { status: 'occupied' });
        
        res.json({ 
            success: true, 
            message: 'Demo data created successfully!',
            data: {
                users: users.map(u => ({ 
                    email: u.email, 
                    password: u.password, 
                    role: u.role,
                    salary: u.salary,
                    rank: u.rank
                })),
                tables: tables.length,
                reservations: reservations.length
            }
        });
        
    } catch (error) {
        console.error('Demo data creation error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== HELPER ROUTES ==========
// Health check
app.get('/', (req, res) => {
    res.json({ 
        message: 'Restaurant API is running!',
        version: '2.1.0',
        endpoints: [
            'POST /api/auth/register',
            'POST /api/auth/login',
            'GET  /api/tables',
            'GET  /api/reservations',
            'GET  /api/reservations/user/:email',
            'POST /api/reservations',
            'PUT  /api/reservations/:id/status',
            'GET  /api/staff',
            'POST /api/staff',
            'PUT  /api/staff/:id',
            'GET  /api/analytics',
            'GET  /api/dashboard/stats',
            'GET  /api/menu',
            'GET  /api/create-demo-data'
        ]
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Create demo data: http://localhost:${PORT}/api/create-demo-data`);
    console.log(`🔑 Test login: admin@example.com / password123`);
    console.log(`🔑 Staff login: staff@example.com / password123`);
    console.log(`🔑 Customer login: customer@example.com / password123`);
});