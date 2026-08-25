import mongoose from 'mongoose';

const aiConfigSchema = new mongoose.Schema({
  // AI Assistant Settings
  assistantEnabled: {
    type: Boolean,
    default: true,
  },
  chatEnabled: {
    type: Boolean,
    default: true,
  },
  voiceEnabled: {
    type: Boolean,
    default: true,
  },
  fileUploadEnabled: {
    type: Boolean,
    default: false,
  },
  uploadLimits: {
    maxFileUploads: { type: Number, default: 2, min: 0 },
    maxImageUploads: { type: Number, default: 3, min: 0 },
    maxChatMessages: { type: Number, default: 50, min: 0 },
    windowHours: { type: Number, default: 24, min: 1, max: 720 },
  },
  autoDetectEnabled: {
    type: Boolean,
    default: true,
  },
  emotionEnabled: {
    type: Boolean,
    default: true,
  },
  defaultMode: {
    type: String,
    enum: ['Auto Detect', 'Chat', 'Voice'],
    default: 'Chat',
  },
  language: {
    type: String,
    default: 'Auto Detect',
  },
  emotionDetect: {
    type: String,
    default: 'Auto Detect',
  },
  workingHours: {
    type: String,
    trim: true,
    default: '12:00 PM - 11:59 PM',
  },
  // AI Model Configuration
  models: [{
    name: {
      type: String,
      required: true,
      trim: true,
    },
    provider: {
      type: String,
      required: true,
      enum: ['nvidia', 'openai', 'anthropic', 'google', 'local', 'custom', 'huggingface', 'mistral', 'cohere', 'xenon', 'other'],
    },
    modelId: {
      type: String,
      required: true,
      trim: true,
    },
    apiKey: {
      type: String,
      trim: true,
    },
    endpoint: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    maxTokens: {
      type: Number,
      default: 4096,
    },
    temperature: {
      type: Number,
      default: 0.7,
      min: 0,
      max: 2,
    },
    capabilities: [{
      type: String,
      enum: ['chat', 'completion', 'embedding', 'vision', 'audio', 'function-calling'],
    }],
    costPer1kTokens: {
      input: { type: Number, default: 0 },
      output: { type: Number, default: 0 },
    },
  }],
  
  // Persona Configuration
  personas: [{
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description too long'],
    },
    timeSetting: {
      type: String,
      trim: true,
      maxlength: [80, 'Time setting too long'],
    },
    role: {
      type: String,
      trim: true,
      maxlength: [60, 'Role too long'],
    },
    emotion: {
      type: String,
      trim: true,
      maxlength: [40, 'Emotion too long'],
    },
    systemPrompt: {
      type: String,
      required: true,
      trim: true,
      maxlength: [3000, 'System prompt too long'],
    },
    temperature: {
      type: Number,
      default: 0.7,
      min: 0,
      max: 2,
    },
    maxTokens: {
      type: Number,
      default: 4096,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    avatar: {
      type: String,
      trim: true,
    },
    voice: {
      type: String,
      trim: true,
    },
  }],
  
  // Knowledge Base
  knowledgeBase: [{
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, 'Title too long'],
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      maxlength: [50, 'Category too long'],
    },
    tags: [{
      type: String,
      trim: true,
      maxlength: [30, 'Tag too long'],
    }],
    source: {
      type: String,
      enum: ['manual', 'website', 'document', 'api'],
      default: 'manual',
    },
    sourceUrl: {
      type: String,
      trim: true,
      validate: {
        validator: function(v) {
          return v === null || v === '' || /^https?:\/\/.+$/.test(v);
        },
        message: 'Invalid URL',
      }
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    embedding: {
      type: [Number],
      select: false,
    },
  }],
  
  // API Keys Management
  apiKeys: [{
    name: {
      type: String,
      required: true,
      trim: true,
    },
    provider: {
      type: String,
      required: true,
      trim: true,
    },
    key: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastUsed: {
      type: Date,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    rateLimit: {
      requestsPerMinute: { type: Number, default: 60 },
      requestsPerDay: { type: Number, default: 1000 },
    },
  }],
  
  // Integrations
  integrations: {
    gmail: {
      enabled: { type: Boolean, default: false },
      email: { type: String, trim: true },
      accessToken: { type: String, select: false },
      refreshToken: { type: String, select: false },
      expiry: { type: Date },
      scopes: [{ type: String }],
    },
    calendar: {
      enabled: { type: Boolean, default: false },
      email: { type: String, trim: true },
      accessToken: { type: String, select: false },
      refreshToken: { type: String, select: false },
      expiry: { type: Date },
      scopes: [{ type: String }],
    },
    whatsapp: {
      enabled: { type: Boolean, default: false },
      phoneNumber: { type: String, trim: true },
      accessToken: { type: String, select: false },
      phoneNumberId: { type: String, trim: true },
      businessAccountId: { type: String, trim: true },
      webhookUrl: { type: String, trim: true },
      verifyToken: { type: String, select: false },
    },
  },
  
  // Security Settings
  security: {
    rateLimit: {
      requestsPerMinute: { type: Number, default: 30 },
      requestsPerHour: { type: Number, default: 200 },
      requestsPerDay: { type: Number, default: 1000 },
    },
    adminPath: {
      type: String,
      trim: true,
      default: process.env.ADMIN_SECRET_PATH || 'manage-9f2k8x1p',
    },
    allowedDomains: [{ type: String, trim: true }],
    blockedIps: [{ type: String, trim: true }],
    requireAuth: { type: Boolean, default: true },
    sessionTimeout: { type: Number, default: 3600 }, // seconds
  },
  
  // Active Model Selections (from NVIDIA catalog)
  activeModels: {
    chat: { type: String, default: null }, // stores modelId from NVIDIA catalog
    vision: { type: String, default: null },
    stt: { type: String, default: null },
    tts: { type: String, default: null },
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Ensure only one config document exists
aiConfigSchema.index({}, { unique: true });

const AIConfig = mongoose.model('AIConfig', aiConfigSchema);
export default AIConfig;