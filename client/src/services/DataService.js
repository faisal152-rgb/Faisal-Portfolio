import { apiService } from './apiService'; 

class DataService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.listeners = new Map();
  }

  // Cache management
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  getCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  clearCache(key) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  normalizeAssetUrl(url) {
    if (!url || typeof url !== 'string') return url;
    if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) return url;

    const assetOrigin = import.meta.env.VITE_API_ORIGIN || (
      import.meta.env.PROD
        ? 'https://faisal-portfolio-csv3.onrender.com'
        : window.location.origin
    );

    return new URL(url, assetOrigin).toString();
  }

  normalizeAbout(about) {
    if (!about) return about;

    return {
      ...about,
      profileImage: this.normalizeAssetUrl(about.profileImage),
      resume: this.normalizeAssetUrl(about.resume),
      stats: this.normalizeAboutStats(about.stats),
    };
  }

  // Event listeners for real-time updates
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(key)?.delete(callback);
    };
  }

  notify(key, data) {
    this.listeners.get(key)?.forEach(callback => callback(data));
  }

  // Portfolio data methods
  async getHero() {
    const cached = this.getCache('hero');
    if (cached) return cached;

    try {
      const response = await apiService.get('/portfolio/hero');
      if (response.success && response.data) {
        this.setCache('hero', response.data);
        return response.data;
      }
      return null;
    } catch (err) {
      return null;
    }
  }

  normalizeAboutStats(stats) {
    if (!Array.isArray(stats)) return [];

    return stats
      .map((stat) => {
        if (Array.isArray(stat)) {
          const [value, label] = stat;
          return [String(value ?? ''), String(label ?? '')];
        }

        if (stat && typeof stat === 'object') {
          return [String(stat.value ?? ''), String(stat.label ?? '')];
        }

        return ['', ''];
      })
      .filter(([value, label]) => value || label);
  }

  convertAboutStatsForApi(stats) {
    if (!Array.isArray(stats)) return [];

    return stats
      .map((stat) => {
        if (Array.isArray(stat)) {
          const [value, label] = stat;
          return { value: String(value ?? ''), label: String(label ?? '') };
        }

        if (stat && typeof stat === 'object') {
          return { value: String(stat.value ?? ''), label: String(stat.label ?? '') };
        }

        return { value: '', label: '' };
      })
      .filter((stat) => stat.value || stat.label);
  }

  async getAbout() {
    const cached = this.getCache('about');
    if (cached) return cached;

    try {
      const response = await apiService.get('/portfolio');
      if (response.success && response.data?.about) {
        const normalizedAbout = this.normalizeAbout(response.data.about);
        this.setCache('about', normalizedAbout);
        return normalizedAbout;
      }
      return null;
    } catch (err) {
      return null;
    }
  }

  async getAdminAbout() {
    const response = await apiService.adminGet('/about');
    if (response.success) {
      return this.normalizeAbout(response.data);
    }
    throw new Error('Failed to fetch admin about data');
  }

  async getSkills() {
    const cached = this.getCache('skills');
    if (cached) return cached;

    const response = await apiService.get('/portfolio');
    if (response.success && response.data?.skills) {
      this.setCache('skills', response.data.skills);
      return response.data.skills;
    }
    throw new Error('Failed to fetch skills data');
  }

  async getTimeline() {
    const cached = this.getCache('timeline');
    if (cached) return cached;

    const response = await apiService.get('/portfolio');
    if (response.success && response.data?.timeline) {
      this.setCache('timeline', response.data.timeline);
      return response.data.timeline;
    }
    throw new Error('Failed to fetch timeline data');
  }

  async getServices() {
    const cached = this.getCache('services');
    if (cached) return cached;

    const response = await apiService.get('/portfolio');
    if (response.success && response.data?.services) {
      this.setCache('services', response.data.services);
      return response.data.services;
    }
    throw new Error('Failed to fetch services data');
  }

  async getProjects() {
    const cached = this.getCache('projects');
    if (cached) return cached;

    const response = await apiService.get('/portfolio');
    if (response.success && response.data?.projects) {
      this.setCache('projects', response.data.projects);
      return response.data.projects;
    }
    throw new Error('Failed to fetch projects data');
  }

  async getFullPortfolio() {
    const cached = this.getCache('portfolio');
    if (cached) return cached;

    const response = await apiService.get('/portfolio');
    if (response.success && response.data) {
      const normalizedPortfolio = {
        ...response.data,
        about: this.normalizeAbout(response.data.about),
      };
      this.setCache('portfolio', normalizedPortfolio);
      return normalizedPortfolio;
    }
    throw new Error('Failed to fetch portfolio data');
  }

  // Admin methods (require authentication)
  async getAdminHero() {
    const response = await apiService.adminGet('/hero');
    if (response.success) {
      return response.data;
    }
    throw new Error('Failed to fetch admin hero data');
  }

  async updateHero(data) {
    const response = await apiService.adminPut('/hero', data);
    if (response.success) {
      this.clearCache('hero');
      this.clearCache('portfolio');
      this.notify('hero', response.data);
      return response.data;
    }
    throw new Error(response.message || 'Failed to update hero');
  }

  async updateAbout(data) {
    const payload = {
      ...data,
      stats: this.convertAboutStatsForApi(data.stats || []),
    };
    const response = await apiService.adminPut('/about', payload);
    if (response.success) {
      const normalized = this.normalizeAbout(response.data);
      this.clearCache('about');
      this.clearCache('portfolio');
      this.notify('about', normalized);
      return normalized;
    }
    throw new Error(response.message || 'Failed to update about');
  }

  async uploadAboutProfileImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    const response = await apiService.adminRequest('/about/profile-image', {
      method: 'POST',
      body: formData,
    });
    if (response.success && response.data?.url) return response.data.url;
    throw new Error(response.message || 'Failed to upload profile image');
  }

  async uploadAboutResume(file) {
    const formData = new FormData();
    formData.append('resume', file);
    const response = await apiService.adminRequest('/about/resume', {
      method: 'POST',
      body: formData,
    });
    if (response.success && response.data?.url) return response.data.url;
    throw new Error(response.message || 'Failed to upload resume');
  }

  async getAdminSkills() {
    const response = await apiService.adminGet('/skills');
    if (response.success) return response.data;
    throw new Error('Failed to fetch admin skills');
  }

  async createSkill(data) {
    const response = await apiService.adminPost('/skills', data);
    if (response.success) {
      this.clearCache('skills');
      this.clearCache('portfolio');
      this.notify('skills', await this.getAdminSkills());
      return response.data;
    }
    throw new Error(response.message || 'Failed to create skill');
  }

  async updateSkill(id, data) {
    const response = await apiService.adminPut(`/skills/${id}`, data);
    if (response.success) {
      this.clearCache('skills');
      this.clearCache('portfolio');
      this.notify('skills', await this.getAdminSkills());
      return response.data;
    }
    throw new Error(response.message || 'Failed to update skill');
  }

  async deleteSkill(id) {
    const response = await apiService.adminDelete(`/skills/${id}`);
    if (response.success) {
      this.clearCache('skills');
      this.clearCache('portfolio');
      this.notify('skills', await this.getAdminSkills());
      return response.data;
    }
    throw new Error(response.message || 'Failed to delete skill');
  }

  async reorderSkills(skills) {
    const response = await apiService.adminPut('/skills/reorder', { skills });
    if (response.success) {
      this.clearCache('skills');
      this.clearCache('portfolio');
      this.notify('skills', await this.getAdminSkills());
      return response.data;
    }
    throw new Error(response.message || 'Failed to reorder skills');
  }

  async getAdminTimeline() {
    const response = await apiService.adminGet('/timeline');
    if (response.success) return response.data;
    throw new Error('Failed to fetch admin timeline');
  }

  async createTimeline(data) {
    const response = await apiService.adminPost('/timeline', data);
    if (response.success) {
      this.clearCache('timeline');
      this.clearCache('portfolio');
      this.notify('timeline', await this.getAdminTimeline());
      return response.data;
    }
    throw new Error(response.message || 'Failed to create timeline item');
  }

  async updateTimeline(id, data) {
    const response = await apiService.adminPut(`/timeline/${id}`, data);
    if (response.success) {
      this.clearCache('timeline');
      this.clearCache('portfolio');
      this.notify('timeline', await this.getAdminTimeline());
      return response.data;
    }
    throw new Error(response.message || 'Failed to update timeline item');
  }

  async deleteTimeline(id) {
    const response = await apiService.adminDelete(`/timeline/${id}`);
    if (response.success) {
      this.clearCache('timeline');
      this.clearCache('portfolio');
      this.notify('timeline', await this.getAdminTimeline());
      return response.data;
    }
    throw new Error(response.message || 'Failed to delete timeline item');
  }

  async reorderTimeline(items) {
    const response = await apiService.adminPut('/timeline/reorder', { items });
    if (response.success) {
      this.clearCache('timeline');
      this.clearCache('portfolio');
      this.notify('timeline', await this.getAdminTimeline());
      return response.data;
    }
    throw new Error(response.message || 'Failed to reorder timeline');
  }

  async getAdminServices() {
    const response = await apiService.adminGet('/services');
    if (response.success) {
      // Ensure we return an array
      return Array.isArray(response.data) ? response.data : [];
    }
    throw new Error('Failed to fetch admin services');
  }

  async createService(data) {
    const response = await apiService.adminPost('/services', data);
    if (response.success) {
      this.clearCache('services');
      this.clearCache('portfolio');
      this.notify('services', await this.getAdminServices());
      return response.data;
    }
    throw new Error(response.message || 'Failed to create service');
  }

  async updateService(id, data) {
    const response = await apiService.adminPut(`/services/${id}`, data);
    if (response.success) {
      this.clearCache('services');
      this.clearCache('portfolio');
      this.notify('services', await this.getAdminServices());
      return response.data;
    }
    throw new Error(response.message || 'Failed to update service');
  }

  async deleteService(id) {
    const response = await apiService.adminDelete(`/services/${id}`);
    if (response.success) {
      this.clearCache('services');
      this.clearCache('portfolio');
      this.notify('services', await this.getAdminServices());
      return response.data;
    }
    throw new Error(response.message || 'Failed to delete service');
  }

  async reorderServices(items) {
    const response = await apiService.adminPut('/services/reorder', { items });
    if (response.success) {
      this.clearCache('services');
      this.clearCache('portfolio');
      this.notify('services', await this.getAdminServices());
      return response.data;
    }
    throw new Error(response.message || 'Failed to reorder services');
  }

  async getAdminProjects() {
    const response = await apiService.adminGet('/projects');
    if (response.success) return response.data;
    throw new Error('Failed to fetch admin projects');
  }

  async createProject(data) {
    const response = await apiService.adminPost('/projects', data);
    if (response.success) {
      this.clearCache('projects');
      this.clearCache('portfolio');
      this.notify('projects', await this.getAdminProjects());
      return response.data;
    }
    throw new Error(response.message || 'Failed to create project');
  }

  async updateProject(id, data) {
    const response = await apiService.adminPut(`/projects/${id}`, data);
    if (response.success) {
      this.clearCache('projects');
      this.clearCache('portfolio');
      this.notify('projects', await this.getAdminProjects());
      return response.data;
    }
    throw new Error(response.message || 'Failed to update project');
  }

  async uploadProjectDocument(id, file) {
    const response = await apiService.adminUpload(`/projects/${id}/document`, file, 'document');
    if (response.success && response.data) return response.data;
    throw new Error(response.message || 'Failed to upload project document');
  }

  async uploadProjectImage(id, file, kind = 'cover') {
    const response = await apiService.adminUpload(`/projects/${id}/image`, file, 'image', { kind });
    if (response.success && response.data) return response.data;
    throw new Error(response.message || 'Failed to upload project image');
  }

  async deleteProjectImage(id, url) {
    const response = await apiService.adminDelete(`/projects/${id}/image`, { url });
    if (response.success && response.data) return response.data;
    throw new Error(response.message || 'Failed to delete project image');
  }

  async deleteProject(id) {
    const response = await apiService.adminDelete(`/projects/${id}`);
    if (response.success) {
      this.clearCache('projects');
      this.clearCache('portfolio');
      this.notify('projects', await this.getAdminProjects());
      return response.data;
    }
    throw new Error(response.message || 'Failed to delete project');
  }

  async reorderProjects(items) {
    const response = await apiService.adminPut('/projects/reorder', { items });
    if (response.success) {
      this.clearCache('projects');
      this.clearCache('portfolio');
      this.notify('projects', await this.getAdminProjects());
      return response.data;
    }
    throw new Error(response.message || 'Failed to reorder projects');
  }

  // Messages
  async getMessages(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await apiService.get(`/messages?${queryString}`);
    if (response.success) return response;
    throw new Error(response.message || 'Failed to fetch messages');
  }

  async getMessage(id) {
    const response = await apiService.get(`/messages/${id}`);
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to fetch message');
  }

  async createMessage(data) {
    const response = await apiService.post('/messages', data);
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to send message');
  }

  async updateMessage(id, data) {
    const response = await apiService.put(`/messages/${id}`, data);
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to update message');
  }

  async deleteMessage(id) {
    const response = await apiService.delete(`/messages/${id}`);
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to delete message');
  }

  async getMessageStats() {
    const response = await apiService.get('/messages/stats');
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to fetch message stats');
  }

  async getLeads(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await apiService.adminGet(`/leads?${queryString}`);
    if (response.success) return response;
    throw new Error(response.message || 'Failed to fetch leads');
  }

  async getLead(id) {
    const response = await apiService.adminGet(`/leads/${id}`);
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to fetch lead');
  }

  async createLead(data) {
    const response = await apiService.adminPost('/leads', data);
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to create lead');
  }

  async updateLead(id, data) {
    const response = await apiService.adminPut(`/leads/${id}`, data);
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to update lead');
  }

  async getPublicLead(reference) {
    const response = await apiService.get(`/leads/public/${encodeURIComponent(reference)}`);
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to fetch lead');
  }

  async updatePublicLead(reference, data) {
    const response = await apiService.patch(`/leads/public/${encodeURIComponent(reference)}`, data);
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to update lead');
  }

  async renewPublicLead(reference) {
    const response = await apiService.post(`/leads/public/${encodeURIComponent(reference)}/renew`, {});
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to renew lead');
  }

  async deleteLead(id) {
    const response = await apiService.adminDelete(`/leads/${id}`);
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to delete lead');
  }

  async getLeadStats() {
    const response = await apiService.adminGet('/leads/stats');
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to fetch lead stats');
  }

  async getAssistantMeetings() {
    const response = await apiService.adminGet('/ai/meetings');
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to fetch meetings');
  }

  // AI - Public endpoint (no auth required) — for chat UI on public pages
  async getAISettingsPublic() {
    const response = await apiService.get('/ai/settings/public');
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to fetch AI settings');
  }

  // AI - Admin endpoint (auth required) — for admin dashboard
  async getAISettings() {
    const response = await apiService.adminGet('/ai/settings');
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to fetch AI settings');
  }

  async updateAISettings(data) {
    const response = await apiService.adminPut('/ai/settings', data);
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to update AI settings');
  }
  async chatWithAI(message, persona, model, sessionId, messageId) {
    const response = await apiService.post('/ai/workflow', { message, persona, model, sessionId, messageId });
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to chat with AI');
  }

  async uploadAIAttachment(file) {
    const response = await apiService.upload('/ai/attachments', file);
    if (response.success && response.data) return response.data;
    throw new Error(response.message || 'Failed to upload attachment');
  }

  async analyzeAIImage(imageData, fileName) {
    const response = await apiService.post('/ai/chat', {
      message: `Analyze the uploaded image named "${fileName}". Describe the visible content, important details, and any readable text. Be honest about anything unclear.`,
      imageData,
    });
    if (response.success && response.data) return response.data;
    throw new Error(response.message || 'Failed to analyze image');
  }

  async getAIModels() {
    const response = await apiService.adminGet('/ai/models');
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to fetch AI models');
  }

  async createAIModel(data) {
    const response = await apiService.adminPost('/ai/models', data);
    if (response.success) return response.data;
    
    // Build detailed error message from validation errors if available
    let errorMsg = response.message || 'Failed to create AI model';
    if (response.errors && response.errors.length > 0) {
      const fieldErrors = response.errors.map(e => `${e.field}: ${e.message}`).join(', ');
      errorMsg = `Validation failed: ${fieldErrors}`;
    }
    throw new Error(errorMsg);
  }

  async updateAIModel(id, data) {
    const response = await apiService.adminPut(`/ai/models/${id}`, data);
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to update AI model');
  }

  async deleteAIModel(id) {
    const response = await apiService.adminDelete(`/ai/models/${id}`);
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to delete AI model');
  }

  async setDefaultAIModel(id) {
    const response = await apiService.adminPost(`/ai/models/${id}/default`);
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to set default model');
  }

  async getAIPersonas() {
    const response = await apiService.adminGet('/ai/personas');
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to fetch AI personas');
  }

  async createAIPersona(data) {
    const response = await apiService.adminPost('/ai/personas', data);
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to create AI persona');
  }

  async updateAIPersona(id, data) {
    const response = await apiService.adminPut(`/ai/personas/${id}`, data);
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to update AI persona');
  }

  async deleteAIPersona(id) {
    const response = await apiService.adminDelete(`/ai/personas/${id}`);
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to delete AI persona');
  }

  async getKnowledgeBase(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await apiService.adminGet(`/ai/knowledge?${queryString}`);
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to fetch knowledge base');
  }

  async createKnowledgeEntry(data) {
    const response = await apiService.adminPost('/ai/knowledge', data);
    if (response.success) return response.data;
    const validationMessage = response.errors?.length
      ? `Validation failed: ${response.errors.map(error => `${error.field}: ${error.message}`).join(', ')}`
      : null;
    throw new Error(validationMessage || response.message || 'Failed to create knowledge entry');
  }

  async updateKnowledgeEntry(id, data) {
    const response = await apiService.adminPut(`/ai/knowledge/${id}`, data);
    if (response.success) return response.data;
    const validationMessage = response.errors?.length
      ? `Validation failed: ${response.errors.map(error => `${error.field}: ${error.message}`).join(', ')}`
      : null;
    throw new Error(validationMessage || response.message || 'Failed to update knowledge entry');
  }

  async deleteKnowledgeEntry(id) {
    const response = await apiService.adminDelete(`/ai/knowledge/${id}`);
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to delete knowledge entry');
  }

  async getAPIKeys() {
    const response = await apiService.adminGet('/ai/api-keys');
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to fetch API keys');
  }

  async getAPIKeysWithValues() {
    const response = await apiService.adminGet('/ai/api-keys-with-values');
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to fetch API keys');
  }

  async createAPIKey(data) {
    const response = await apiService.adminPost('/ai/api-keys', data);
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to create API key');
  }

  async updateAPIKey(id, data) {
    const response = await apiService.adminPut(`/ai/api-keys/${id}`, data);
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to update API key');
  }

  async deleteAPIKey(id) {
    const response = await apiService.adminDelete(`/ai/api-keys/${id}`);
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to delete API key');
  }

  async getIntegrations() {
    const response = await apiService.adminGet('/ai/integrations');
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to fetch integrations');
  }

  async getGoogleAuthUrl(provider, redirect = `${window.location.origin}/admin`) {
    const response = await apiService.get(`/ai/integrations/${provider}/connect?redirect=${encodeURIComponent(redirect)}`);
    if (response.success) return response.data.authUrl;
    throw new Error(response.message || 'Failed to start Google OAuth');
  }

  async testGoogleIntegration(provider) {
    const response = await apiService.get(`/ai/integrations/${provider}/test`);
    if (response.success) return response.data;
    throw new Error(response.message || `Failed to test ${provider} integration`);
  }

  async disconnectGoogleIntegration(provider) {
    const response = await apiService.post(`/ai/integrations/${provider}/disconnect`, {});
    if (response.success) return response.data;
    throw new Error(response.message || `Failed to disconnect ${provider} integration`);
  }

  async connectWhatsAppIntegration() {
    const response = await apiService.post('/ai/integrations/whatsapp/connect', {});
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to connect WhatsApp integration');
  }

  async testWhatsAppIntegration() {
    const response = await apiService.get('/ai/integrations/whatsapp/test');
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to test WhatsApp integration');
  }

  async disconnectWhatsAppIntegration() {
    const response = await apiService.post('/ai/integrations/whatsapp/disconnect', {});
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to disconnect WhatsApp integration');
  }

  async updateGmailIntegration(data) {
    const response = await apiService.adminPut('/ai/integrations/gmail', data);
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to update Gmail integration');
  }

  async updateCalendarIntegration(data) {
    const response = await apiService.adminPut('/ai/integrations/calendar', data);
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to update Calendar integration');
  }

  async updateWhatsAppIntegration(data) {
    const response = await apiService.adminPut('/ai/integrations/whatsapp', data);
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to update WhatsApp integration');
  }

  async getSecuritySettings() {
    const response = await apiService.adminGet('/ai/security');
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to fetch security settings');
  }

  async updateSecuritySettings(data) {
    const response = await apiService.adminPut('/ai/security', data);
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to update security settings');
  }

  // Security
  async getSecurityDashboard() {
    const response = await apiService.get('/security/dashboard');
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to fetch security dashboard');
  }

  async getSecurityUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await apiService.get(`/security/users?${queryString}`);
    if (response.success) return response;
    throw new Error(response.message || 'Failed to fetch security users');
  }

  async getUserSecurity(id) {
    const response = await apiService.get(`/security/users/${id}`);
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to fetch user security');
  }

  async unlockUser(id) {
    const response = await apiService.post(`/security/users/${id}/unlock`);
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to unlock user');
  }

  async deactivateUser(id) {
    const response = await apiService.post(`/security/users/${id}/deactivate`);
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to deactivate user');
  }

  async activateUser(id) {
    const response = await apiService.post(`/security/users/${id}/activate`);
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to activate user');
  }

  async adminResetPassword(id, password) {
    const response = await apiService.post(`/security/users/${id}/reset-password`, { newPassword: password });
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to reset password');
  }

  async getAuditLog() {
    const response = await apiService.get('/security/audit-log');
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to fetch audit log');
  }

  async updateSecuritySettings(data) {
    const response = await apiService.put('/security/settings', data);
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to update security settings');
  }

  async blockIP(ip, reason) {
    const response = await apiService.post('/security/block-ip', { ip, reason });
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to block IP');
  }

  async unblockIP(ip) {
    const response = await apiService.delete(`/security/block-ip/${ip}`);
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to unblock IP');
  }

  async getRateLimits() {
    const response = await apiService.get('/security/rate-limits');
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to fetch rate limits');
  }

  async updateRateLimits(data) {
    const response = await apiService.put('/security/rate-limits', data);
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to update rate limits');
  }

  // Initialize socket listeners for real-time updates
  initializeSocketListeners(socket) {
    socket.on('portfolio:update', (data) => {
      this.clearCache(data.type);
      this.clearCache('portfolio');
      this.notify(data.type, data.data);
    });

    socket.on('messages:update', (data) => {
      this.notify('messages', data);
    });

    socket.on('leads:update', (data) => {
      this.notify('leads', data);
    });

    socket.on('ai:update', (data) => {
      this.clearCache('ai');
      this.notify('ai', data);
      if (data.type === 'message-status') {
        this.notify('ai-message-status', data.data);
      }
    });

    socket.on('security:update', (data) => {
      this.notify('security', data);
    });

    socket.on('notification', (data) => {
      this.notify('notification', data);
    });
  }

  // NEW: getProviders method for API Manager
  async getProviders() {
    // Return static list of providers for now
    return ['nvidia', 'openai', 'anthropic', 'google', 'azure', 'aws', 'huggingface', 'replicate', 'together', 'groq', 'perplexity', 'custom'];
  }

  // Admin PUT wrapper
  async adminPut(endpoint, data) {
    const response = await apiService.adminPut(endpoint, data);
    if (response.success) return response.data;
    throw new Error(response.message || `Failed to PUT ${endpoint}`);
  }

  // Admin GET wrapper (already exists via getAdmin* but we can add generic)
  async adminGet(endpoint) {
    const response = await apiService.adminGet(endpoint);
    if (response.success) return response.data;
    throw new Error(response.message || `Failed to GET ${endpoint}`);
  }
}

export const dataService = new DataService();
