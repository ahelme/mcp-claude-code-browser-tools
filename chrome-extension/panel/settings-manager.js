/**
 * Settings Manager - Panel Module
 *
 * Manages application settings persistence and UI synchronization.
 * Extracted from panel.js to create focused, maintainable module.
 *
 * @module panel/settings-manager
 * @version 1.0.0
 * @since 2025-10-02
 */

/**
 * Settings manager for persistent application configuration
 *
 * Features:
 * - Chrome storage API integration
 * - Settings persistence across sessions
 * - UI synchronization with settings state
 * - Default settings with override capability
 * - Type validation and bounds checking
 *
 * @class SettingsManager
 *
 * @example
 * const settingsManager = new SettingsManager();
 * await settingsManager.load();
 * settingsManager.set('serverPort', 3024);
 * await settingsManager.save();
 */
class SettingsManager {
  /**
   * Create a new settings manager
   *
   * @param {Object} [defaultSettings={}] - Default settings values
   */
  constructor(defaultSettings = {}) {
    // Default application settings
    this.defaults = {
      logLimit: 50,
      queryLimit: 30000,
      stringSizeLimit: 500,
      showRequestHeaders: false,
      showResponseHeaders: false,
      maxLogSize: 20000,
      screenshotPath: '',
      serverHost: 'localhost',
      serverPort: 3024,
      autoPaste: false,
      addToClipboard: false,
      ...defaultSettings,
    };

    // Current settings (starts with defaults)
    this.settings = { ...this.defaults };

    // Storage key for Chrome storage API
    this.storageKey = 'browserConnectorSettings';

    console.log('⚙️ SettingsManager initialized with defaults');
  }

