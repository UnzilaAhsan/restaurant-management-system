// backend/resetDatabase.js
const mongoose = require('mongoose');
require('dotenv').config();

async function resetDatabase() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/restaurant_db');
        console.log('✅ Connected to MongoDB');
        
        const collections = await mongoose.connection.db.collections();
        
        for (let collection of collections) {
            await collection.deleteMany({});
            console.log(`✅ Cleared collection: ${collection.collectionName}`);
        }
        
        console.log('\n🎯 Database reset complete!');
        console.log('💡 Now run: node seed.js to populate with demo data');
        console.log('💡 Or run: npm run seed');
        
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

resetDatabase();