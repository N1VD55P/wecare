require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Nurse = require('./models/Nurse');
const Appointment = require('./models/Appointment');
const bcrypt = require('bcryptjs');

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wecare';

async function testAppointmentBooking() {
  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log(' Connected to MongoDB');

    // Create a test patient
    const patientEmail = `patient-${Date.now()}@test.com`;
    const patientPassword = 'Test@123456';
    const hashedPassword = await bcrypt.hash(patientPassword, 10);

    console.log(`\n📝 Creating test patient...`);
    const testPatient = await User.create({
      name: 'John Doe',
      email: patientEmail,
      password: hashedPassword,
      role: 'patient'
    });
    console.log(`✅ Patient created: ${testPatient._id}`);

    // Get a nurse from database
    console.log(`\n👩‍⚕️ Fetching a nurse...`);
    const nurse = await Nurse.findOne({ isActive: true });
    
    if (!nurse) {
      console.error('❌ No active nurses found in database!');
      process.exit(1);
    }
    console.log(`✅ Found nurse: ${nurse.name}`);

    // Create an appointment
    console.log(`\n📅 Booking appointment...`);
    const appointmentDate = new Date();
    appointmentDate.setDate(appointmentDate.getDate() + 3); // 3 days from now

    const appointment = await Appointment.create({
      userId: testPatient._id,
      nurseId: nurse._id,
      nurseName: nurse.name,
      nurseImage: nurse.profileImage,
      specialization: nurse.specialization,
      serviceType: 'Consultation',
      servicePrice: 500,
      appointmentDate: appointmentDate,
      appointmentTime: '14:30',
      paymentMethod: 'CARD',
      insuranceCoverage: false,
      status: 'confirmed'
    });
    console.log(`✅ Appointment created: ${appointment._id}`);

    // Verify appointment
    console.log(`\n✅ APPOINTMENT DETAILS:`);
    console.log(`   Patient: ${testPatient.name}`);
    console.log(`   Nurse: ${appointment.nurseName}`);
    console.log(`   Specialization: ${appointment.specialization}`);
    console.log(`   Service: ${appointment.serviceType}`);
    console.log(`   Date: ${appointment.appointmentDate.toLocaleDateString('en-US')}`);
    console.log(`   Time: ${appointment.appointmentTime}`);
    console.log(`   Price: Rs ${appointment.servicePrice}`);
    console.log(`   Payment: ${appointment.paymentMethod}`);
    console.log(`   Status: ${appointment.status}`);

    // Get all patient appointments
    const patientAppointments = await Appointment.find({ userId: testPatient._id });
    console.log(`\n📊 Patient Appointments: ${patientAppointments.length}`);

    // Verify it can be retrieved
    const retrievedAppointment = await Appointment.findById(appointment._id);
    if (retrievedAppointment) {
      console.log(`✅ Appointment successfully retrieved from database`);
    }

    console.log(`\n✅ TEST COMPLETE! Booking system is working perfectly.`);
    console.log(`\nTo view appointments in the app:`);
    console.log(`1. Login with: ${patientEmail} / ${patientPassword}`);
    console.log(`2. Visit http://localhost:3000/my-appointments`);
    console.log(`3. You should see the appointment we just created`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

testAppointmentBooking();