  /**
   * Load settings from Chrome storage
   *
   * Loads persisted settings from Chrome's local storage and merges with defaults.
   * Settings not found in storage will use default values.
   *
   * @returns {Promise<Object>} Loaded settings object
   *
   * @example
   * const settings = await settingsManager.load();
   * console.log('Loaded settings:', settings);
   *
   * @since 1.0.0
   */
  async load() {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.storageKey], (result) => {
        if (result[this.storageKey]) {
          this.settings = { ...this.defaults, ...result[this.storageKey] };
          console.log('⚙️ Settings loaded from storage:', this.settings);
        } else {
          console.log('⚙️ No stored settings found, using defaults');
        }
        resolve(this.settings);
      });
    });
  }

  /**
   * Save settings to Chrome storage
   *
   * Persists current settings to Chrome's local storage for cross-session persistence.
   *
   * @returns {Promise<void>}
   *
   * @example
   * settingsManager.set('serverPort', 3025);
   * await settingsManager.save();
   *
   * @since 1.0.0
   */
  async save() {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [this.storageKey]: this.settings }, () => {
        console.log('💾 Settings saved to storage');
        resolve();
      });
    });
  }

  /**
   * Get a setting value
   *
   * @param {string} key - Setting key
   * @returns {any} Setting value
   *
   * @example
   * const port = settingsManager.get('serverPort');
   * console.log('Server port:', port); // 3024
   *
   * @since 1.0.0
   */
  get(key) {
    return this.settings[key];
  }

  /**
   * Get all settings
   *
   * @returns {Object} All current settings
   *
   * @example
   * const allSettings = settingsManager.getAll();
   *
   * @since 1.0.0
   */
  getAll() {
    return { ...this.settings };
  }

  /**
   * Set a setting value
   *
   * Updates a setting value in memory (does not persist until save() is called).
   *
   * @param {string} key - Setting key
   * @param {any} value - Setting value
   * @param {boolean} [autoSave=false] - Whether to automatically save after update
   * @returns {Promise<void>|void} Promise if autoSave is true
   *
   * @example
   * // Manual save
   * settingsManager.set('serverPort', 3025);
   * await settingsManager.save();
   *
   * @example
   * // Auto-save
   * await settingsManager.set('serverPort', 3025, true);
   *
   * @since 1.0.0
   */
  set(key, value, autoSave = false) {
    const oldValue = this.settings[key];
    this.settings[key] = value;

    console.log(`⚙️ Setting updated: ${key}: ${oldValue} → ${value}`);

    if (autoSave) {
      return this.save();
    }
  }

  /**
   * Set multiple settings at once
   *
   * @param {Object} updates - Object with key-value pairs to update
   * @param {boolean} [autoSave=false] - Whether to automatically save after updates
   * @returns {Promise<void>|void} Promise if autoSave is true
   *
   * @example
   * await settingsManager.setMany({
   *   serverHost: 'localhost',
   *   serverPort: 3024,
   *   logLimit: 100
   * }, true);
   *
   * @since 1.0.0
   */
  setMany(updates, autoSave = false) {
    for (const [key, value] of Object.entries(updates)) {
      this.settings[key] = value;
    }

    console.log('⚙️ Multiple settings updated:', Object.keys(updates));

    if (autoSave) {
      return this.save();
    }
  }

  /**
   * Reset settings to defaults
   *
   * @param {boolean} [autoSave=false] - Whether to automatically save after reset
   * @returns {Promise<void>|void} Promise if autoSave is true
   *
   * @example
   * await settingsManager.reset(true);
   *
   * @since 1.0.0
   */
  reset(autoSave = false) {
    this.settings = { ...this.defaults };
    console.log('🔄 Settings reset to defaults');

    if (autoSave) {
      return this.save();
    }
  }

  /**
   * Update UI elements from current settings
   *
   * Synchronizes all UI input elements with current settings values.
   * Requires DOM elements to be initialized and accessible via getElementById.
   *
   * @param {Object} elements - Object mapping element keys to DOM elements
   *
   * @example
   * const elements = {
   *   serverHost: document.getElementById('server-host'),
   *   serverPort: document.getElementById('server-port'),
   *   // ... other elements
   * };
   * settingsManager.updateUIFromSettings(elements);
   *
   * @since 1.0.0
   */
  updateUIFromSettings(elements) {
    if (!elements) {
      console.warn('⚠️ No elements provided to updateUIFromSettings');
      return;
    }

    // Update text/number inputs
    if (elements.serverHost) elements.serverHost.value = this.settings.serverHost;
    if (elements.serverPort) elements.serverPort.value = this.settings.serverPort;
    if (elements.logLimit) elements.logLimit.value = this.settings.logLimit;
    if (elements.queryLimit) elements.queryLimit.value = this.settings.queryLimit;

    // Update checkboxes
    if (elements.addToClipboardCb)
      elements.addToClipboardCb.checked = this.settings.addToClipboard;
    if (elements.autoPasteCb) elements.autoPasteCb.checked = this.settings.autoPaste;
    if (elements.showRequestHeaders)
      elements.showRequestHeaders.checked = this.settings.showRequestHeaders;
    if (elements.showResponseHeaders)
      elements.showResponseHeaders.checked = this.settings.showResponseHeaders;
    if (elements.verboseCb) elements.verboseCb.checked = false; // Always start verbose off

    // Initialize screenshot location display
    if (elements.screenshotPathDisplay) {
      elements.screenshotPathDisplay.innerHTML = `📥&nbsp;&nbsp;Chrome Downloads Folder`;
    }

    console.log('🎨 UI updated from settings');
  }

  /**
   * Update settings from UI elements
   *
   * Reads current values from UI elements and updates settings (does not save).
   *
   * @param {Object} elements - Object mapping element keys to DOM elements
   * @param {boolean} [autoSave=false] - Whether to automatically save after update
   * @returns {Promise<void>|void} Promise if autoSave is true
   *
   * @example
   * // Update from UI and save
   * await settingsManager.updateSettingsFromUI(elements, true);
   *
   * @since 1.0.0
   */
  updateSettingsFromUI(elements, autoSave = false) {
    if (!elements) {
      console.warn('⚠️ No elements provided to updateSettingsFromUI');
      return;
    }

    // Read from text/number inputs
    if (elements.serverHost) this.settings.serverHost = elements.serverHost.value;
    if (elements.serverPort)
      this.settings.serverPort = parseInt(elements.serverPort.value, 10);
    if (elements.logLimit) this.settings.logLimit = parseInt(elements.logLimit.value, 10);
    if (elements.queryLimit)
      this.settings.queryLimit = parseInt(elements.queryLimit.value, 10);

    // Read from checkboxes
    if (elements.addToClipboardCb)
      this.settings.addToClipboard = elements.addToClipboardCb.checked;
    if (elements.autoPasteCb) this.settings.autoPaste = elements.autoPasteCb.checked;
    if (elements.showRequestHeaders)
      this.settings.showRequestHeaders = elements.showRequestHeaders.checked;
    if (elements.showResponseHeaders)
      this.settings.showResponseHeaders = elements.showResponseHeaders.checked;

    console.log('⚙️ Settings updated from UI');

    if (autoSave) {
      return this.save();
    }
  }

  /**
   * Check if a setting exists
   *
   * @param {string} key - Setting key to check
   * @returns {boolean} True if setting exists
   *
   * @example
   * if (settingsManager.has('serverPort')) {
   *   console.log('Port is configured');
   * }
   *
   * @since 1.0.0
   */
  has(key) {
    return key in this.settings;
  }

  /**
   * Get default value for a setting
   *
   * @param {string} key - Setting key
   * @returns {any} Default value for the setting
   *
   * @example
   * const defaultPort = settingsManager.getDefault('serverPort');
   *
   * @since 1.0.0
   */
  getDefault(key) {
    return this.defaults[key];
  }

  /**
   * Check if a setting has been modified from default
   *
   * @param {string} key - Setting key
   * @returns {boolean} True if setting differs from default
   *
   * @example
   * if (settingsManager.isModified('serverPort')) {
   *   console.log('Port has been customized');
   * }
   *
   * @since 1.0.0
   */
  isModified(key) {
    return this.settings[key] !== this.defaults[key];
  }

  /**
   * Get all modified settings
   *
   * @returns {Object} Object containing only settings that differ from defaults
   *
   * @example
   * const modified = settingsManager.getModified();
   * console.log('Customized settings:', modified);
   *
   * @since 1.0.0
   */
  getModified() {
    const modified = {};
    for (const [key, value] of Object.entries(this.settings)) {
      if (value !== this.defaults[key]) {
        modified[key] = value;
      }
    }
    return modified;
  }

  /**
   * Export settings as JSON
   *
   * @returns {string} JSON string of current settings
   *
   * @example
   * const json = settingsManager.exportJSON();
   * localStorage.setItem('backup', json);
   *
   * @since 1.0.0
   */
  exportJSON() {
    return JSON.stringify(this.settings, null, 2);
  }

  /**
   * Import settings from JSON
   *
   * @param {string} json - JSON string of settings
   * @param {boolean} [autoSave=false] - Whether to automatically save after import
   * @returns {Promise<void>|void} Promise if autoSave is true
   *
   * @example
   * const json = localStorage.getItem('backup');
   * await settingsManager.importJSON(json, true);
   *
   * @since 1.0.0
   */
  importJSON(json, autoSave = false) {
    try {
      const imported = JSON.parse(json);
      this.settings = { ...this.defaults, ...imported };
      console.log('⚙️ Settings imported from JSON');

      if (autoSave) {
        return this.save();
      }
    } catch (error) {
      console.error('❌ Failed to import settings:', error);
      throw new Error('Invalid JSON settings format');
    }
  }
}

// Export for use in other modules
window.SettingsManager = SettingsManager;
