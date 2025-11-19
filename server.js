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

    const featuredNurses = dbNurses.length > 0 ? dbNurses : [
      {
        name: 'Priya Sharma',
        specialization: 'General Home Care Nurse',
        rating: 4.8,
        image: 'https://i.pinimg.com/736x/42/96/46/429646366c50688783ed4239528f7e95.jpg'
      }
    ];

    res.render('index', { page: 'home', showLogin, featuredNurses });
  } catch (err) {
    res.render('index', { page: 'home', showLogin, featuredNurses: [] });
  }
});

// Nurses page
app.get('/nurses', async (req, res) => {
  try {
    const dbNurses = await Nurse.find({ isActive: true }).lean();
    res.render('nurses', { page: 'nurses', nurses: dbNurses });
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
app.get('/booking', (req, res) => {
  const nurseId = req.query.nurse;
  const nurse = { id: nurseId, name: 'Priya Sharma', specialization: 'General Home Care Nurse' };
  res.render('booking', { page: 'booking', nurse, appointments: [] });
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
      await Nurse.create({
        userId: newUser._id,
        name: newUser.name,
        specialization: 'General Nursing',
        rating: 4.5,
        reviews: 0,
        distance: '0 km',
        profileImage: 'default.png',
        isActive: true
      });
      try {
        const nurseRecord = await Nurse.create({
          userId: newUser._id,
          name: newUser.name,
          specialization: 'General Nursing',
          rating: 4.5,
          reviews: 0,
          distance: '0 km away',
          profileImage: '', // Empty - nurse should upload their own photo
          isActive: true
        });
        console.log('Nurse profile created successfully:', nurseRecord._id, 'Name:', nurseRecord.name);
      } catch (nurseErr) {
        console.error('Error creating nurse profile:', nurseErr.message);
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

    if (selectedRole && selectedRole !== user.role) {
      return res.status(403).render('login', { error: 'Role mismatch.' });
    }

    req.session.userId = user._id;
    req.session.role = user.role;

    if (user.role === 'nurse') return res.redirect('/nurseportal');
    return res.redirect('/patientportal');

    // Create session and redirect based on user's actual role (from database)
    req.session.userId = user._id;
    req.session.role = user.role;
    console.log('Login successful for', email, 'with role:', user.role);
    console.log('Session set:', { userId: req.session.userId, role: req.session.role });
    
    if (user.role === 'nurse') {
      console.log('Redirecting to nurse portal');
      return res.redirect('/nurseportal');
    }
    console.log('Redirecting to patient portal');
    return res.redirect('/patientportal');
  } catch (err) {
    return res.status(500).render('login', { error: 'Server error.' });
  }
});

// Patient portal
app.get('/patientportal', (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  if (req.session.role !== 'patient') return res.status(403).send('Forbidden');
  
  const user = res.locals.currentUser || {};
  res.render('patientportal', { patient: user });
});

// Nurse portal
app.get('/nurseportal', (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  if (req.session.role !== 'nurse') return res.status(403).send('Forbidden');

  const nurse = res.locals.currentUser || {};
  res.render('nurseportal', { nurse });
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
// Dev-only: list users (email + role only) for quick verification
if (process.env.NODE_ENV !== 'production') {
  app.get('/debug/users', async (req, res) => {
    try {
      const users = await User.find({}, 'email role createdAt').lean();
      return res.json({ ok: true, count: users.length, users });
    } catch (err) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  });

  // Debug endpoint to check nurses in database
  app.get('/debug/nurses', async (req, res) => {
    try {
      const allNurses = await Nurse.find({}).lean();
      const activeNurses = await Nurse.find({ isActive: true }).lean();
      return res.json({ 
        ok: true, 
        total: allNurses.length, 
        active: activeNurses.length, 
        allNurses,
        activeNurses
      });
    } catch (err) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  });

  // Admin endpoint to activate all nurses
  app.get('/admin/activate-nurses', async (req, res) => {
    try {
      const result = await Nurse.updateMany({}, { isActive: true });
      return res.json({ ok: true, modified: result.modifiedCount });
    } catch (err) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  });

  // Admin endpoint to fix a user's role by email (for testing)
  app.get('/admin/fix-user-role/:email/:role', async (req, res) => {
    try {
      const { email, role } = req.params;
      if (!['patient', 'nurse', 'admin'].includes(role)) {
        return res.json({ ok: false, error: 'Invalid role. Must be patient, nurse, or admin' });
      }
      const result = await User.updateOne(
        { email: email.toLowerCase().trim() },
        { role: role }
      );
      return res.json({ ok: true, modified: result.modifiedCount, email, role });
    } catch (err) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  });

  // Admin endpoint to fix Nurse collection - remove duplicates and drop bad indexes
  app.get('/admin/fix-nurse-index', async (req, res) => {
    try {
      // Drop the problematic email index if it exists
      try {
        await Nurse.collection.dropIndex('email_1');
        console.log('Dropped email_1 index');
      } catch (indexErr) {
        console.log('No email_1 index to drop or already dropped');
      }

      // Remove duplicate nurse records (keep only the first one per userId)
      const allNurses = await Nurse.find({}).sort({ createdAt: 1 });
      const seenUserIds = new Set();
      const duplicates = [];

      for (const nurse of allNurses) {
        if (seenUserIds.has(nurse.userId.toString())) {
          duplicates.push(nurse._id);
        } else {
          seenUserIds.add(nurse.userId.toString());
        }
      }

      if (duplicates.length > 0) {
        const deleteResult = await Nurse.deleteMany({ _id: { $in: duplicates } });
        console.log('Deleted duplicate nurses:', deleteResult.deletedCount);
      }

      return res.json({ 
        ok: true, 
        indexDropped: true, 
        duplicatesRemoved: duplicates.length,
        message: 'Nurse collection fixed!'
      });
    } catch (err) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  });
}

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).send('Page not found');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
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

    // Save photo if uploaded
    if (req.file) {
      user.profile.photo = "/uploads/" + req.file.filename;
    }

    await user.save();

    // ⭐ IMPORTANT: Redirect to patient dashboard after saving
    return res.redirect("/patientportal");

  } catch (error) {
    console.error(error);
    return res.render("profile", {
      user: res.locals.currentUser,
      error: "Something went wrong while saving profile."
    });
  }
});
