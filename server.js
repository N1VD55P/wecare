// server.js
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Sessions
const session = require('express-session');
const MongoStore = require('connect-mongo');
const multer = require('multer');
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'public', 'uploads');

// Ensure uploads directory exists
try {
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
} catch (err) {
  console.error('Failed to create uploads directory:', err);
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const safeName = Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.\\-_]/g, '_');
    cb(null, safeName);
  }
});
const upload = multer({ storage: storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Mongo URI for session store
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wecare';

// Load models
const User = require('./models/User');
const Nurse = require('./models/Nurse');
const Appointment = require('./models/Appointment');

// Set EJS as view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'wecare-secret-change-me',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI || mongoUri }),
  cookie: { maxAge: 1000 * 60 * 60 }
}));

// Make current user available in templates
app.use(async (req, res, next) => {
  res.locals.currentUser = null;
  if (req.session && req.session.userId) {
    try {
      const u = await User.findById(req.session.userId).lean();
      if (u) res.locals.currentUser = u;
    } catch (err) {
      console.error('Session user load error:', err);
    }
  }
  next();
});

// Connect to MongoDB
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('Connected to MongoDB');

  // Seed sample users if none exist
  try {
    const count = await User.estimatedDocumentCount();
    if (count === 0) {
      console.log('No users found — seeding sample users...');
      await User.create([
        { name: 'Sample Patient', email: 'patient@example.com', password: 'password123', role: 'patient' },
        { name: 'Sample Nurse', email: 'nurse@example.com', password: 'password123', role: 'nurse' }
      ]);
      console.log('Sample users created');
    }
  } catch (err) {
    console.error('Error during user seed:', err);
  }

  // Seed sample nurses if none exist
  try {
    const nurseCount = await Nurse.estimatedDocumentCount();
    if (nurseCount === 0) {
      console.log('No nurses found — seeding sample nurses...');
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
      await Nurse.insertMany(sampleNurses);
      console.log('Sample nurses created:', sampleNurses.length);
    }
  } catch (err) {
    console.error('Error during nurse seed:', err);
  }

}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// ---------------------------
//           ROUTES
// ---------------------------

app.get('/', async (req, res) => {
  const showLogin = !res.locals.currentUser;

  try {
    const dbNurses = await Nurse.find({ isActive: true }).limit(4).lean();

    const featuredNurses = dbNurses.length > 0 ? dbNurses.map(nurse => ({
      id: nurse._id,
      name: nurse.name,
      specialization: nurse.specialization,
      rating: nurse.rating,
      reviews: nurse.reviews,
      distance: nurse.distance,
      image: nurse.profileImage
    })) : [];

    res.render('index', { page: 'home', showLogin, featuredNurses });
  } catch (err) {
    console.error('Error fetching featured nurses:', err);
    res.render('index', { page: 'home', showLogin, featuredNurses: [] });
  }
});

// Nurses page
app.get('/nurses', async (req, res) => {
  try {
    const dbNurses = await Nurse.find({ isActive: true }).lean();
    console.log('Fetched nurses from DB:', dbNurses.length, 'nurses');
    
    // If nurses exist in database, use them; otherwise use default data
    const nurses = dbNurses.length > 0 ? dbNurses.map(nurse => ({
      id: nurse._id,
      name: nurse.name,
      specialization: nurse.specialization,
      rating: nurse.rating,
      reviews: nurse.reviews,
      distance: nurse.distance,
      image: nurse.profileImage
    })) : [
      {
        id: 1,
        name: 'Priya Sharma',
        specialization: 'General Home Care Nurse',
        rating: 4.8,
        reviews: 145,
        distance: '2.5 km away',
        image: 'https://i.pinimg.com/736x/42/96/46/429646366c50688783ed4239528f7e95.jpg'
      },
      {
        id: 2,
        name: 'Anjali Kumar',
        specialization: 'Elderly Care Specialist',
        rating: 4.9,
        reviews: 203,
        distance: '1.2 km away',
        image: 'https://i.pinimg.com/736x/a3/4f/96/a34f968ab546da32e3d2a7a542655e6a.jpg'
      },
      {
        id: 3,
        name: 'Neha Patel',
        specialization: 'Post-Surgery Care Specialist',
        rating: 4.5,
        reviews: 98,
        distance: '3.1 km away',
        image: 'https://i.pinimg.com/736x/59/8c/80/598c809632f9de89259c069ef1d9bee8.jpg'
      },
      {
        id: 4,
        name: 'Meera Singh',
        specialization: 'Child Care Nurse',
        rating: 4.7,
        reviews: 167,
        distance: '2.8 km away',
        image: 'https://i.pinimg.com/736x/ad/6c/b0/ad6cb07e44a5e63ffc89d7723b181052.jpg'
      }
    ];
    
    res.render('nurses', { 
      page: 'nurses',
      nurses: nurses
    });
  } catch (err) {
    res.render('nurses', { page: 'nurses', nurses: [] });
  }
});

