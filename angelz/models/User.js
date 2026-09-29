const mongoose = require('mongoose');

const timingSchema = new mongoose.Schema({
  day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
  from: { type: String }, // "09:00"
  to: { type: String }    // "17:00"
});

const userSchema = new mongoose.Schema({
    name:{ type: String, required: true },
    last_name:{ type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    contact_no: {
    type: String,
    required: false,
    match: [/^\d{10,15}$/, "Please enter a valid contact number"],
    },
    description: { type: String },
    type: { type: String, enum: ['organization','volunteer'], default: 'user' },
    available_timing: [timingSchema],
    expertise: [{ type: String }],
    image: { type: String },
    isApproved: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending'},
    status: { type: String, enum: ['active','inactive'], default: 'active' },
    preferences: [{ type: String }],
    location: {
        city: String,
        state: String,
        country: String,
        zipcode: String,
        coordinates: {
            lat: Number,
            lng: Number
        }
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);