require('dotenv').config();
const mongoose = require('mongoose');
const Nurse = require('./models/Nurse');

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wecare';

async function checkNurses() {
  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    const count = await Nurse.countDocuments();
    const activeCount = await Nurse.countDocuments({ isActive: true });
    const nurses = await Nurse.find().lean();

    console.log('\n✅ DATABASE STATUS:');
    console.log(`📊 Total Nurses: ${count}`);
    console.log(`✨ Active Nurses: ${activeCount}`);
    console.log(`\n📋 Nurses List:`);
    nurses.forEach((nurse, idx) => {
      console.log(`${idx + 1}. ${nurse.name}`);
      console.log(`   Specialization: ${nurse.specialization}`);
      console.log(`   Rating: ${nurse.rating}⭐ (${nurse.reviews} reviews)`);
      console.log(`   Photo: ${nurse.profileImage ? '✅ YES' : '❌ NO'}`);
      console.log(`   Active: ${nurse.isActive ? '✅ YES' : '❌ NO'}`);
    });

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

checkNurses();