// Booking page
app.get('/booking', async (req, res) => {
  const nurseId = req.query.nurse;
  
  try {
    let nurse = null;
    
    // If nurseId is provided, fetch from database
    if (nurseId) {
      nurse = await Nurse.findById(nurseId).lean();
    }
    
    // Fallback to default nurse if not found
    if (!nurse) {
      nurse = {
        _id: 'default',
        name: 'Priya Sharma',
        specialization: 'General Home Care Nurse',
        rating: 4.8,
        profileImage: 'https://i.pinimg.com/736x/42/96/46/429646366c50688783ed4239528f7e95.jpg'
      };
    }
    
    res.render('booking', { 
      page: 'booking',
      nurse: nurse,
      appointments: []
    });
  } catch (err) {
    console.error('Error fetching nurse for booking:', err);
    res.render('booking', { 
      page: 'booking',
      nurse: {
        _id: 'default',
        name: 'Priya Sharma',
        specialization: 'General Home Care Nurse',
        rating: 4.8,
        profileImage: 'https://i.pinimg.com/736x/42/96/46/429646366c50688783ed4239528f7e95.jpg'
      },
      appointments: []
    });
  }
});

// ✅ Book Appointment POST
app.post('/book-appointment', async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ ok: false, error: 'Please login to book an appointment' });
    }

    const { nurseId, nurseName, nurseImage, specialization, serviceType, servicePrice, appointmentDate, appointmentTime, paymentMethod, insuranceCoverage } = req.body;

    // Validate required fields
    if (!nurseId || !nurseName || !serviceType || !servicePrice || !appointmentDate || !appointmentTime) {
      return res.status(400).json({ ok: false, error: 'Missing required fields' });
    }

    // Create appointment
    const appointment = await Appointment.create({
      userId: req.session.userId,
      nurseId: nurseId,
      nurseName: nurseName,
      nurseImage: nurseImage,
      specialization: specialization,
      serviceType: serviceType,
      servicePrice: parseInt(servicePrice),
      appointmentDate: new Date(appointmentDate),
      appointmentTime: appointmentTime,
      paymentMethod: paymentMethod,
      insuranceCoverage: insuranceCoverage === 'true' || insuranceCoverage === true,
      status: 'confirmed'
    });

    console.log('✅ Appointment created:', {
      id: appointment._id,
      patient: req.session.userId,
      nurse: nurseName,
      date: appointmentDate,
      time: appointmentTime,
      service: serviceType
    });

    return res.json({ ok: true, appointment: appointment });
  } catch (err) {
    console.error('❌ Error booking appointment:', err);
    return res.status(500).json({ ok: false, error: 'Failed to book appointment: ' + err.message });
  }
});

// ✅ Get User Appointments
app.get('/my-appointments', async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.redirect('/login');
    }

    const appointments = await Appointment.find({ userId: req.session.userId })
      .populate('nurseId', 'name specialization profileImage')
      .sort({ appointmentDate: -1 })
      .lean();

    res.render('appointments', { 
      page: 'appointments',
      appointments: appointments,
      user: res.locals.currentUser
    });
  } catch (err) {
    console.error('Error fetching appointments:', err);
    res.status(500).send('Error fetching appointments');
  }
});

