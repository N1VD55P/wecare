require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Nurse = require('./models/Nurse');
const bcrypt = require('bcryptjs');

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wecare';

async function testNurseSignup() {
  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Create a test nurse
    const testEmail = `nurse-${Date.now()}@test.com`;
    const testName = 'Dr. Sarah Johnson';
    const testPassword = 'Test@123456';

    console.log(`\n📝 Creating new nurse...`);
    console.log(`   Name: ${testName}`);
    console.log(`   Email: ${testEmail}`);
    console.log(`   Role: nurse`);

    // Hash password
    const hashedPassword = await bcrypt.hash(testPassword, 10);

    // Create user
    const newUser = await User.create({
      name: testName,
      email: testEmail,
      password: hashedPassword,
      role: 'nurse'
    });
    console.log(`✅ User created: ${newUser._id}`);

    // Create nurse profile
    const nurseRecord = await Nurse.create({
      userId: newUser._id,
      name: newUser.name,
      specialization: 'General Nursing',
      rating: 4.5,
      reviews: 0,
      distance: '0 km away',
      profileImage: 'https://i.pinimg.com/736x/42/96/46/429646366c50688783ed4239528f7e95.jpg',
      hourlyRate: '500',
      experience: '0 years',
      licenseNumber: 'PENDING',
      isActive: true
    });
    console.log(`✅ Nurse profile created: ${nurseRecord._id}`);

    // Verify nurse count
    const totalNurses = await Nurse.countDocuments();
    const activeNurses = await Nurse.countDocuments({ isActive: true });
    
    console.log(`\n📊 Database Status:`);
    console.log(`   Total Nurses: ${totalNurses}`);
    console.log(`   Active Nurses: ${activeNurses}`);

    // Get all nurses
    const allNurses = await Nurse.find({ isActive: true }).lean();
    console.log(`\n📋 Active Nurses List:`);
    allNurses.forEach((nurse, idx) => {
      console.log(`${idx + 1}. ${nurse.name} (${nurse.specialization}) - ${nurse.rating}⭐`);
    });

    console.log(`\n✅ Test Complete! Visit http://localhost:3000/nurses to see the new nurse`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

testNurseSignup();
