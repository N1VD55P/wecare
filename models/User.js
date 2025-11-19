// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['patient', 'nurse', 'admin'], default: 'patient' },
  profile: {
    phone: { type: String, default: '' },
    dob: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other', ''], default: '' },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    zip: { type: String, default: '' },
    emergencyContact: { type: String, default: '' },
    notes: { type: String, default: '' },
    bloodGroup: { type: String, default: '' }
  }
  ,
  // Medical / appointment history: array of small entries
  history: [{
    date: { type: Date, default: Date.now },
    category: { type: String, default: '' }, // appointment, checkup, prescription, etc
    notes: { type: String, default: '' },
    meta: { type: mongoose.Schema.Types.Mixed }
  }]
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function (next) {
  const user = this;
  if (!user.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(user.password, salt);
    user.password = hash;
    next();
  } catch (err) {
    next(err);
  }
});

// Instance method to compare password
UserSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
