import mongoose from 'mongoose';

const aiVisitorUsageSchema = new mongoose.Schema({
  visitorKey: { type: String, required: true, unique: true, index: true },
  windowStartedAt: { type: Date, required: true, default: Date.now },
  fileUploads: { type: Number, default: 0 },
  imageUploads: { type: Number, default: 0 },
  chatMessages: { type: Number, default: 0 },
  // Security: track reschedule attempts and failed clientReference lookups
  rescheduleAttempts: { type: Number, default: 0 },
  failedRefAttempts: { type: Number, default: 0 },
}, { timestamps: true });

const AIVisitorUsage = mongoose.model('AIVisitorUsage', aiVisitorUsageSchema);
export default AIVisitorUsage;

