// server.js
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

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
  res.render('login');
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  // Add authentication logic here
  res.redirect('/patientportal');
});

app.get('/patientportal', (req, res) => {
  // In production, fetch patient data from database
  const patient = {
    name: 'Advi'
  };
  
  res.render('patientportal', {
    patient: patient
  });
});

app.get('/nurseportal', (req, res) => {
  // In production, fetch nurse data from database
  const nurse = {
    name: 'Meera'
  };
  
  res.render('nurseportal', {
    nurse: nurse,
    appointmentCount: 3
  });
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

// Error handling
app.use((req, res) => {
  res.status(404).send('Page not found');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});