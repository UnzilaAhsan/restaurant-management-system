const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Models
const User = require('./models/User');
const Table = require('./models/Table');
const Reservation = require('./models/Reservation');

const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB for seeding');
        
        // Clear existing data
        await User.deleteMany({});
        await Table.deleteMany({});
        await Reservation.deleteMany({});
        
        console.log('Cleared existing data');
        
        // Create users
        const users = [
            {
                username: 'admin',
                email: 'admin@example.com',
                password: 'password123',
                role: 'admin'
            },
            {
                username: 'staff1',
                email: 'staff@example.com',
                password: 'password123',
                role: 'staff'
            },
            {
                username: 'customer1',
                email: 'customer@example.com',
                password: 'password123',
                role: 'customer'
            }
        ];
        
        const createdUsers = await User.insertMany(users);
        console.log('Created users');
        
        // Create tables
        const tables = [
            { tableNumber: 'T01', capacity: 2, location: 'indoors', status: 'available' },
            { tableNumber: 'T02', capacity: 4, location: 'indoors', status: 'available' },
            { tableNumber: 'T03', capacity: 6, location: 'indoors', status: 'available' },
            { tableNumber: 'T04', capacity: 4, location: 'outdoors', status: 'available' },
            { tableNumber: 'T05', capacity: 2, location: 'outdoors', status: 'available' },
            { tableNumber: 'T06', capacity: 8, location: 'private', status: 'available', description: 'Private dining room' },
            { tableNumber: 'T07', capacity: 4, location: 'balcony', status: 'available' },
            { tableNumber: 'T08', capacity: 2, location: 'balcony', status: 'available' }
        ];
        
        const createdTables = await Table.insertMany(tables);
        console.log('Created tables');
        
        // Create sample reservations
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const reservations = [
            {
                customerName: 'John Doe',
                customerEmail: 'john@example.com',
                customerPhone: '123-456-7890',
                tableId: createdTables[0]._id,
                tableNumber: 'T01',
                reservationDate: today,
                reservationTime: '18:00',
                partySize: 2,
                status: 'confirmed',
                createdBy: createdUsers[2]._id
            },
            {
                customerName: 'Jane Smith',
                customerEmail: 'jane@example.com',
                customerPhone: '987-654-3210',
                tableId: createdTables[1]._id,
                tableNumber: 'T02',
                reservationDate: tomorrow,
                reservationTime: '19:00',
                partySize: 4,
                status: 'pending',
                createdBy: createdUsers[2]._id
            }
        ];
        
        await Reservation.insertMany(reservations);
        console.log('Created sample reservations');
        
        console.log('Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();