const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  totalClasses: {
    type: Number,
    required: true,
    default: 0,
  },
  attendedClasses: {
    type: Number,
    required: true,
    default: 0,
  },
  canceledClasses: {
    type: Number,
    required: true,
    default: 0,
  },
});

const Subject = mongoose.model('Subject', subjectSchema);

module.exports = Subject;