// ✅ Get Appointments API (for AJAX)
app.get('/api/appointments', async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ ok: false, error: 'Not logged in' });
    }

    const appointments = await Appointment.find({ userId: req.session.userId })
      .sort({ appointmentDate: -1 })
      .lean();

    return res.json({ ok: true, appointments: appointments });
  } catch (err) {
    console.error('Error fetching appointments:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ✅ Cancel Appointment
app.post('/cancel-appointment/:appointmentId', async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ ok: false, error: 'Not logged in' });
    }

    const appointment = await Appointment.findById(req.params.appointmentId);
    
    if (!appointment) {
      return res.status(404).json({ ok: false, error: 'Appointment not found' });
    }

    if (appointment.userId.toString() !== req.session.userId.toString()) {
      return res.status(403).json({ ok: false, error: 'Unauthorized' });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    console.log('✅ Appointment cancelled:', req.params.appointmentId);
    return res.json({ ok: true, message: 'Appointment cancelled successfully' });
  } catch (err) {
    console.error('Error cancelling appointment:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// Login page
app.get('/login', (req, res) => {
  if (req.session && req.session.userId) {
    if (req.session.role === 'nurse') return res.redirect('/nurseportal');
    return res.redirect('/patientportal');
  }
  res.render('login', {});
});

// Signup
app.get('/signup', (req, res) => {
  res.render('signup', { form: { role: 'patient' } });
});

app.post('/signup', async (req, res) => {
  const { name, email, password, confirm, role } = req.body;

  if (!name || !email || !password || !confirm) {
    return res.status(400).render('signup', { error: 'All fields required.', form: { name, email, role } });
  }
  if (password !== confirm) {
    return res.status(400).render('signup', { error: 'Passwords do not match.', form: { name, email, role } });
  }

  try {
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).render('signup', { error: 'Email already exists.', form: { name, email, role } });
    }

    const newUser = await User.create({ name, email, password, role: role || 'patient' });

    if (newUser.role === 'nurse') {
      try {
        const nurseRecord = await Nurse.create({
          userId: newUser._id,
          name: newUser.name,
          specialization: 'General Nursing',
          rating: 4.5,
          reviews: 0,
          distance: '0 km away',
          profileImage: 'https://i.pinimg.com/736x/42/96/46/429646366c50688783ed4239528f7e95.jpg', // Default nurse avatar
          hourlyRate: '500',
          experience: '0 years',
          licenseNumber: 'PENDING',
          isActive: true
        });
        console.log('✅ Nurse profile created successfully:', nurseRecord._id, 'Name:', nurseRecord.name);
      } catch (nurseErr) {
        console.error('❌ Error creating nurse profile:', nurseErr.message);
      }
    }

    req.session.userId = newUser._id;
    req.session.role = newUser.role;

    if (newUser.role === 'nurse') return res.redirect('/nurseportal');
    return res.redirect('/patientportal');

  } catch (err) {
    return res.status(500).render('signup', { error: 'Signup failed.', form: { name, email, role } });
  }
});

// Login POST
app.post('/login', async (req, res) => {
  const { email, password, role: selectedRole } = req.body;

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(401).render('login', { error: 'Invalid credentials.' });

    console.log('User found:', { email: user.email, role: user.role, _id: user._id });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).render('login', { error: 'Invalid credentials.' });

    // Set session BEFORE any checks
    req.session.userId = user._id;
    req.session.role = user.role;
    
    console.log('Session set:', { userId: req.session.userId, role: req.session.role });

    if (user.role === 'nurse') return res.redirect('/nurseportal');
    return res.redirect('/patientportal');

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).render('login', { error: 'Server error.' });
  }
});

// Patient portal
app.get('/patientportal', async (req, res) => {
  if (!req.session.userId) {
    console.log('No session, redirecting to login');
    return res.redirect('/login');
  }
  
  if (req.session.role !== 'patient') {
    console.log('Wrong role:', req.session.role, '- Access denied');
    return res.status(403).send('Forbidden');
  }
  
  const user = res.locals.currentUser || {};
  
  // Fetch any 2 nurses from database
  try {
    const savedNurses = await Nurse.find({ isActive: true }).limit(2).lean();
    res.render('patientportal', { patient: user, savedNurses });
  } catch (err) {
    console.error('Error fetching saved nurses:', err);
    res.render('patientportal', { patient: user, savedNurses: [] });
  }
});

