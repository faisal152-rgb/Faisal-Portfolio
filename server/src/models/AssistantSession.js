import mongoose from 'mongoose';

const assistantSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true, index: true },
  messages: [{
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true, maxlength: 4000 },
    createdAt: { type: Date, default: Date.now },
  }],
  lead: {
    name: { type: String, trim: true, maxlength: 50 },
    email: { type: String, trim: true, maxlength: 254 },
    phone: { type: String, trim: true, maxlength: 30 },
    service: { type: String, trim: true, maxlength: 100 },
    notes: { type: String, trim: true, maxlength: 1000 },
  },
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  meetingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Meeting' },
  // Temporarily stored during a mid-conversation meeting reschedule flow
  pendingRescheduleRef: { type: String, trim: true, maxlength: 32 },
}, { timestamps: true });

const AssistantSession = mongoose.model('AssistantSession', assistantSessionSchema);
export default AssistantSession;
