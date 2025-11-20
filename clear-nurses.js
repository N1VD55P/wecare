require('dotenv').config();
const mongoose = require('mongoose');

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wecare';

async function checkIndexes() {
  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection;
    const collection = db.collection('nurses');

    // Drop all indexes except _id
    console.log('🔄 Dropping all indexes on nurses collection...');
    try {
      await collection.dropIndexes();
      console.log('✅ Indexes dropped');
    } catch (err) {
      console.log('⚠️  No indexes to drop or error:', err.message);
    }

    // Clear collection
    console.log('🗑️  Clearing nurses collection...');
    await collection.deleteMany({});
    console.log('✅ Collection cleared');

    await mongoose.connection.close();
    console.log('✅ Done!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

checkIndexes();