// Nurse portal
app.get('/nurseportal', async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  if (req.session.role !== 'nurse') return res.status(403).send('Forbidden');

  const nurse = res.locals.currentUser || {};
  
  // Fetch nurse-specific data from Nurse collection
  try {
    const nurseProfile = await Nurse.findOne({ userId: req.session.userId }).lean();
    res.render('nurseportal', { nurse, nurseProfile });
  } catch (err) {
    console.error('Error fetching nurse profile:', err);
    res.render('nurseportal', { nurse, nurseProfile: null });
  }
});

// Profile routes
app.get('/profile', (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  if (req.session.role !== 'patient') return res.status(403).send('Forbidden');

  const user = res.locals.currentUser;
  res.render('profile', { user });
});


//ADDED PRESCRIPTIONS ROUTE
// ---------------------------
app.get('/prescriptions', (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  if (req.session.role !== 'patient') return res.status(403).send('Forbidden');

  const prescriptions = [
    { name: "Paracetamol 500mg", details: "1 tablet twice a day — after meals" },
    { name: "Amoxicillin 250mg", details: "1 capsule 3× daily — 7-day course" },
    { name: "Vitamin D3", details: "1 tablet daily — after lunch" }
  ];

  res.render('prescriptions', { prescriptions });
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});

app.post('/profile', upload.single('photo'), async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');

  try {
    const user = await User.findById(req.session.userId);

    if (!user.profile) {
      user.profile = {};
    }

    // Update fields
    user.name = req.body.name || user.name;
    user.profile.phone = req.body.phone || "";
    user.profile.dob = req.body.dob || "";
    user.profile.gender = req.body.gender || "";
    user.profile.address = req.body.address || "";
    user.profile.city = req.body.city || "";
    user.profile.state = req.body.state || "";
    user.profile.zip = req.body.zip || "";
    user.profile.emergencyContact = req.body.emergencyContact || "";
    user.profile.notes = req.body.notes || "";
    user.profile.bloodGroup = req.body.bloodGroup || "";

    // Save photo if uploaded
    if (req.file) {
      user.profile.photo = "/uploads/" + req.file.filename;
    }

    await user.save();

    // If user is a nurse, update nurse profile with photo
    if (user.role === 'nurse') {
      try {
        const photoPath = req.file ? "/uploads/" + req.file.filename : null;
        const updateData = {};
        if (user.name) updateData.name = user.name;
        if (photoPath) updateData.profileImage = photoPath;
        
        await Nurse.updateOne({ userId: user._id }, updateData);
      } catch (nurseErr) {
        console.error('Error updating nurse photo:', nurseErr);
      }
      return res.redirect("/nurseportal");
    }

    // ⭐ Redirect to patient dashboard after saving
    return res.redirect("/patientportal");

  } catch (error) {
    console.error(error);
    return res.render("profile", {
      user: res.locals.currentUser,
      error: "Something went wrong while saving profile."
    });
  }
});

