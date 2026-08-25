import { asyncHandler } from '../middleware/error.middleware.js';

export const buildSystemStatusResponse = ({
  isOperational = true,
  message = '',
  statusText = 'Available for Opportunities',
  statusLabel = 'Available',
  updatedAt = new Date().toISOString(),
} = {}) => {
  const operational = Boolean(isOperational);

  if (operational) {
    return {
      success: true,
      data: {
        isOperational: true,
        status: 'operational',
        statusText,
        statusLabel,
        message: message || 'System is operational',
        updatedAt,
      },
    };
  }

  return {
    success: false,
    data: {
      isOperational: false,
      status: 'offline',
      statusText: 'System temporarily offline',
      statusLabel: 'Offline',
      message: message || 'System is currently offline',
      updatedAt,
    },
  };
};

export const getSystemStatus = asyncHandler(async (req, res) => {
  const response = buildSystemStatusResponse({
    isOperational: true,
    statusText: 'Available for Opportunities',
    statusLabel: 'Available',
  });

  return res.status(200).json(response);
});
