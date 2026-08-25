import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
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
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [100, 'Subject cannot exceed 100 characters'],
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters'],
  },
  status: {
    type: String,
    enum: ['NEW', 'READ', 'REPLIED', 'ARCHIVED'],
    default: 'NEW',
  },
  ipAddress: {
    type: String,
    trim: true,
  },
  userAgent: {
    type: String,
    trim: true,
  },
  repliedAt: {
    type: Date,
  },
  repliedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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

const Message = mongoose.model('Message', messageSchema);
export default Message;