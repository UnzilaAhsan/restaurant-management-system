const mongoose = require('mongoose');
require('dotenv').config();

async function testDB() {
  try {
    console.log('🔍 Testing MongoDB connection...');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurant_db');
    console.log('✅ Connected to MongoDB');
    
    // Check if database exists
    const dbs = await mongoose.connection.db.admin().listDatabases();
    const dbExists = dbs.databases.some(db => db.name === 'restaurant_db');
    
    if (dbExists) {
      console.log('✅ Database "restaurant_db" exists');
      
      // List collections
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log('📊 Collections:');
      collections.forEach(col => {
        console.log(`  - ${col.name}`);
      });
      
      // Count documents
      const usersCount = await mongoose.connection.db.collection('users').countDocuments();
      console.log(`👤 Users count: ${usersCount}`);
      
      const tablesCount = await mongoose.connection.db.collection('tables').countDocuments();
      console.log(`🪑 Tables count: ${tablesCount}`);
      
      const reservationsCount = await mongoose.connection.db.collection('reservations').countDocuments();
      console.log(`📅 Reservations count: ${reservationsCount}`);
      
    } else {
      console.log('❌ Database "restaurant_db" does not exist');
      console.log('💡 Run: node seed.js to create database and collections');
    }
    
    await mongoose.connection.close();
    console.log('👋 Connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Is MongoDB running? Try: mongod');
    console.log('2. Check connection string in .env file');
    console.log('3. Try default: mongodb://localhost:27017/restaurant_db');
  }
}

testDB();