// models/Nurse.js
const mongoose = require('mongoose');

const NurseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  specialization: { type: String, default: '' },
  rating: { type: Number, default: 4.5, min: 0, max: 5 },
  reviews: { type: Number, default: 0 },
  distance: { type: String, default: '0 km away' },
  profileImage: { type: String, default: 'https://i.pinimg.com/736x/42/96/46/429646366c50688783ed4239528f7e95.jpg' },
  hourlyRate: { type: String, default: '0' },
  experience: { type: String, default: '' },
  licenseNumber: { type: String, default: '' },
  certifications: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Nurse', NurseSchema);
