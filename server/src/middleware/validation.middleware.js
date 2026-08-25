import { body, param, query, validationResult } from 'express-validator';
import { asyncHandler } from './error.middleware.js';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value,
      })),
    });
  }
  
  next();
};

// Auth validators
export const registerValidator = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
];

export const loginValidator = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

// Portfolio validators
export const heroValidator = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  body('subtitle')
    .trim()
    .isLength({ min: 1, max: 150 })
    .withMessage('Subtitle must be between 1 and 150 characters'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Description must be between 1 and 500 characters'),
  body('freelance')
    .optional()
    .isArray()
    .withMessage('Freelance must be an array'),
  body('freelance.*.platform')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Platform name too long'),
  body('freelance.*.url')
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage('Invalid URL format'),
  body('freelance.*.label')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Label too long'),
  body('socialLinks')
    .optional()
    .isArray()
    .withMessage('Social links must be an array'),
  body('socialLinks.*.platform')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Platform name too long'),
  body('socialLinks.*.url')
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (/^(https?:\/\/|mailto:)\S+$/.test(value)) return true;
      throw new Error('Invalid social link URL format');
    }),
];

export const aboutValidator = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Name must be between 1 and 50 characters'),
  body('role')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Role must be between 1 and 100 characters'),
  body('university')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('University name too long'),
  body('degree')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Degree name too long'),
  body('years')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Years format too long'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location too long'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email format'),
  body('profileImage')
    .optional({ checkFalsy: true })
    .isString()
    .withMessage('Profile image must be a string'),
  body('resume')
    .optional({ checkFalsy: true })
    .isString()
    .withMessage('Resume must be a string'),
  body('stats')
    .optional()
    .isArray()
    .withMessage('Stats must be an array'),
  body('stats.*.value')
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Stat value too long'),
  body('stats.*.label')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Stat label too long'),
];

export const skillValidator = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Title must be between 1 and 50 characters'),
  body('skills')
    .isArray({ min: 1 })
    .withMessage('At least one skill is required'),
  body('skills.*.name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Skill name must be between 1 and 50 characters'),
  body('skills.*.value')
    .isInt({ min: 0, max: 100 })
    .withMessage('Skill value must be between 0 and 100'),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a positive integer'),
];

export const timelineValidator = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Description must be between 1 and 500 characters'),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a positive integer'),
];

export const serviceValidator = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Description must be between 1 and 500 characters'),
  body('icon')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Icon name must be between 1 and 50 characters'),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a positive integer'),
];

export const projectValidator = [
  body('id')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Project ID must be between 1 and 50 characters'),
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('tagline')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Tagline must be between 1 and 200 characters'),
  body('tech')
    .optional()
    .isArray()
    .withMessage('Tech must be an array'),
  body('tech.*')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Technology name too long'),
  body('liveUrl')
    .optional()
    .isURL()
    .withMessage('Invalid live URL'),
  body('codeUrl')
    .optional()
    .isURL()
    .withMessage('Invalid code URL'),
  body('brandIcon')
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage('Brand icon name too long'),
  body('brandColor')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Invalid hex color format'),
  body('subText')
    .optional()
    .trim(),
  body('clientName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Client name too long'),
  body('keyFeatures')
    .optional()
    .isArray()
    .withMessage('Key features must be an array'),
  body('keyFeatures.*')
    .optional()
    .trim(),
  body('stats')
    .optional()
    .isArray()
    .withMessage('Stats must be an array'),
  body('stats.*.value')
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Stat value too long'),
  body('stats.*.label')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Stat label too long'),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a positive integer'),
];

// Message validators
export const messageValidator = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Name must be between 1 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('subject')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Subject must be between 1 and 100 characters'),
  body('message')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Message must be between 10 and 2000 characters'),
];

// Lead validators
export const leadValidator = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Name must be between 1 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 30 })
    .withMessage('Phone number cannot exceed 30 characters'),
  body('service')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Service must be between 1 and 100 characters'),
  body('status')
    .optional()
    .isIn(['New', 'Contacted', 'In Progress', 'Converted', 'Lost'])
    .withMessage('Invalid status'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
  body('source')
    .optional()
    .isIn(['website', 'ai-assistant', 'referral', 'social', 'email', 'other'])
    .withMessage('Invalid source'),
];

export const publicLeadUpdateValidator = [
  body('name').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Name must be between 1 and 50 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('phone').optional({ checkFalsy: true }).trim().isLength({ max: 30 }).withMessage('Phone number cannot exceed 30 characters'),
  body('service').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Service must be between 1 and 100 characters'),
  body('notes').optional().trim().isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters'),
];

