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

// Mongo URI for session store (ensure defined before session middleware)
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wecare';

// Load models
const User = require('./models/User');

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware (after body parsers)
app.use(session({
  secret: process.env.SESSION_SECRET || 'wecare-secret-change-me',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI || mongoUri }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 } // 7 days
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
      console.log('Sample users created: patient@example.com / nurse@example.com (password: password123)');
    }
  } catch (err) {
    console.error('Error during user seed:', err);
  }

}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// Routes
app.get('/', (req, res) => {
  res.render('index', { 
    page: 'home'
  });
});

app.get('/nurses', (req, res) => {
  // In production, fetch from database
  const nurses = [
    {
      id: 1,
      name: 'Priya Sharma',
      specialization: 'General Home Care Nurse',
      rating: 4.8,
      reviews: 145,
      distance: '2.5 km away',
      image: 'https://example.com/nurse1.jpg'
    }
    // Add more nurses...
  ];
  
  res.render('nurses', { 
    page: 'nurses',
    nurses: nurses
  });
});

app.get('/booking', (req, res) => {
  const nurseId = req.query.nurse;
  
  // In production, fetch nurse details from database
  const nurse = {
    id: nurseId,
    name: 'Priya Sharma',
    specialization: 'General Home Care Nurse'
  };
  
  res.render('booking', { 
    page: 'booking',
    nurse: nurse,
    appointments: []
  });
});

app.get('/login', (req, res) => {
  // If already logged in, redirect to their portal
  if (req.session && req.session.userId) {
    // redirect based on role
    if (req.session.role === 'nurse') return res.redirect('/nurseportal');
    return res.redirect('/patientportal');
  }

  // If redirected from signup, show a success message and optionally prefill email/role
  const success = req.query.signup ? 'Account created successfully. Please sign in.' : undefined;
  const email = req.query.email || undefined;
  const role = req.query.role || undefined;
  res.render('login', { success, email, role });
});

// Signup
app.get('/signup', (req, res) => {
  res.render('signup', { form: { role: 'patient' } });
});

app.post('/signup', async (req, res) => {
  const { name, email, password, confirm, role } = req.body;
  // Basic validation
  if (!name || !email || !password || !confirm) {
    return res.status(400).render('signup', { error: 'All fields are required.', form: { name, email, role } });
  }
  if (password !== confirm) {
    return res.status(400).render('signup', { error: 'Passwords do not match.', form: { name, email, role } });
  }

  try {
    // Check for existing user
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).render('signup', { error: 'An account with that email already exists.', form: { name, email, role } });
    }

  const newUser = await User.create({ name: name.trim(), email: email.toLowerCase().trim(), password, role: role || 'patient' });
  console.log('New user created:', newUser.email, newUser.role);
  // After signup, set session and redirect to patient portal (auto-login)
  req.session.userId = newUser._id;
  req.session.role = newUser.role;
  return res.redirect('/patientportal');
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).render('signup', { error: 'Failed to create account. Please try again.', form: { name, email, role } });
  }
});

app.post('/login', async (req, res) => {
  const { email, password, role: selectedRole } = req.body;
  console.log('Login attempt:', { email, selectedRole });
  if (!email || !password) return res.status(400).render('login', { error: 'Email and password required.' });

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      console.log('Login failed: user not found for', email);
      return res.status(401).render('login', { error: 'Invalid email or password.' });
    }

    const match = await user.comparePassword(password);
    console.log('Password match for', email, ':', !!match);
    if (!match) {
      return res.status(401).render('login', { error: 'Invalid email or password.' });
    }

    // If the client selected a role, ensure it matches the account role
    if (selectedRole && selectedRole !== user.role) {
      return res.status(403).render('login', { error: `Selected role (${selectedRole}) does not match account role.` });
    }

  // Create session and redirect based on user's role
  req.session.userId = user._id;
  req.session.role = user.role;
  if (user.role === 'nurse') return res.redirect('/nurseportal');
  return res.redirect('/patientportal');
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).render('login', { error: 'Internal server error. Please try again.' });
  }
});

app.get('/patientportal', (req, res) => {
  // Require authenticated patient
  if (!req.session || !req.session.userId) return res.redirect('/login');
  if (req.session.role !== 'patient') return res.status(403).send('Forbidden');
  
  // Load current user from res.locals
  const user = res.locals.currentUser || {};
  res.render('patientportal', { patient: user });
});

app.get('/nurseportal', (req, res) => {
  if (!req.session || !req.session.userId) return res.redirect('/login');
  if (req.session.role !== 'nurse') return res.status(403).send('Forbidden');
  const nurse = res.locals.currentUser || {};
  res.render('nurseportal', { nurse: nurse, appointmentCount: 3 });
});

// Profile routes (view and update)
app.get('/profile', (req, res) => {
  if (!req.session || !req.session.userId) return res.redirect('/login');
  // Only patients for now
  if (req.session.role !== 'patient') return res.status(403).send('Forbidden');
  const user = res.locals.currentUser || {};
  return res.render('profile', { user });
});

app.post('/profile', async (req, res) => {
  if (!req.session || !req.session.userId) return res.redirect('/login');
  if (req.session.role !== 'patient') return res.status(403).send('Forbidden');
  try {
    const update = {
      name: req.body.name,
      profile: {
        phone: req.body.phone || '',
        dob: req.body.dob || undefined,
        gender: req.body.gender || '',
        address: req.body.address || '',
        city: req.body.city || '',
        state: req.body.state || '',
        zip: req.body.zip || '',
        emergencyContact: req.body.emergencyContact || '',
        notes: req.body.notes || '',
        bloodGroup: req.body.bloodGroup || ''
      }
    };
    await User.findByIdAndUpdate(req.session.userId, update, { new: true, runValidators: true });
    const user = await User.findById(req.session.userId).lean();
    return res.render('profile', { user, success: 'Profile updated.' });
  } catch (err) {
    console.error('Profile update error:', err);
    return res.status(500).render('profile', { user: res.locals.currentUser || {}, error: 'Failed to update profile.' });
  }
});

app.get('/news', (req, res) => {
  res.render('news', {
    page: 'news'
  });
});

app.get('/services', (req, res) => {
  res.render('services', {
    page: 'services'
  });
});

app.get('/prescriptions', (req, res) => {
  res.render('prescriptions');
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
}

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    res.clearCookie('connect.sid');
    return res.redirect('/login');
  });
});

// Error handling
app.use((req, res) => {
  res.status(404).send('Page not found');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});