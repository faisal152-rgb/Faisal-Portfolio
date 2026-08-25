import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: [
      'LOGIN',
      'LOGIN_FAILED',
      'PASSWORD_CHANGE',
      'USER_CREATE',
      'SETTINGS_CHANGE',
      'IP_BLOCKED',
      'IP_UNBLOCKED',
      'USER_ACTIVATE',
      'USER_DEACTIVATE',
      'USER_UNLOCK',
      'RATE_LIMITS_CHANGE'
    ],
  },
  message: {
    type: String,
    required: true,
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  },
  performedBy: {
    type: String,
  },
}, {
  timestamps: true,
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