// AI validators
export const aiSettingsValidator = [
  body('assistantEnabled')
    .optional()
    .isBoolean()
    .withMessage('assistantEnabled must be boolean'),
  body('chatEnabled')
    .optional()
    .isBoolean()
    .withMessage('chatEnabled must be boolean'),
  body('voiceEnabled')
    .optional()
    .isBoolean()
    .withMessage('voiceEnabled must be boolean'),
  body('fileUploadEnabled')
    .optional()
    .isBoolean()
    .withMessage('fileUploadEnabled must be boolean'),
  body('uploadLimits').optional().isObject().withMessage('uploadLimits must be an object'),
  body('uploadLimits.maxFileUploads').optional().isInt({ min: 0, max: 1000 }).withMessage('maxFileUploads must be between 0 and 1000'),
  body('uploadLimits.maxImageUploads').optional().isInt({ min: 0, max: 1000 }).withMessage('maxImageUploads must be between 0 and 1000'),
  body('uploadLimits.maxChatMessages').optional().isInt({ min: 0, max: 10000 }).withMessage('maxChatMessages must be between 0 and 10000'),
  body('uploadLimits.windowHours').optional().isInt({ min: 1, max: 720 }).withMessage('windowHours must be between 1 and 720'),
  body('autoDetectEnabled')
    .optional()
    .isBoolean()
    .withMessage('autoDetectEnabled must be boolean'),
  body('emotionEnabled')
    .optional()
    .isBoolean()
    .withMessage('emotionEnabled must be boolean'),
  body('defaultMode')
    .optional()
    .isIn(['Auto Detect', 'Chat', 'Voice'])
    .withMessage('Invalid default mode'),
  body('language')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Language too long'),
  body('emotionDetect')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Emotion detect too long'),
];

export const aiModelValidator = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Model name must be between 1 and 100 characters'),
  body('provider')
    .isIn(['nvidia', 'openai', 'anthropic', 'google', 'local', 'custom', 'huggingface', 'mistral', 'cohere', 'xenon', 'other'])
    .withMessage('Invalid provider'),
  body('modelId')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Model ID must be between 1 and 100 characters'),
  body('apiKey')
    .optional({ checkFalsy: true })  // Skip validation if empty/null/undefined
    .trim()
    .isLength({ min: 1 })
    .withMessage('API key cannot be empty'),
  body('endpoint')
    .optional({ checkFalsy: true })  // Skip validation if empty/null/undefined
    .trim()
    .isURL()
    .withMessage('Invalid endpoint URL'),
  body('maxTokens')
    .optional()
    .isInt({ min: 1, max: 128000 })
    .withMessage('Max tokens must be between 1 and 128000'),
  body('temperature')
    .optional()
    .isFloat({ min: 0, max: 2 })
    .withMessage('Temperature must be between 0 and 2'),
  body('capabilities')
    .optional()
    .isArray()
    .withMessage('Capabilities must be an array'),
];

export const aiPersonaValidator = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Persona name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description too long'),
  body('systemPrompt')
    .trim()
    .isLength({ min: 10, max: 3000 })
    .withMessage('System prompt must be between 10 and 3000 characters'),
  body('temperature')
    .optional()
    .isFloat({ min: 0, max: 2 })
    .withMessage('Temperature must be between 0 and 2'),
  body('maxTokens')
    .optional()
    .isInt({ min: 1, max: 128000 })
    .withMessage('Max tokens must be between 1 and 128000'),
];

export const aiKnowledgeValidator = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('content')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters'),
  body('category')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Category too long'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage('Tag too long'),
  body('source')
    .optional()
    .isIn(['manual', 'website', 'document', 'api'])
    .withMessage('Invalid source'),
  body('sourceUrl')
    .optional({ values: 'falsy' })
    .isURL()
    .withMessage('Invalid source URL'),
];

export const aiApiKeyValidator = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('provider')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Provider must be between 1 and 50 characters'),
  body('key')
    .trim()
    .isLength({ min: 10 })
    .withMessage('API key too short'),
  body('rateLimit.requestsPerMinute')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Requests per minute must be between 1 and 1000'),
  body('rateLimit.requestsPerDay')
    .optional()
    .isInt({ min: 1, max: 100000 })
    .withMessage('Requests per day must be between 1 and 100000'),
];

// Common validators
export const idValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
];

export const paginationValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sort')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort must be asc or desc'),
];
