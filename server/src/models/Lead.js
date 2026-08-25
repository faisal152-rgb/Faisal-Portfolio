import mongoose from 'mongoose';
import { randomBytes } from 'crypto';

const leadSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  phone: {
    type: String,
    trim: true,
    maxlength: [30, 'Phone number cannot exceed 30 characters'],
  },
  service: {
    type: String,
    required: [true, 'Service is required'],
    trim: true,
    maxlength: [100, 'Service name too long'],
  },
  status: {
    type: String,
    enum: ['New', 'Contacted', 'In Progress', 'Converted', 'Lost'],
    default: 'New',
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters'],
  },
  source: {
    type: String,
    enum: ['website', 'ai-assistant', 'referral', 'social', 'email', 'other'],
    default: 'website',
  },
  clientReference: {
    type: String,
    unique: true,
    index: true,
    default: () => randomBytes(16).toString('hex'),
    select: false,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  contactedAt: {
    type: Date,
  },
  convertedAt: {
    type: Date,
  },
  // Notification tracking
  notifications: {
    gmail: {
      sent: { type: Boolean, default: false },
      sentAt: { type: Date },
      error: { type: String },
    },
    whatsapp: {
      sent: { type: Boolean, default: false },
      sentAt: { type: Date },
      error: { type: String },
    },
  },
}, {
  timestamps: true,
});

const Lead = mongoose.model('Lead', leadSchema);
export default Lead;