// ✅ Admin endpoint to reseed nurses
app.get('/admin/reseed-nurses', async (req, res) => {
  try {
    console.log('🔄 Clearing existing nurses...');
    await Nurse.deleteMany({});
    
    console.log('📝 Creating sample nurses...');
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
    
    const result = await Nurse.insertMany(sampleNurses);
    console.log(`✅ Successfully inserted ${result.length} nurses!`);
    return res.json({ 
      ok: true, 
      inserted: result.length, 
      message: 'Nurses reseeded successfully',
      nurses: result.map(n => ({ id: n._id, name: n.name, specialization: n.specialization }))
    });
  } catch (err) {
    console.error('❌ Error reseeding nurses:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

//  Admin endpoint to check nurses count
app.get('/admin/nurses-status', async (req, res) => {
  try {
    const count = await Nurse.countDocuments();
    const nurses = await Nurse.find().lean();
    return res.json({ 
      ok: true, 
      count,
      nurses: nurses.map(n => ({ 
        id: n._id, 
        name: n.name, 
        specialization: n.specialization,
        isActive: n.isActive,
        hasImage: !!n.profileImage,
        profileImage: n.profileImage ? n.profileImage.substring(0, 50) + '...' : 'NO IMAGE'
      }))
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ========== NURSE EDIT PROFILE ROUTES ==========

// GET nurse edit profile page
app.get('/nurse/edit-profile', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session || !req.session.userId) {
      return res.redirect('/login');
    }

    // Get current user
    const user = await User.findById(req.session.userId).lean();
    if (!user || user.role !== 'nurse') {
      return res.status(403).send('Only nurses can access this page');
    }

    // Get nurse profile
    const nurseProfile = await Nurse.findOne({ userId: req.session.userId }).lean();
    if (!nurseProfile) {
      return res.status(404).send('Nurse profile not found');
    }

    // Render edit profile page
    res.render('nurse-edit-profile', { 
      user,
      nurse: nurseProfile,
      message: req.query.message || null
    });
  } catch (err) {
    console.error('Error loading nurse edit profile:', err);
    res.status(500).send('Error loading profile');
  }
});

// POST update nurse profile
app.post('/nurse/update-profile', upload.single('profileImage'), async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ ok: false, error: 'Not logged in' });
    }

    // Get current user
    const user = await User.findById(req.session.userId);
    if (!user || user.role !== 'nurse') {
      return res.status(403).json({ ok: false, error: 'Only nurses can update profiles' });
    }

    // Get nurse profile
    let nurseProfile = await Nurse.findOne({ userId: req.session.userId });
    if (!nurseProfile) {
      return res.status(404).json({ ok: false, error: 'Nurse profile not found' });
    }

    // Extract form data
    const {
      name,
      specialization,
      hourlyRate,
      experience,
      licenseNumber,
      certifications
    } = req.body;

    // Validate required fields
    if (!name || name.trim() === '') {
      return res.status(400).json({ ok: false, error: 'Name is required' });
    }
    if (!specialization || specialization.trim() === '') {
      return res.status(400).json({ ok: false, error: 'Specialization is required' });
    }
    if (!hourlyRate || hourlyRate.trim() === '') {
      return res.status(400).json({ ok: false, error: 'Hourly rate is required' });
    }

    // Update profile image if provided
    if (req.file) {
      nurseProfile.profileImage = '/uploads/' + req.file.filename;
    }

    // Update profile details
    nurseProfile.name = name.trim();
    nurseProfile.specialization = specialization.trim();
    nurseProfile.hourlyRate = hourlyRate.trim();
    nurseProfile.experience = experience ? experience.trim() : nurseProfile.experience;
    nurseProfile.licenseNumber = licenseNumber ? licenseNumber.trim() : nurseProfile.licenseNumber;
    nurseProfile.certifications = certifications ? certifications.trim() : nurseProfile.certifications;

    // Also update user name if changed
    if (user.name !== name.trim()) {
      user.name = name.trim();
      await user.save();
    }

    // Save nurse profile
    await nurseProfile.save();

    console.log('✅ Nurse profile updated:', nurseProfile._id);

    // Return success response
    res.json({ 
      ok: true, 
      message: 'Profile updated successfully!',
      nurse: nurseProfile
    });
  } catch (err) {
    console.error('Error updating nurse profile:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET nurse profile API (for fetching current profile)
app.get('/api/nurse/profile', async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ ok: false, error: 'Not logged in' });
    }

    const nurseProfile = await Nurse.findOne({ userId: req.session.userId }).lean();
    if (!nurseProfile) {
      return res.status(404).json({ ok: false, error: 'Nurse profile not found' });
    }

    res.json({ ok: true, nurse: nurseProfile });
  } catch (err) {
    console.error('Error fetching nurse profile:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 404 handler (MUST be after all other routes)
app.use((req, res) => {
  res.status(404).send('Page not found');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
