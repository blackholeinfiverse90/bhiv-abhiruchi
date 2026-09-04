import ApiClient from './apiClient.js';

class AISettingsService {
  constructor() {
    this.aiEnabled = true;
    this.settingsLoaded = false;
    this.cacheTime = null;
    this.cacheDuration = 5 * 60 * 1000;
  }

  async isAIEnabled() {
    try {
      if (this.settingsLoaded && this.cacheTime && (Date.now() - this.cacheTime) < this.cacheDuration) {
        return this.aiEnabled;
      }

      try {
        const response = await ApiClient.get('/ai/settings');
        if (response && response.data) {
          this.aiEnabled = response.data.enabled;
          this.settingsLoaded = true;
          this.cacheTime = Date.now();
          return this.aiEnabled;
        }
      } catch (err) {
        console.warn('API call for AI settings failed:', err.message);
      }

      const localSetting = localStorage.getItem('ai_question_generation_enabled');
      if (localSetting !== null) {
        this.aiEnabled = localSetting === 'true';
        this.settingsLoaded = true;
        this.cacheTime = Date.now();
        return this.aiEnabled;
      }

      this.aiEnabled = true;
      this.settingsLoaded = true;
      this.cacheTime = Date.now();
      return this.aiEnabled;
    } catch (error) {
      console.warn('Error checking AI enabled state:', error);
      return this.aiEnabled;
    }
  }

  async setAIEnabled(enabled) {
    try {
      this.aiEnabled = enabled;
      this.settingsLoaded = true;
      this.cacheTime = Date.now();
      localStorage.setItem('ai_question_generation_enabled', enabled ? 'true' : 'false');

      try {
        await ApiClient.put('/ai/settings', { enabled });
      } catch (err) {
        console.warn('Updating AI settings on server failed:', err.message);
      }

      return true;
    } catch (error) {
      console.error('Error saving AI settings:', error);
      return false;
    }
  }

  clearCache() {
    this.settingsLoaded = false;
    this.cacheTime = null;
  }
}

export const aiSettingsService = new AISettingsService();
export default aiSettingsService;