import express from 'express';
import multer from 'multer';
import {
  // Settings
  getAISettings,
  getAISettingsPublic,
  updateAISettings,
  // Chat
  chatWithAI,
  uploadAttachment,
  runAssistantWorkflow,
  getAssistantMeetings,
  // Models
  getAIModels,
  createAIModel,
  updateAIModel,
  deleteAIModel,
  setDefaultAIModel,
  // Personas
  getAIPersonas,
  createAIPersona,
  updateAIPersona,
  deleteAIPersona,
  // Knowledge Base
  getKnowledgeBase,
  createKnowledgeEntry,
  updateKnowledgeEntry,
  deleteKnowledgeEntry,
  // API Keys
  getAPIKeys,
  createAPIKey,
  updateAPIKey,
  deleteAPIKey,
  getAPIKeysWithValues,
  // Integrations
  getIntegrations,
  getIntegrationsDiagnostics,
  startGoogleOAuth,
  handleGoogleOAuthCallback,
  testGoogleIntegration,
  disconnectGoogleIntegration,
  connectWhatsAppIntegration,
  testWhatsAppIntegration,
  disconnectWhatsAppIntegration,
  updateGmailIntegration,
  updateCalendarIntegration,
  updateWhatsAppIntegration,
  // Security
  getSecuritySettings,
  updateSecuritySettings,
  // NVIDIA Catalog
  getNVIDIACatalog,
  // Active Model Selections
  getActiveModels,
  setActiveModels,
} from '../controllers/ai.controller.js';
import {
  aiSettingsValidator,
  aiModelValidator,
  aiPersonaValidator,
  aiKnowledgeValidator,
  aiApiKeyValidator,
  idValidator,
  validate,
} from '../middleware/validation.middleware.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

const allowedAttachmentTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
  'application/json',
]);

const attachmentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    const isImage = file.mimetype.startsWith('image/') && file.mimetype !== 'image/svg+xml';
    if (isImage || allowedAttachmentTypes.has(file.mimetype)) {
      return callback(null, true);
    }

    const error = new Error('Unsupported file type');
    error.statusCode = 400;
    callback(error);
  },
});

// Public route for AI chat (no auth required)
router.post('/chat', chatWithAI);
router.post('/workflow', runAssistantWorkflow);
router.post('/attachments', attachmentUpload.single('file'), uploadAttachment);
router.get('/integrations/:provider/connect', startGoogleOAuth);
router.get('/integrations/:provider/callback', handleGoogleOAuthCallback);
router.get('/integrations/:provider/test', testGoogleIntegration);
router.post('/integrations/:provider/disconnect', disconnectGoogleIntegration);
router.post('/integrations/whatsapp/connect', connectWhatsAppIntegration);
router.get('/integrations/whatsapp/test', testWhatsAppIntegration);
router.post('/integrations/whatsapp/disconnect', disconnectWhatsAppIntegration);

// Public AI settings (no auth required) — used by chat UI on public pages
router.get('/settings/public', getAISettingsPublic);

// All AI admin routes require authentication
router.use(authMiddleware);
router.get('/meetings', getAssistantMeetings);

// ============ AI SETTINGS ============
router.get('/settings', getAISettings);
router.put('/settings', aiSettingsValidator, validate, updateAISettings);

// ============ AI MODELS ============
router.get('/models', getAIModels);
router.post('/models', aiModelValidator, validate, createAIModel);
router.put('/models/:id', idValidator, aiModelValidator, validate, updateAIModel);
router.delete('/models/:id', idValidator, validate, deleteAIModel);
router.post('/models/:id/default', idValidator, validate, setDefaultAIModel);

// ============ AI PERSONAS ============
router.get('/personas', getAIPersonas);
router.post('/personas', aiPersonaValidator, validate, createAIPersona);
router.put('/personas/:id', idValidator, aiPersonaValidator, validate, updateAIPersona);
router.delete('/personas/:id', idValidator, validate, deleteAIPersona);

// ============ KNOWLEDGE BASE ============
router.get('/knowledge', getKnowledgeBase);
router.post('/knowledge', aiKnowledgeValidator, validate, createKnowledgeEntry);
router.put('/knowledge/:id', idValidator, aiKnowledgeValidator, validate, updateKnowledgeEntry);
router.delete('/knowledge/:id', idValidator, validate, deleteKnowledgeEntry);

// ============ API KEYS ============
router.get('/api-keys', getAPIKeys);
router.get('/api-keys-with-values', getAPIKeysWithValues);
router.post('/api-keys', aiApiKeyValidator, validate, createAPIKey);
router.put('/api-keys/:id', idValidator, aiApiKeyValidator, validate, updateAPIKey);
router.delete('/api-keys/:id', idValidator, validate, deleteAPIKey);

// ============ INTEGRATIONS ============
router.get('/integrations', getIntegrations);
router.get('/integrations/diagnostics', getIntegrationsDiagnostics);
router.put('/integrations/gmail', updateGmailIntegration);
router.put('/integrations/calendar', updateCalendarIntegration);
router.put('/integrations/whatsapp', updateWhatsAppIntegration);

// ============ SECURITY SETTINGS ============
router.get('/security', getSecuritySettings);
router.put('/security', updateSecuritySettings);

// ============ NVIDIA CATALOG ============
router.get('/nvidia/models', getNVIDIACatalog);

// ============ ACTIVE MODEL SELECTIONS ============
router.get('/settings/active-models', getActiveModels);
router.put('/settings/active-models', setActiveModels);

export default router;