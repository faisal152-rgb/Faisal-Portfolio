// Socket.io service for real-time updates
let ioInstance = null;

export const initializeSocket = (io) => {
  ioInstance = io;
  
  io.on('connection', (socket) => {
    // Join admin room for real-time admin updates
    socket.on('join-admin', () => {
      socket.join('admin');
    });
    
    // Join public room for portfolio updates
    socket.on('join-public', () => {
      socket.join('public');
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
    });
    
    // Handle errors
    socket.on('error', (error) => {
    });
  });
  
  // Periodic heartbeat
  setInterval(() => {
    io.emit('heartbeat', { timestamp: new Date().toISOString() });
  }, 30000);
  
  return io;
};

export const getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.io not initialized');
  }
  return ioInstance;
};

// Emit portfolio updates to all connected clients
export const emitPortfolioUpdate = (type, data) => {
  if (ioInstance) {
    ioInstance.to('public').emit('portfolio:update', {
      type,
      data,
      timestamp: new Date().toISOString(),
    });
    ioInstance.to('admin').emit('portfolio:update', {
      type,
      data,
      timestamp: new Date().toISOString(),
    });
  }
};

// Emit message updates
export const emitMessageUpdate = (type, data) => {
  if (ioInstance) {
    ioInstance.to('admin').emit('messages:update', {
      type,
      data,
      timestamp: new Date().toISOString(),
    });
  }
};

// Emit lead updates
export const emitLeadUpdate = (type, data) => {
  if (ioInstance) {
    ioInstance.to('admin').emit('leads:update', {
      type,
      data,
      timestamp: new Date().toISOString(),
    });
  }
};

// Emit AI updates
export const emitAIUpdate = (type, data) => {
  if (ioInstance) {
    ioInstance.to('admin').emit('ai:update', {
      type,
      data,
      timestamp: new Date().toISOString(),
    });
  }
};

// Emit security updates
export const emitSecurityUpdate = (type, data) => {
  if (ioInstance) {
    ioInstance.to('admin').emit('security:update', {
      type,
      data,
      timestamp: new Date().toISOString(),
    });
  }
};

// Notify admin of new contact message
export const notifyNewMessage = (message) => {
  if (ioInstance) {
    ioInstance.to('admin').emit('notification', {
      type: 'new-message',
      title: 'New Contact Message',
      message: `${message.name} sent a message: ${message.subject}`,
      data: message,
      timestamp: new Date().toISOString(),
    });
  }
};

// Notify admin of new lead
export const notifyNewLead = (lead) => {
  if (ioInstance) {
    ioInstance.to('admin').emit('notification', {
      type: 'new-lead',
      title: 'New Business Lead',
      message: `${lead.name} is interested in ${lead.service}`,
      data: lead,
      timestamp: new Date().toISOString(),
    });
  }
};

// Broadcast system notification
export const broadcastNotification = (notification) => {
  if (ioInstance) {
    ioInstance.to('admin').emit('notification', {
      ...notification,
      timestamp: new Date().toISOString(),
    });
  }
};