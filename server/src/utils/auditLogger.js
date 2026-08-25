import AuditLog from '../models/AuditLog.js';

export const logAuditEvent = async ({ type, message, ipAddress, userAgent, performedBy }) => {
  try {
    await AuditLog.create({
      type,
      message,
      ipAddress,
      userAgent,
      performedBy,
    });
  } catch (error) {
    console.error('[AuditLog] Failed to create log entry:', error.message);
  }
};
