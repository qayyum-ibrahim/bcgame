const mongoose = require('mongoose');

const RoundSchema = new mongoose.Schema({
  roundId: {
    type: String,
    required: true,
    unique: true
  },
  crashPoint: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    required: true
  },
  hourOfDay: {
    type: Number
  },
  dayOfWeek: {
    type: Number
  }
});

module.exports = mongoose.model('Round', RoundSchema);