require('dotenv').config();
const mongoose = require('mongoose');
const Nurse = require('./models/Nurse');

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wecare';

async function seedNurses() {
  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing nurses
    console.log('🔄 Clearing existing nurses...');
    const deleteResult = await Nurse.deleteMany({});
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing nurses`);

    // Create sample nurses
    const sampleNurses = [
      {
        userId: new mongoose.Types.ObjectId(),
        name: 'Priya Sharma',
        specialization: 'General Home Care Nurse',
        rating: 4.8,
        reviews: 145,
        distance: '2.5 km away',
        profileImage: 'https://i.pinimg.com/736x/42/96/46/429646366c50688783ed4239528f7e95.jpg',
        hourlyRate: '500',
        experience: '8 years',
        licenseNumber: 'LN-2024-001',
        isActive: true
      },
      {
        userId: new mongoose.Types.ObjectId(),
        name: 'Anjali Kumar',
        specialization: 'Elderly Care Specialist',
        rating: 4.9,
        reviews: 203,
        distance: '1.2 km away',
        profileImage: 'https://i.pinimg.com/736x/a3/4f/96/a34f968ab546da32e3d2a7a542655e6a.jpg',
        hourlyRate: '550',
        experience: '10 years',
        licenseNumber: 'LN-2024-002',
        isActive: true
      },
      {
        userId: new mongoose.Types.ObjectId(),
        name: 'Neha Patel',
        specialization: 'Post-Surgery Care Specialist',
        rating: 4.5,
        reviews: 98,
        distance: '3.1 km away',
        profileImage: 'https://i.pinimg.com/736x/59/8c/80/598c809632f9de89259c069ef1d9bee8.jpg',
        hourlyRate: '600',
        experience: '6 years',
        licenseNumber: 'LN-2024-003',
        isActive: true
      },
      {
        userId: new mongoose.Types.ObjectId(),
        name: 'Meera Singh',
        specialization: 'Child Care Nurse',
        rating: 4.7,
        reviews: 167,
        distance: '2.8 km away',
        profileImage: 'https://i.pinimg.com/736x/ad/6c/b0/ad6cb07e44a5e63ffc89d7723b181052.jpg',
        hourlyRate: '480',
        experience: '7 years',
        licenseNumber: 'LN-2024-004',
        isActive: true
      },
      {
        userId: new mongoose.Types.ObjectId(),
        name: 'Divya Gupta',
        specialization: 'Critical Care Nurse',
        rating: 4.9,
        reviews: 189,
        distance: '1.8 km away',
        profileImage: 'https://i.pinimg.com/736x/e3/cd/49/e3cd49b5a9e9c7f3e5e1f5f5b5b5b5b5.jpg',
        hourlyRate: '700',
        experience: '12 years',
        licenseNumber: 'LN-2024-005',
        isActive: true
      },
      {
        userId: new mongoose.Types.ObjectId(),
        name: 'Isha Verma',
        specialization: 'Wound Care Specialist',
        rating: 4.6,
        reviews: 112,
        distance: '2.2 km away',
        profileImage: 'https://i.pinimg.com/736x/f4/5d/6e/f45d6e1a8e2c5b5f5b5f5f5f5f5f5f5f.jpg',
        hourlyRate: '580',
        experience: '9 years',
        licenseNumber: 'LN-2024-006',
        isActive: true
      }
    ];

    console.log('📝 Inserting sample nurses...');
    const result = await Nurse.insertMany(sampleNurses);
    console.log(`✅ Successfully inserted ${result.length} nurses!`);

    // Verify the insertion
    const count = await Nurse.countDocuments();
    console.log(`📊 Total nurses in database: ${count}`);

    const nurses = await Nurse.find().lean();
    console.log('\n📋 Inserted nurses:');
    nurses.forEach((nurse, idx) => {
      console.log(`${idx + 1}. ${nurse.name} (${nurse.specialization}) - ${nurse.rating}⭐`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

seedNurses();
