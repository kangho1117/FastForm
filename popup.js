// FastForm - Popup Script (100% Free & Ad Monetized Edition)
// Handles profile CRUD, Custom Fields, JSON Backup, and Sponsored Banner Rotation

(() => {
  'use strict';

  // DOM Elements
  const tabsRow = document.getElementById('tabsRow');
  const btnAddProfile = document.getElementById('btnAddProfile');
  const profileForm = document.getElementById('profileForm');
  const btnSave = document.getElementById('btnSave');
  const btnFill = document.getElementById('btnFill');
  const btnDelete = document.getElementById('btnDelete');
  const statusBar = document.getElementById('statusBar');
  const statusText = document.getElementById('statusText');

  // Ad Banner Elements
  const adBannerCard = document.getElementById('adBannerCard');
  const adLink = document.getElementById('adLink');
  const adTitle = document.getElementById('adTitle');
  const adDesc = document.getElementById('adDesc');

  // Features Elements
  const btnExportJSON = document.getElementById('btnExportJSON');
  const btnImportJSON = document.getElementById('btnImportJSON');
  const fileImportInput = document.getElementById('fileImportInput');

  // Custom Fields Elements
  const customFieldsList = document.getElementById('customFieldsList');
  const btnAddCustomField = document.getElementById('btnAddCustomField');

  const ADSTERRA_DIRECT_LINK = 'https://www.effectivecpmnetwork.com/h1g9m3z3x?key=6fcc3e71d5fce0a98f6b708fd77935fa';

  // Transparent Sponsored Ads Rotation List (Adsterra Direct Link)
  const SPONSORED_ADS = [
    {
      title: '🎁 Support FastForm (Sponsor)',
      desc: 'Click to view partner offers & help keep FastForm free.',
      url: ADSTERRA_DIRECT_LINK,
      icon: '🎁'
    },
    {
      title: '📢 Featured Partner Advertisement',
      desc: 'Check out sponsored content from our advertising partner.',
      url: ADSTERRA_DIRECT_LINK,
      icon: '📢'
    },
    {
      title: '⚡ FastForm Sponsor Link',
      desc: 'Click to explore featured links and support development.',
      url: ADSTERRA_DIRECT_LINK,
      icon: '⚡'
    }
  ];

  // Field IDs mapped to profile keys
  const FIELD_MAP = {
    profileName: 'profileName',
    fieldFirstName: 'firstName',
    fieldLastName: 'lastName',
    fieldEmail: 'email',
    fieldPhone: 'phone',
    fieldBusinessNumber: 'businessNumber',
    fieldAddress: 'address',
    fieldAddressDetail: 'addressDetail',
    fieldCity: 'city',
    fieldState: 'state',
    fieldZipcode: 'zipcode',
    fieldCountry: 'country',
    fieldCompany: 'company',
    fieldPosition: 'position',
    fieldNote: 'note'
  };

  // State
  let profiles = [];
  let activeIndex = 0;

  // ─── Initialization ────────────────────────────────────────────────

  async function init() {
    const data = await chrome.storage.local.get(['profiles', 'activeProfileIndex']);

    profiles = data.profiles || [];
    activeIndex = data.activeProfileIndex ?? 0;

    if (activeIndex >= profiles.length) activeIndex = 0;

    renderTabs();
    loadProfileToForm();
    initAdRotation();
  }

  // ─── Ad Rotation Engine ───────────────────────────────────────────

  function initAdRotation() {
    if (!adBannerCard || SPONSORED_ADS.length === 0) return;

    const randomAd = SPONSORED_ADS[Math.floor(Math.random() * SPONSORED_ADS.length)];

    const iconEl = adBannerCard.querySelector('.ad-icon');
    if (iconEl) iconEl.textContent = randomAd.icon;
    if (adTitle) adTitle.textContent = randomAd.title;
    if (adDesc) adDesc.textContent = randomAd.desc;
    if (adLink) adLink.href = randomAd.url;
  }

  // ─── Tab Rendering ─────────────────────────────────────────────────

  function renderTabs() {
    tabsRow.innerHTML = '';

    if (profiles.length === 0) {
      setStatus(window.t('statusInitial'), '');
      profileForm.innerHTML = `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect x="8" y="6" width="32" height="36" rx="4" stroke="currentColor" stroke-width="2"/>
            <path d="M16 16h16M16 24h12M16 32h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <p>${window.t('statusInitial')}</p>
        </div>
      `;
      btnSave.style.display = 'none';
      btnFill.style.display = 'none';
      btnDelete.style.display = 'none';
      return;
    }

    btnSave.style.display = '';
    btnFill.style.display = '';
    btnDelete.style.display = '';

    profiles.forEach((profile, index) => {
      const tab = document.createElement('button');
      tab.className = `tab${index === activeIndex ? ' active' : ''}`;
      tab.innerHTML = `
        <span class="tab-icon">👤</span>
        <span>${profile.profileName || `Profile ${index + 1}`}</span>
      `;
      tab.addEventListener('click', () => switchTab(index));
      tabsRow.appendChild(tab);
    });
  }

  function switchTab(index) {
    activeIndex = index;
    chrome.storage.local.set({ activeProfileIndex: activeIndex });
    renderTabs();
    loadProfileToForm();
  }

  // ─── Custom Fields Management ─────────────────────────────────────

  function renderCustomFields(customFields = []) {
    if (!customFieldsList) return;
    customFieldsList.innerHTML = '';

    if (customFields.length === 0) {
      customFieldsList.innerHTML = `
        <p style="font-size: 11px; color: var(--text-muted); font-style: italic;">No custom fields added yet. Click "+ Add Custom Field" above.</p>
      `;
      return;
    }

    const keyPlaceholder = window.t('keyPlaceholder') || 'Key (Passport)';
    const valPlaceholder = window.t('valPlaceholder') || 'Value (M123456)';

    customFields.forEach((item, i) => {
      const row = document.createElement('div');
      row.className = 'custom-field-row';
      row.innerHTML = `
        <input type="text" class="input-custom-label" placeholder="${escapeHtml(keyPlaceholder)}" value="${escapeHtml(item.label || '')}">
        <input type="text" class="input-custom-value" placeholder="${escapeHtml(valPlaceholder)}" value="${escapeHtml(item.value || '')}">
        <button class="btn-del-custom" title="Remove">&times;</button>
      `;

      row.querySelector('.btn-del-custom').addEventListener('click', () => {
        row.remove();
        saveCurrentFormData();
      });

      customFieldsList.appendChild(row);
    });
  }

  function getCustomFieldsData() {
    if (!customFieldsList) return [];
    const rows = customFieldsList.querySelectorAll('.custom-field-row');
    const result = [];
    rows.forEach(row => {
      const label = row.querySelector('.input-custom-label')?.value.trim();
      const value = row.querySelector('.input-custom-value')?.value.trim();
      if (label || value) {
        result.push({ label, value });
      }
    });
    return result;
  }

  function escapeHtml(str) {
    return (str || '').replace(/"/g, '&quot;');
  }

  if (btnAddCustomField) {
    btnAddCustomField.addEventListener('click', () => {
      const current = getCustomFieldsData();
      current.push({ label: '', value: '' });
      renderCustomFields(current);

      const inputs = customFieldsList.querySelectorAll('.input-custom-label');
      if (inputs.length > 0) {
        inputs[inputs.length - 1].focus();
      }
    });
  }

  // ─── Profile ↔ Form ────────────────────────────────────────────────

  function loadProfileToForm() {
    if (profiles.length === 0) return;

    if (!document.getElementById('profileName')) {
      location.reload();
      return;
    }

    const profile = profiles[activeIndex] || {};

    // Auto Migration: old 'name' field → firstName + lastName
    if (profile.name && (!profile.firstName && !profile.lastName)) {
      const parts = profile.name.trim().split(/\s+/);
      profile.firstName = parts[0];
      profile.lastName = parts.length > 1 ? parts.slice(1).join(' ') : parts[0];
    }

    for (const [elemId, key] of Object.entries(FIELD_MAP)) {
      const el = document.getElementById(elemId);
      if (el) el.value = profile[key] || '';
    }

    renderCustomFields(profile.customFields || []);

    setStatus(`Editing Profile ${activeIndex + 1}`, 'info');
  }

  function getFormData() {
    const data = {};
    for (const [elemId, key] of Object.entries(FIELD_MAP)) {
      const el = document.getElementById(elemId);
      if (el) data[key] = el.value.trim();
    }
    const fn = data.firstName || '';
    const ln = data.lastName || '';
    data.name = `${fn} ${ln}`.trim() || fn || ln;

    data.customFields = getCustomFieldsData();
    return data;
  }

  function saveCurrentFormData() {
    if (profiles.length === 0) return;
    const data = getFormData();
    profiles[activeIndex] = data;
    chrome.storage.local.set({ profiles });
  }

  // ─── Actions ───────────────────────────────────────────────────────

  // Save profile
  btnSave.addEventListener('click', async () => {
    const data = getFormData();

    if (!data.profileName) {
      setStatus('Please enter a profile name', 'error');
      document.getElementById('profileName').focus();
      return;
    }

    profiles[activeIndex] = data;
    await chrome.storage.local.set({ profiles, activeProfileIndex: activeIndex });

    renderTabs();
    setStatus('Profile saved successfully ✓', 'success');

    setTimeout(() => setStatus(`Editing Profile ${activeIndex + 1}`, 'info'), 2000);
  });

  // Add profile
  btnAddProfile.addEventListener('click', async () => {
    profiles.push({
      profileName: `Profile ${profiles.length + 1}`,
      firstName: '', lastName: '', name: '', email: '', phone: '', businessNumber: '',
      address: '', addressDetail: '', city: '', state: '', zipcode: '', country: '',
      company: '', position: '', note: '', customFields: []
    });

    activeIndex = profiles.length - 1;
    await chrome.storage.local.set({ profiles, activeProfileIndex: activeIndex });

    renderTabs();
    loadProfileToForm();

    setTimeout(() => {
      const nameInput = document.getElementById('profileName');
      if (nameInput) {
        nameInput.focus();
        nameInput.select();
      }
    }, 100);
  });

  // Delete profile
  btnDelete.addEventListener('click', async () => {
    if (profiles.length === 0) return;

    const profileName = profiles[activeIndex]?.profileName || `Profile ${activeIndex + 1}`;
    if (!confirm(`Are you sure you want to delete "${profileName}"?`)) return;

    profiles.splice(activeIndex, 1);
    if (activeIndex >= profiles.length) activeIndex = Math.max(0, profiles.length - 1);

    await chrome.storage.local.set({ profiles, activeProfileIndex: activeIndex });

    renderTabs();
    loadProfileToForm();
    setStatus('Profile deleted', 'error');
    setTimeout(() => {
      if (profiles.length > 0) {
        setStatus(`Editing Profile ${activeIndex + 1}`, 'info');
      }
    }, 2000);
  });

  // Fill form
  btnFill.addEventListener('click', async () => {
    if (profiles.length === 0) return;

    saveCurrentFormData();
    const profile = profiles[activeIndex];
    if (!profile) return;

    setStatus('Filling form...', 'info');

    try {
      await chrome.runtime.sendMessage({
        action: 'fillFormFromPopup',
        profile
      });
      setStatus('Form autofilled! ✨', 'success');
      setTimeout(() => setStatus(`Editing Profile ${activeIndex + 1}`, 'info'), 2500);
    } catch (error) {
      setStatus('Failed to fill form. Try refreshing the webpage.', 'error');
    }
  });

  // Backup JSON Export/Import
  if (btnExportJSON) {
    btnExportJSON.addEventListener('click', () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(profiles, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `FastForm_Profiles_Backup.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setStatus('Profiles exported to JSON! 📥', 'success');
    });
  }

  if (btnImportJSON) {
    btnImportJSON.addEventListener('click', () => {
      fileImportInput.click();
    });
  }

  if (fileImportInput) {
    fileImportInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const imported = JSON.parse(event.target.result);
          if (Array.isArray(imported)) {
            profiles = imported;
            activeIndex = 0;
            await chrome.storage.local.set({ profiles, activeProfileIndex: 0 });
            renderTabs();
            loadProfileToForm();
            setStatus('Profiles imported successfully! 📤', 'success');
          }
        } catch (err) {
          setStatus('Invalid JSON file format', 'error');
        }
      };
      reader.readAsText(file);
    });
  }

  // ─── Status Bar ────────────────────────────────────────────────────

  function setStatus(message, type = '') {
    statusBar.className = `status-bar ${type}`;
    statusText.textContent = message;
  }

  // ─── Auto-save ─────────────────────────────────────────────────────

  let saveTimeout = null;
  profileForm.addEventListener('input', () => {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
      if (profiles.length === 0) return;
      saveCurrentFormData();

      const tabs = tabsRow.querySelectorAll('.tab');
      if (tabs[activeIndex]) {
        const nameSpan = tabs[activeIndex].querySelector('span:last-child');
        if (nameSpan) nameSpan.textContent = profiles[activeIndex]?.profileName || `Profile ${activeIndex + 1}`;
      }
    }, 500);
  });

  // ─── Initialize ────────────────────────────────────────────────────
  init();

})();
