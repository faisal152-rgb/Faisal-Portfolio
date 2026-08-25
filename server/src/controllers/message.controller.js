import Message from '../models/Message.js';
import AIConfig from '../models/AIConfig.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { io } from '../index.js';

const emitUpdate = (type, data) => {
  io.emit('messages:update', { type, data, timestamp: new Date().toISOString() });
};

// ============ NOTIFICATION FUNCTIONS ============
const getOrCreateConfig = async () => {
  let config = await AIConfig.findOne();
  if (!config) {
    config = await AIConfig.create({});
  }
  return config;
};

const sendGmail = async (integration, recipient, subject, body) => {
  if (!integration?.enabled) {
    console.log('[Gmail] Integration not enabled');
    return false;
  }
  if (!integration.accessToken) {
    console.log('[Gmail] No access token configured');
    return false;
  }
  if (!recipient) {
    console.log('[Gmail] No recipient email provided');
    return false;
  }
  
  try {
    const raw = [`To: ${recipient}`, `Subject: ${subject}`, 'Content-Type: text/plain; charset=utf-8', '', body].join('\r\n');
    const encoded = Buffer.from(raw).toString('base64url');
    console.log(`[Gmail] Sending message to ${recipient}...`);
    
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${integration.accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: encoded }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Gmail] Failed (${response.status}): ${errorText}`);
      return false;
    }
    
    console.log(`[Gmail] ✓ Successfully sent to ${recipient}`);
    return true;
  } catch (error) {
    console.error('[Gmail] Error:', error.message);
    return false;
  }
};

const sendWhatsApp = async (integration, phone, body) => {
  if (!integration?.enabled) {
    console.log('[WhatsApp] Integration not enabled');
    return false;
  }
  if (!integration.accessToken) {
    console.log('[WhatsApp] No access token configured');
    return false;
  }
  if (!integration.phoneNumberId) {
    console.log('[WhatsApp] No phone number ID configured');
    return false;
  }
  if (!phone) {
    console.log('[WhatsApp] No recipient phone provided');
    return false;
  }
  
  try {
    const cleanPhone = phone.replace(/[^\d+]/g, '').replace(/^0+/, '+');
    const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;
    
    console.log(`[WhatsApp] Sending message to ${formattedPhone} (from: ${phone})...`);
    
    const response = await fetch(`https://graph.facebook.com/v19.0/${integration.phoneNumberId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${integration.accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        messaging_product: 'whatsapp', 
        to: formattedPhone, 
        type: 'text', 
        text: { body } 
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[WhatsApp] Failed (${response.status}): ${errorText}`);
      return false;
    }
    
    console.log(`[WhatsApp] ✓ Successfully sent to ${formattedPhone}`);
    return true;
  } catch (error) {
    console.error('[WhatsApp] Error:', error.message);
    return false;
  }
};

// @desc    Get all messages (admin)
// @route   GET /api/messages
// @access  Private/Admin
export const getMessages = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const status = req.query.status;
  const sort = req.query.sort || 'desc';
  
  const query = {};
  if (status) query.status = status;
  
  const messages = await Message.find(query)
    .sort({ createdAt: sort === 'asc' ? 1 : -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  
  const total = await Message.countDocuments(query);
  
  res.status(200).json({
    success: true,
    data: messages,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// @desc    Get single message
// @route   GET /api/messages/:id
// @access  Private/Admin
export const getMessage = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);
  
  if (!message) {
    return res.status(404).json({ success: false, message: 'Message not found' });
  }
  
  // Mark as read if it was NEW
  if (message.status === 'NEW') {
    message.status = 'READ';
    await message.save();
    emitUpdate('message-read', message);
  }
  
  res.status(200).json({ success: true, data: message });
});

// @desc    Create message (public - from contact form)
// @route   POST /api/messages
// @access  Public
export const createMessage = asyncHandler(async (req, res) => {
  const message = await Message.create({
    ...req.body,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });
  
  emitUpdate('message-new', message);
  
  // Send notifications to admin
  const config = await getOrCreateConfig();
  const adminEmail = config.integrations.gmail.email || process.env.ADMIN_EMAIL;
  const adminPhone = process.env.ADMIN_PHONE;
  
  if (adminEmail || adminPhone) {
    const outbound = [
      `New contact message from ${message.name}`,
      `Email: ${message.email}`,
      `Subject: ${message.subject}`,
      '',
      `Message: ${message.message}`,
    ].join('\n');
    
    const [gmailSent, whatsappSent] = await Promise.all([
      adminEmail ? sendGmail(config.integrations.gmail, adminEmail, `New Message: ${message.subject}`, outbound) : false,
      adminPhone ? sendWhatsApp(config.integrations.whatsapp, adminPhone, outbound) : false,
    ]);
    
    // Update message with notification status
    message.notifications = {
      gmail: gmailSent ? { sent: true, sentAt: new Date() } : { sent: false },
      whatsapp: whatsappSent ? { sent: true, sentAt: new Date() } : { sent: false },
    };
    await message.save();
  }
  
  res.status(201).json({ success: true, data: message, notifications: { gmailSent: message.notifications?.gmail?.sent || false, whatsappSent: message.notifications?.whatsapp?.sent || false } });
});

// @desc    Update message status
// @route   PUT /api/messages/:id
// @access  Private/Admin
export const updateMessage = asyncHandler(async (req, res) => {
  const message = await Message.findByIdAndUpdate(
    req.params.id,
    { ...req.body, repliedAt: req.body.status === 'REPLIED' ? new Date() : undefined, repliedBy: req.user.id },
    { new: true, runValidators: true }
  );
  
  if (!message) {
    return res.status(404).json({ success: false, message: 'Message not found' });
  }
  
  // Send reply notification if status changed to REPLIED
  if (req.body.status === 'REPLIED' && message.email) {
    const config = await getOrCreateConfig();
    const replyMessage = [
      `Thank you for contacting us!`,
      `We have received your message regarding: "${message.subject}"`,
      `Our team will respond to you shortly.`,
      '',
      `Best regards,`,
      `Faisal's Team`,
    ].join('\n');
    
    const [gmailSent, whatsappSent] = await Promise.all([
      sendGmail(config.integrations.gmail, message.email, `Re: ${message.subject}`, replyMessage),
      message.email ? sendWhatsApp(config.integrations.whatsapp, message.email, replyMessage) : false,
    ]);
    
    if (gmailSent || whatsappSent) {
      message.notifications = message.notifications || {};
      if (gmailSent) message.notifications.gmail = { sent: true, sentAt: new Date() };
      if (whatsappSent) message.notifications.whatsapp = { sent: true, sentAt: new Date() };
      await message.save();
    }
  }
  
  emitUpdate('message-update', message);
  res.status(200).json({ success: true, data: message });
});

// @desc    Delete message
// @route   DELETE /api/messages/:id
// @access  Private/Admin
export const deleteMessage = asyncHandler(async (req, res) => {
  const message = await Message.findByIdAndDelete(req.params.id);
  
  if (!message) {
    return res.status(404).json({ success: false, message: 'Message not found' });
  }
  
  emitUpdate('message-delete', { id: req.params.id });
  res.status(200).json({ success: true, message: 'Message deleted' });
});

// @desc    Get message stats
// @route   GET /api/messages/stats
// @access  Private/Admin
export const getMessageStats = asyncHandler(async (req, res) => {
  const stats = await Message.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $project: { status: '$_id', count: 1, _id: 0 } },
  ]);
  
  const total = await Message.countDocuments();
  const unread = await Message.countDocuments({ status: 'NEW' });
  const today = await Message.countDocuments({
    createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
  });
  
  res.status(200).json({
    success: true,
    data: { total, unread, today, byStatus: stats },
  });
});