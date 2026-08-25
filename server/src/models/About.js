import mongoose from 'mongoose';

const aboutSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters'],
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    trim: true,
    maxlength: [100, 'Role cannot exceed 100 characters'],
  },
  university: {
    type: String,
    trim: true,
    maxlength: [100, 'University name too long'],
  },
  degree: {
    type: String,
    trim: true,
    maxlength: [100, 'Degree name too long'],
  },
  years: {
    type: String,
    trim: true,
    maxlength: [20, 'Years format too long'],
  },
  location: {
    type: String,
    trim: true,
    maxlength: [100, 'Location too long'],
  },
  email: {
    type: String,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  profileImage: {
    type: String,
    trim: true,
    maxlength: [500, 'Profile image URL too long'],
  },
  resume: {
    type: String,
    trim: true,
    maxlength: [500, 'Resume URL too long'],
  },
  stats: [{
    value: {
      type: String,
      required: true,
      trim: true,
      maxlength: [20, 'Stat value too long'],
    },
    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: [50, 'Stat label too long'],
    },
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Add indexes for better query performance
aboutSchema.index({ isActive: 1 });

const About = mongoose.model('About', aboutSchema);
export default About;
