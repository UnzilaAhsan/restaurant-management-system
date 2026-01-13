// backend/resetAll.js
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

async function resetAll() {
    try {
        console.log('🔄 Resetting everything...');
        
        // Connect to MongoDB
        await mongoose.connect('mongodb://127.0.0.1:27017/restaurant_db');
        console.log('✅ Connected to MongoDB');
        
        // Drop the entire database
        await mongoose.connection.db.dropDatabase();
        console.log('✅ Database dropped');
        
        // Disconnect
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed');
        
        console.log('\n🎯 Everything reset! Now run these commands:');
        console.log('1. node seed.js');
        console.log('2. npm start');
        console.log('\nThen in a new terminal:');
        console.log('3. cd ../frontend');
        console.log('4. npm start');
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

resetAll();