import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema({
  lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  preferredDate: { type: String, required: true, trim: true, maxlength: 40 },
  preferredTime: { type: String, required: true, trim: true, maxlength: 40 },
  timezone: { type: String, trim: true, maxlength: 80, default: 'UTC' },
  status: { type: String, enum: ['PENDING_CONFIRMATION', 'SCHEDULED', 'FAILED'], default: 'PENDING_CONFIRMATION' },
  externalEventId: { type: String, trim: true },
  notes: { type: String, trim: true, maxlength: 1000 },
  // Security: track how many times this meeting has been rescheduled
  rescheduleCount: { type: Number, default: 0, min: 0, max: 10 },
  lastRescheduledAt: { type: Date },
}, { timestamps: true });

const Meeting = mongoose.model('Meeting', meetingSchema);
export default Meeting;

