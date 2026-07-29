// FastForm - Internationalization (i18n) Helper
// Automatically translates popup HTML & JavaScript messages using chrome.i18n API

(() => {
  'use strict';

  function applyI18n() {
    if (typeof chrome === 'undefined' || !chrome.i18n) return;

    // Translate text content
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      const message = chrome.i18n.getMessage(key);
      if (message) {
        el.textContent = message;
      }
    });

    // Translate placeholder text
    const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
    placeholders.forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const message = chrome.i18n.getMessage(key);
      if (message) {
        el.placeholder = message;
      }
    });
  }

  window.t = function(key, substitutions = null) {
    if (typeof chrome !== 'undefined' && chrome.i18n) {
      return chrome.i18n.getMessage(key, substitutions) || key;
    }
    return key;
  };

  document.addEventListener('DOMContentLoaded', applyI18n);
})();
