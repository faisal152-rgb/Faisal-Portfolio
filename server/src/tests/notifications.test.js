import { describe, it, expect } from 'vitest';
import Message from '../models/Message.js';
import Lead from '../models/Lead.js';
import Meeting from '../models/Meeting.js';

describe('Notification Tracking & Reschedule Model Schemas', () => {
  it('Message model contains correct notification tracking fields', () => {
    const paths = Message.schema.paths;
    
    // Check Gmail tracking paths
    expect(paths['notifications.gmail.sent']).toBeDefined();
    expect(paths['notifications.gmail.sentAt']).toBeDefined();
    expect(paths['notifications.gmail.error']).toBeDefined();
    
    // Check WhatsApp tracking paths
    expect(paths['notifications.whatsapp.sent']).toBeDefined();
    expect(paths['notifications.whatsapp.sentAt']).toBeDefined();
    expect(paths['notifications.whatsapp.error']).toBeDefined();
    
    expect(paths['notifications.gmail.sent'].instance).toBe('Boolean');
    expect(paths['notifications.whatsapp.sent'].instance).toBe('Boolean');
  });

  it('Lead model contains correct notification tracking fields', () => {
    const paths = Lead.schema.paths;
    
    // Check Gmail tracking paths
    expect(paths['notifications.gmail.sent']).toBeDefined();
    expect(paths['notifications.gmail.sentAt']).toBeDefined();
    expect(paths['notifications.gmail.error']).toBeDefined();
    
    // Check WhatsApp tracking paths
    expect(paths['notifications.whatsapp.sent']).toBeDefined();
    expect(paths['notifications.whatsapp.sentAt']).toBeDefined();
    expect(paths['notifications.whatsapp.error']).toBeDefined();
    
    expect(paths['notifications.gmail.sent'].instance).toBe('Boolean');
    expect(paths['notifications.whatsapp.sent'].instance).toBe('Boolean');
  });

  it('Meeting model contains correct reschedule tracking fields', () => {
    const paths = Meeting.schema.paths;
    
    expect(paths['rescheduleCount']).toBeDefined();
    expect(paths['rescheduleCount'].instance).toBe('Number');
    expect(paths['lastRescheduledAt']).toBeDefined();
    expect(paths['lastRescheduledAt'].instance).toBe('Date');
  });
});
