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
  } catch (err) {
    res.render('nurses', { page: 'nurses', nurses: [] });
  }
});

// Booking page
app.get('/booking', (req, res) => {
  const nurseId = req.query.nurse;
  const nurse = { id: nurseId, name: 'Priya Sharma', specialization: 'General Home Care Nurse' };
  res.render('booking', { page: 'booking', nurse, appointments: [] });
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

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).render('login', { error: 'Invalid credentials.' });

    if (selectedRole && selectedRole !== user.role) {
      return res.status(403).render('login', { error: 'Role mismatch.' });
    }

    req.session.userId = user._id;
    req.session.role = user.role;

    if (user.role === 'nurse') return res.redirect('/nurseportal');
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
