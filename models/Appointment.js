// models/Appointment.js
const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  nurseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Nurse', required: true },
  nurseName: { type: String, required: true },
  nurseImage: { type: String },
  specialization: { type: String },
  serviceType: { type: String, required: true }, // Consultation, Home visit, Emergency
  servicePrice: { type: Number, required: true },
  appointmentDate: { type: Date, required: true },
  appointmentTime: { type: String, required: true },
  paymentMethod: { type: String }, // CARD, NET BANKING, WALLET
  insuranceCoverage: { type: Boolean, default: false },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'confirmed'
  },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', AppointmentSchema);
